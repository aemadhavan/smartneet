// src/lib/middleware/subscriptionMiddleware.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { subscriptionService } from '@/lib/services/SubscriptionService';

/**
 * Middleware to check if user can take a test based on their subscription
 * Can be used as a server action or in API routes
 */
export async function checkSubscriptionLimitServerAction(userId: string) {
  try {
    // Check if user can take a test
    const { canTake, reason } = await subscriptionService.canUserTakeTest(userId);
    
    if (!canTake) {
      return {
        success: false,
        message: reason || 'You cannot take this test due to subscription limitations',
        limitReached: true
      };
    }
    
    return { success: true, limitReached: false };
  } catch (error) {
    console.error('Error checking subscription limit:', error);
    return {
      success: false,
      message: 'An error occurred while checking your subscription',
      limitReached: false
    };
  }
}

/**
 * Middleware for API routes
 */
export async function checkSubscriptionLimit() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user can take a test
    const { canTake, reason } = await subscriptionService.canUserTakeTest(userId);
    
    if (!canTake) {
      return NextResponse.json(
        { 
          success: false, 
          message: reason || 'You cannot take this test due to subscription limitations',
          limitReached: true
        },
        { status: 403 }
      );
    }
    
    // Let the request proceed
    return null;
  } catch (error) {
    console.error('Error in subscription middleware:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred while checking your subscription' },
      { status: 500 }
    );
  }
}

/**
 * Update test count after a test is taken
 */
export async function incrementTestUsage(userId: string) {
  try {
    await subscriptionService.incrementTestCount(userId);
    return true;
  } catch (error) {
    console.error('Error incrementing test count:', error);
    return false;
  }
}