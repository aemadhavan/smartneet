// src/app/api/user/test-limits/route.test.ts
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from './route';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { subscription_plans } from '@/db/schema';
import { subscriptionService } from '@/lib/services/SubscriptionService';
import { cache } from '@/lib/cache';

// Mock external modules
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
  },
}));

vi.mock('@/db/schema', () => ({
  subscription_plans: {},
}));

vi.mock('@/lib/services/SubscriptionService', () => ({
  subscriptionService: {
    getUserSubscription: vi.fn(),
    resetDailyCounterIfNeeded: vi.fn(),
    canUserTakeTest: vi.fn(),
  },
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// Mock console.error and console.log to prevent noise during tests
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('GET /api/user/test-limits', () => {
  const userId = 'user_test_123';
  const cacheKey = `user:${userId}:test-limits`;

  beforeEach(() => {
    vi.clearAllMocks();
    (auth as vi.Mock).mockResolvedValue({ userId });
    (cache.get as vi.Mock).mockResolvedValue(null); // Default to cache miss
    (cache.set as vi.Mock).mockResolvedValue(undefined);
    (subscriptionService.getUserSubscription as vi.Mock).mockResolvedValue(null); // Default to no subscription
    (subscriptionService.resetDailyCounterIfNeeded as vi.Mock).mockResolvedValue(undefined);
    (subscriptionService.canUserTakeTest as vi.Mock).mockResolvedValue({ canTake: true, reason: null });

    // Default DB mock for select operations
    (db.select as vi.Mock).mockImplementation(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), // Default to no plan found
    }));
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it('should return default free access for unauthenticated users', async () => {
    (auth as vi.Mock).mockResolvedValue({ userId: null });
    const request = new NextRequest('http://localhost/api/user/test-limits');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.limitStatus.canTake).toBe(true);
    expect(body.subscription.planCode).toBe('free');
    expect(body.source).toBe('default-unauthenticated');
  });

  it('should return cached data if available', async () => {
    const mockCachedData = {
      limitStatus: {
        canTake: true,
        isUnlimited: false,
        usedToday: 1,
        limitPerDay: 3,
        remainingToday: 2,
        reason: null,
      },
      subscription: {
        id: 1,
        planName: 'Free Plan',
        planCode: 'free',
        status: 'active',
        lastTestDate: null,
      },
    };
    (cache.get as vi.Mock).mockResolvedValue(mockCachedData);

    const request = new NextRequest('http://localhost/api/user/test-limits');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ ...mockCachedData, source: 'cache' });
    expect(cache.get).toHaveBeenCalledWith(cacheKey);
    expect(subscriptionService.getUserSubscription).not.toHaveBeenCalled();
  });

  it('should force refresh and fetch from database if skipCache is true', async () => {
    const mockCachedData = {
      limitStatus: { canTake: true, isUnlimited: false, usedToday: 1, limitPerDay: 3, remainingToday: 2, reason: null },
      subscription: { id: 1, planName: 'Free Plan', planCode: 'free', status: 'active', lastTestDate: null },
    };
    const mockDbSubscription = {
      subscription_id: 1,
      user_id: userId,
      plan_id: 1,
      tests_used_today: 0,
      last_test_date: null,
      status: 'active',
    };
    const mockFreePlan = {
      plan_id: 1,
      plan_name: 'Free Plan',
      plan_code: 'free',
      test_limit_daily: 3,
    };

    (cache.get as vi.Mock).mockResolvedValue(mockCachedData); // Cache has data
    (subscriptionService.getUserSubscription as vi.Mock)
      .mockResolvedValueOnce(mockDbSubscription) // First call for initial sub
      .mockResolvedValueOnce(mockDbSubscription); // Second call for updated sub
    (db.select as vi.Mock).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockFreePlan]),
    }));

    const request = new NextRequest('http://localhost/api/user/test-limits?t=1'); // skipCache = true
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.source).toBe('database'); // Source is actually 'database' after successful DB fetch
    expect(cache.get).not.toHaveBeenCalled(); // Cache.get should NOT be called when skipCache is true
    expect(subscriptionService.getUserSubscription).toHaveBeenCalledTimes(2);
    expect(db.select).toHaveBeenCalled();
    expect(cache.set).toHaveBeenCalledWith(cacheKey, expect.any(Object), 120);
  });

  it('should return default free plan data if no subscription found in DB', async () => {
    // subscriptionService.getUserSubscription is already mocked to return null by default
    const request = new NextRequest('http://localhost/api/user/test-limits');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.limitStatus.canTake).toBe(true);
    expect(body.subscription.planCode).toBe('free');
    expect(body.source).toBe('database'); // Source is database because it tried to fetch
    expect(consoleLogSpy).toHaveBeenCalledWith(
      `No subscription found for user ${userId}, using free plan`
    );
    expect(cache.set).toHaveBeenCalledWith(cacheKey, expect.any(Object), 120);
  });

  it('should return default free plan data if subscription found but plan not found', async () => {
    const mockDbSubscription = {
      subscription_id: 1,
      user_id: userId,
      plan_id: 999, // Non-existent plan
      tests_used_today: 0,
      last_test_date: null,
      status: 'active',
    };
    (subscriptionService.getUserSubscription as vi.Mock)
      .mockResolvedValueOnce(mockDbSubscription) // First call
      .mockResolvedValueOnce(mockDbSubscription); // Second call
    (db.select as vi.Mock).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), // Plan not found
    }));

    const request = new NextRequest('http://localhost/api/user/test-limits');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.limitStatus.canTake).toBe(true);
    expect(body.subscription.planCode).toBe('free');
    expect(body.source).toBe('database');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      `No plan found for subscription ${mockDbSubscription.subscription_id}, using free plan`
    );
    expect(cache.set).toHaveBeenCalledWith(cacheKey, expect.any(Object), 120);
  });

  it('should return correct data for a free plan user within limits', async () => {
    const mockDbSubscription = {
      subscription_id: 1,
      user_id: userId,
      plan_id: 1,
      tests_used_today: 1,
      last_test_date: new Date().toISOString(),
      status: 'active',
    };
    const mockFreePlan = {
      plan_id: 1,
      plan_name: 'Basic',
      plan_code: 'free',
      test_limit_daily: 3,
    };

    (subscriptionService.getUserSubscription as vi.Mock)
      .mockResolvedValueOnce(mockDbSubscription) // First call
      .mockResolvedValueOnce(mockDbSubscription); // Second call
    (db.select as vi.Mock).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockFreePlan]),
    }));
    (subscriptionService.canUserTakeTest as vi.Mock).mockResolvedValue({ canTake: true, reason: null });

    const request = new NextRequest('http://localhost/api/user/test-limits');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.limitStatus.canTake).toBe(true);
    expect(body.limitStatus.usedToday).toBe(1);
    expect(body.limitStatus.limitPerDay).toBe(3);
    expect(body.limitStatus.remainingToday).toBe(2);
    expect(body.subscription.planCode).toBe('free');
    expect(body.source).toBe('database');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      `[DEBUG] Test limits calculation for user ${userId}:`,
      expect.any(Object)
    );
    expect(cache.set).toHaveBeenCalledWith(cacheKey, expect.any(Object), 120);
  });

  it('should return correct data for a free plan user exceeding limits', async () => {
    const mockDbSubscription = {
      subscription_id: 1,
      user_id: userId,
      plan_id: 1,
      tests_used_today: 3,
      last_test_date: new Date().toISOString(),
      status: 'active',
    };
    const mockFreePlan = {
      plan_id: 1,
      plan_name: 'Basic',
      plan_code: 'free',
      test_limit_daily: 3,
    };

    (subscriptionService.getUserSubscription as vi.Mock)
      .mockResolvedValueOnce(mockDbSubscription) // First call
      .mockResolvedValueOnce(mockDbSubscription); // Second call
    (db.select as vi.Mock).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockFreePlan]),
    }));
    (subscriptionService.canUserTakeTest as vi.Mock).mockResolvedValue({ canTake: false, reason: 'Daily limit exceeded' });

    const request = new NextRequest('http://localhost/api/user/test-limits');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.limitStatus.canTake).toBe(false);
    expect(body.limitStatus.usedToday).toBe(3);
    expect(body.limitStatus.limitPerDay).toBe(3);
    expect(body.limitStatus.remainingToday).toBe(0);
    expect(body.limitStatus.reason).toBe('Daily limit exceeded');
    expect(body.subscription.planCode).toBe('free');
    expect(body.source).toBe('database');
    expect(cache.set).toHaveBeenCalledWith(cacheKey, expect.any(Object), 120);
  });

  it('should return correct data for a premium plan user (unlimited)', async () => {
    const mockDbSubscription = {
      subscription_id: 2,
      user_id: userId,
      plan_id: 2,
      tests_used_today: 10, // Should not affect premium limits
      last_test_date: new Date().toISOString(),
      status: 'active',
    };
    const mockPremiumPlan = {
      plan_id: 2,
      plan_name: 'Premium',
      plan_code: 'premium',
      test_limit_daily: null, // Unlimited
    };

    (subscriptionService.getUserSubscription as vi.Mock)
      .mockResolvedValueOnce(mockDbSubscription) // First call
      .mockResolvedValueOnce(mockDbSubscription); // Second call
    (db.select as vi.Mock).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockPremiumPlan]),
    }));
    (subscriptionService.canUserTakeTest as vi.Mock).mockResolvedValue({ canTake: true, reason: null });

    const request = new NextRequest('http://localhost/api/user/test-limits');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.limitStatus.canTake).toBe(true);
    expect(body.limitStatus.isUnlimited).toBe(true);
    expect(body.limitStatus.usedToday).toBe(10);
    expect(body.limitStatus.limitPerDay).toBe(null);
    expect(body.limitStatus.remainingToday).toBe(Number.MAX_SAFE_INTEGER);
    expect(body.subscription.planCode).toBe('premium');
    expect(body.source).toBe('database');
    expect(cache.set).toHaveBeenCalledWith(cacheKey, expect.any(Object), 120);
  });

  it('should handle database query timeout and return default free plan', async () => {
    // Mock Promise.race to simulate a timeout by immediately rejecting with timeout error
    vi.spyOn(Promise, 'race').mockImplementationOnce(() => {
      return Promise.reject(new Error('Database operation timeout'));
    });

    const request = new NextRequest('http://localhost/api/user/test-limits');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.limitStatus.canTake).toBe(true);
    expect(body.subscription.planCode).toBe('free');
    expect(body.source).toBe('error-default');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Database or timeout error:',
      expect.any(Error)
    );
    expect(cache.set).toHaveBeenCalledWith(cacheKey, expect.any(Object), 15);
  }, 10000); // Increase timeout to 10 seconds

  it('should handle generic database errors and return default free plan', async () => {
    (subscriptionService.getUserSubscription as vi.Mock).mockRejectedValue(new Error('DB connection failed'));

    const request = new NextRequest('http://localhost/api/user/test-limits');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.limitStatus.canTake).toBe(true);
    expect(body.subscription.planCode).toBe('free');
    expect(body.source).toBe('error-default');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Database or timeout error:',
      expect.any(Error)
    );
    expect(cache.set).toHaveBeenCalledWith(cacheKey, expect.any(Object), 15);
  });

  it('should handle cache set errors gracefully after fetching from DB', async () => {
    const mockDbSubscription = {
      subscription_id: 1,
      user_id: userId,
      plan_id: 1,
      tests_used_today: 1,
      last_test_date: new Date().toISOString(),
      status: 'active',
    };
    const mockFreePlan = {
      plan_id: 1,
      plan_name: 'Basic',
      plan_code: 'free',
      test_limit_daily: 3,
    };

    (subscriptionService.getUserSubscription as vi.Mock)
      .mockResolvedValueOnce(mockDbSubscription) // First call
      .mockResolvedValueOnce(mockDbSubscription); // Second call
    (db.select as vi.Mock).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockFreePlan]),
    }));
    
    // Make cache.set throw an error, which causes the entire operation to go to the main catch block
    (cache.set as vi.Mock).mockRejectedValue(new Error('Cache write error'));

    const request = new NextRequest('http://localhost/api/user/test-limits');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.source).toBe('unhandled-error-default'); // Cache error causes unhandled error
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Unhandled error in test limits API:',
      expect.any(Error)
    );
  });

  it('should handle subscription with Date object for last_test_date', async () => {
    const testDate = new Date('2025-06-27T10:00:00Z');
    const mockDbSubscription = {
      subscription_id: 1,
      user_id: userId,
      plan_id: 1,
      tests_used_today: 1,
      last_test_date: testDate, // Date object instead of string
      status: 'active',
    };
    const mockFreePlan = {
      plan_id: 1,
      plan_name: 'Basic',
      plan_code: 'free',
      test_limit_daily: 3,
    };

    (subscriptionService.getUserSubscription as vi.Mock)
      .mockResolvedValueOnce(mockDbSubscription) // First call
      .mockResolvedValueOnce(mockDbSubscription); // Second call
    (db.select as vi.Mock).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockFreePlan]),
    }));

    const request = new NextRequest('http://localhost/api/user/test-limits');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.limitStatus.canTake).toBe(true);
    expect(body.subscription.lastTestDate).toBe(testDate.toISOString());
    expect(body.source).toBe('database');
    // Should have covered the Date instanceof Date branch on line 134
  });

  it('should handle cache returning non-object response', async () => {
    // Mock cache to return a non-object value (e.g., null, string, number)
    (cache.get as vi.Mock).mockResolvedValue('invalid-string-response');

    const request = new NextRequest('http://localhost/api/user/test-limits');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.source).toBe('invalid-format-default');
    expect(body.limitStatus.canTake).toBe(true);
    expect(body.subscription.planCode).toBe('free');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid response format', 'invalid-string-response');
  });

  it('should handle actual timeout scenario with setTimeout execution', async () => {
    // This test will trigger the actual setTimeout rejection to cover line 82
    (subscriptionService.getUserSubscription as vi.Mock).mockImplementation(async () => {
      // Create a delay longer than the timeout to trigger the setTimeout rejection
      await new Promise(resolve => setTimeout(resolve, 6000)); // 6 seconds > 5 second timeout
      return { subscription_id: 1, user_id: userId, plan_id: 1 };
    });

    const request = new NextRequest('http://localhost/api/user/test-limits');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.source).toBe('error-default');
    expect(body.limitStatus.canTake).toBe(true);
    expect(body.subscription.planCode).toBe('free');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Database or timeout error:',
      expect.objectContaining({ message: 'Database operation timeout' })
    );
  }, 15000); // Increase test timeout to 15 seconds

  it('should handle canTake false with undefined reason (covering line 149 branch)', async () => {
    const mockDbSubscription = {
      subscription_id: 1,
      user_id: userId,
      plan_id: 1,
      tests_used_today: 3,
      last_test_date: new Date().toISOString(),
      status: 'active',
    };
    const mockFreePlan = {
      plan_id: 1,
      plan_name: 'Basic',
      plan_code: 'free',
      test_limit_daily: 3,
    };

    (subscriptionService.getUserSubscription as vi.Mock)
      .mockResolvedValueOnce(mockDbSubscription) // First call
      .mockResolvedValueOnce(mockDbSubscription); // Second call
    (db.select as vi.Mock).mockImplementationOnce(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([mockFreePlan]),
    }));
    // Mock canUserTakeTest to return false with undefined reason (not null)
    (subscriptionService.canUserTakeTest as vi.Mock).mockResolvedValue({ canTake: false, reason: undefined });

    const request = new NextRequest('http://localhost/api/user/test-limits');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.limitStatus.canTake).toBe(false);
    expect(body.limitStatus.reason).toBe(null); // Should be null due to || null fallback
    expect(body.source).toBe('database');
    // This should cover the `(reason || null)` branch on line 149
  });

  it('should handle unhandled errors in the main try-catch block', async () => {
    (auth as vi.Mock).mockImplementation(() => {
      throw new Error('Auth error');
    });

    const request = new NextRequest('http://localhost/api/user/test-limits');
    const response = await GET(request);
    expect(response.status).toBe(200); // Returns 200 with default data
    const body = await response.json();
    expect(body.source).toBe('unhandled-error-default');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Unhandled error in test limits API:',
      expect.any(Error)
    );
  });
});
