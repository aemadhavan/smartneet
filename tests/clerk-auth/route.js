// app/api/test/clerk-auth/route.js

import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs';

/**
 * Test-only API endpoint for Clerk authentication in tests
 * This bypasses the normal OAuth flow for testing purposes
 *
 * @param {Request} request - The incoming request
 * @returns {NextResponse} - Response with auth session
 */
export async function POST(request) {
  console.log('Test Clerk Auth API called');
  
  // IMPORTANT: Only allow in test environment - temporarily disabled for debugging
  // if (process.env.NODE_ENV !== 'test') {
  //   console.log(`Rejecting due to environment: ${process.env.NODE_ENV} !== test`);
  //   return NextResponse.json(
  //     { error: 'This endpoint is only available in test environment' },
  //     { status: 403 }
  //   );
  // }

  try {
    const body = await request.json();
    const { email, provider = 'google' } = body;
    
    console.log(`Auth request received for email: ${email}, provider: ${provider}`);

    if (!email) {
      console.log('No email provided in request');
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // For test environment, we'll use a simplified approach without actual Clerk API calls
    // This helps isolate test issues from Clerk API issues
    
    console.log('Creating test session without actual Clerk API calls');
    
    // Mock user ID that would normally come from Clerk
    const userId = `user_${Buffer.from(email).toString('base64')}`;
    
    // Mock session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    
    // Create cookies needed for authentication
    const cookieDomain = new URL(process.env.NEXT_PUBLIC_CLERK_FRONTEND_API || 'http://localhost:3000').hostname;
    console.log(`Using cookie domain: ${cookieDomain}`);
    
    const cookies = [
      {
        name: '__session',
        value: sessionId,
        domain: cookieDomain === 'localhost' ? undefined : cookieDomain, // Playwright has issues with localhost domain cookies
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
      },
      // You may need additional cookies depending on your Clerk setup
      {
        name: 'clerk_test_mode',
        value: 'true',
        domain: cookieDomain === 'localhost' ? undefined : cookieDomain,
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
      }
    ];
    
    // Log the cookies we're creating
    console.log('Created test cookies:', JSON.stringify(cookies, null, 2));
    
    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
      },
      session: {
        id: sessionId,
      },
      cookies,
    }, { status: 200 });
    
    /* Uncomment to use the actual Clerk API when ready
    // Find or create a test user
    let user;
    try {
      // Try to find existing user
      console.log('Looking for existing user in Clerk');
      const users = await clerkClient.users.getUserList({
        emailAddress: [email],
      });
      
      user = users.length > 0 ? users[0] : null;
      console.log(user ? 'Existing user found' : 'No existing user found');
      
      // Create user if not found
      if (!user) {
        console.log('Creating new user in Clerk');
        user = await clerkClient.users.createUser({
          emailAddress: [email],
          firstName: 'Test',
          lastName: 'User',
          externalId: `test-user-${Date.now()}`,
        });
        console.log(`Created user with ID: ${user.id}`);
      }
    } catch (error) {
      console.error('Error finding/creating test user:', error);
      return NextResponse.json(
        { error: 'Failed to find or create test user', details: error.message },
        { status: 500 }
      );
    }

    // Create a session for the user
    console.log(`Creating session for user ID: ${user.id}`);
    const session = await clerkClient.sessions.createSession({
      userId: user.id,
      expireInSeconds: 60 * 60, // 1 hour session
    });
    console.log(`Created session with ID: ${session.id}`);

    // Get cookies needed for client auth
    const cookieDomain = new URL(process.env.NEXT_PUBLIC_CLERK_FRONTEND_API || 'http://localhost:3000').hostname;
    console.log(`Using cookie domain: ${cookieDomain}`);
    
    const cookies = [
      {
        name: '__session',
        value: session.id,
        domain: cookieDomain === 'localhost' ? undefined : cookieDomain, // Omit domain for localhost
        path: '/',
        expires: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
      },
    ];
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email,
      },
      session: {
        id: session.id,
      },
      cookies,
    });
    */
  } catch (error) {
    console.error('Test auth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed', details: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}