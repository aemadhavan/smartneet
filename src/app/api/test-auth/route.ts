// src/app/api/test-auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClerkClient } from '@clerk/backend';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { subscription_plans, user_subscriptions } from '@/db/schema';
//import { sql } from 'drizzle-orm/sql';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

// This is a secret key specifically for authorizing test requests
// It should match what's in your .env.test file
const TEST_AUTH_SECRET = process.env.TEST_AUTH_SECRET;

// Only allow this endpoint in test environments
const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.NEXT_PUBLIC_ENABLE_TEST_API === 'true';

export async function POST(req: NextRequest) {
  // Security check 1: Only allow in test environments
  if (!isTestEnvironment) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { testUserType, testAuthSecret } = await req.json();

    // Security check 2: Verify secret key
    if (testAuthSecret !== TEST_AUTH_SECRET) {
      return NextResponse.json({ error: 'Invalid test auth secret' }, { status: 401 });
    }

    // Get or create a test user based on the requested type
    const user = await getOrCreateTestUser(testUserType);

    // Create a session token using Clerk's admin API
    const token = await createSessionToken(user.id);

    return NextResponse.json({ token, userId: user.id });
  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

async function getOrCreateTestUser(userType: 'free' | 'premium') {
  // Define email based on user type
  const email = userType === 'free' 
    ? process.env.TEST_FREE_USER_EMAIL || 'test-free@example.com'
    : process.env.TEST_PREMIUM_USER_EMAIL || 'test-premium@example.com';

  try {
    // Try to find existing user by email
    const existingUsers = await clerkClient.users.getUserList({
      emailAddress: [email],
    });

    if (existingUsers.data.length > 0) {
      return existingUsers.data[0];
    }

    // Create new test user if not found
    const newUser = await clerkClient.users.createUser({
      emailAddress: [email],
      password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
      firstName: `Test${userType === 'premium' ? 'Premium' : 'Free'}`,
      lastName: 'User',
    });

    // If premium user, set up subscription in database
    if (userType === 'premium') {
      await setupPremiumSubscription(newUser.id);
    }

    return newUser;
  } catch (error) {
    console.error('Error getting/creating test user:', error);
    throw error;
  }
}

async function createSessionToken(userId: string) {
  try {
    // Generate sign-in token
    const signInToken = await clerkClient.signInTokens.createSignInToken({
      userId,
      expiresInSeconds: 86400 // 24 hours
    });
    
    // Return the token
    return signInToken.token;
  } catch (error) {
    console.error('Error creating session token:', error);
    throw error;
  }
}

async function setupPremiumSubscription(userId: string) {
  try {
    // Check if user already has a subscription using Drizzle syntax
    const existingSubscription = await db
      .select()
      .from(user_subscriptions)
      .where(eq(user_subscriptions.user_id, userId));

    if (existingSubscription.length > 0) {
      return; // User already has a subscription
    }

    // Get premium plan ID using Drizzle syntax
    const premiumPlans = await db
      .select()
      .from(subscription_plans)
      .where(eq(subscription_plans.plan_code, 'premium'));

    if (premiumPlans.length === 0) {
      throw new Error('Premium plan not found in database');
    }

    // Create mock subscription data
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Insert subscription record using Drizzle syntax
    await db.insert(user_subscriptions).values({
      user_id: userId,
      plan_id: premiumPlans[0].plan_id,
      stripe_subscription_id: 'sub_test_' + Date.now(),
      stripe_customer_id: 'cus_test_' + Date.now(),
      status: 'active',
      current_period_start: now,
      current_period_end: nextMonth,
      tests_used_today: 0
    });
  } catch (error) {
    console.error('Error setting up premium subscription:', error);
    throw error;
  }
}