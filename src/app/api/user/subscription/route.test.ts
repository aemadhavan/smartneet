// src/app/api/user/subscription/route.test.ts  
import { vi, describe, it, expect, beforeEach, afterAll } from 'vitest';
import { GET } from './route';
import { auth } from '@clerk/nextjs/server';
import { cache } from '@/lib/cache';
import { db } from '@/db';
import { subscriptionService } from '@/lib/services/SubscriptionService';
import { format } from 'date-fns';

// Mock external modules
(vi as any).mock('@clerk/nextjs/server', () => ({
  auth: (vi as any).fn(),
}));

(vi as any).mock('@/lib/cache', () => ({
  cache: {
    get: (vi as any).fn(),
    set: (vi as any).fn(),
  },
}));

(vi as any).mock('@/db', () => ({
  db: {
    select: (vi as any).fn(),
    from: (vi as any).fn(),
    where: (vi as any).fn(),
    limit: (vi as any).fn(),
  },
}));

(vi as any).mock('@/db/schema', () => ({
  subscription_plans: {},
}));

(vi as any).mock('@/lib/services/SubscriptionService', () => ({
  subscriptionService: {
    getUserSubscription: (vi as any).fn(),
  },
}));

// Mock console.error to prevent noise during tests
const consoleErrorSpy = (vi as any).spyOn(console, 'error').mockImplementation(() => {});

describe('GET /api/user/subscription', () => {
  const userId = 'user_test_123';
  const cacheKey = `user:${userId}:subscription:details`;

  beforeEach(() => {
    (vi as any).clearAllMocks();
    (auth as any).mockResolvedValue({ userId });
    (cache.get as any).mockResolvedValue(null); // Default to cache miss
    (cache.set as any).mockResolvedValue(undefined);
    (subscriptionService.getUserSubscription as any).mockResolvedValue(null); // Default to no subscription
    // Default DB mock for select operations
    (db.select as any).mockImplementation(() => ({
      from: (vi as any).fn().mockReturnThis(),
      where: (vi as any).fn().mockReturnThis(),
      limit: (vi as any).fn().mockResolvedValue([]), // Default to no plan found
    }));
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should return 401 if user is not authenticated', async () => {
    (auth as any).mockResolvedValue({ userId: null });
    const response = await GET();
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ error: 'Authentication required' });
  });

  it('should return cached data if available', async () => {
    const mockCachedData = {
      subscription_id: 1,
      user_id: userId,
      plan_id: 1,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date().toISOString(),
      trial_end: null,
      canceled_at: null,
      plan: {
        plan_id: 1,
        plan_name: 'Premium',
        plan_code: 'premium',
      },
      formattedDates: {
        currentPeriodStart: format(new Date(), 'dd MMMM yyyy'),
        currentPeriodEnd: format(new Date(), 'dd MMMM yyyy'),
        trialEnd: null,
        canceledAt: null,
      },
    };
    (cache.get as any).mockResolvedValue(mockCachedData);

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ subscription: mockCachedData, source: 'cache' });
    expect(cache.get).toHaveBeenCalledWith(cacheKey);
    expect(subscriptionService.getUserSubscription).not.toHaveBeenCalled();
  });

  it('should return 404 if no subscription found in DB', async () => {
    // subscriptionService.getUserSubscription is already mocked to return null by default
    const response = await GET();
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({ error: 'No subscription found' });
  });

  it('should return 200 with null plan if subscription found but plan not found', async () => {
    const mockUserSubscription = {
      subscription_id: 1,
      user_id: userId,
      plan_id: 999, // Non-existent plan
      current_period_start: new Date().toISOString(),
      current_period_end: new Date().toISOString(),
      trial_end: null,
      canceled_at: null,
    };
    (subscriptionService.getUserSubscription as any).mockResolvedValue(mockUserSubscription);
    // db.select for plans is already mocked to return [] by default

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.subscription.plan).toBeNull();
    expect(body.subscription.user_id).toBe(userId);
    expect(body.source).toBe('database');
  });

  it('should fetch from DB, return data, and cache it', async () => {
    const mockUserSubscription = {
      subscription_id: 1,
      user_id: userId,
      plan_id: 1,
      current_period_start: new Date('2025-01-01'),
      current_period_end: new Date('2026-01-01'),
      trial_end: null,
      canceled_at: null,
    };
    const mockPlan = {
      plan_id: 1,
      plan_name: 'Basic',
      plan_code: 'free',
    };

    (subscriptionService.getUserSubscription as any).mockResolvedValue(mockUserSubscription);
    (db.select as any).mockImplementationOnce(() => ({
      from: (vi as any).fn().mockReturnThis(),
      where: (vi as any).fn().mockReturnThis(),
      limit: (vi as any).fn().mockResolvedValue([mockPlan]),
    }));

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.subscription.user_id).toBe(userId);
    expect(body.subscription.plan.plan_name).toBe('Basic');
    expect(body.subscription.formattedDates.currentPeriodStart).toBe(format(mockUserSubscription.current_period_start, 'dd MMMM yyyy'));
    expect(body.source).toBe('database');
    expect(cache.set).toHaveBeenCalledWith(cacheKey, expect.any(Object), 300);
  });

  it('should handle subscription with trial_end and canceled_at dates', async () => {
    const mockUserSubscription = {
      subscription_id: 2,
      user_id: userId,
      plan_id: 2,
      current_period_start: new Date('2024-06-01'),
      current_period_end: new Date('2024-07-01'),
      trial_end: new Date('2024-06-15'),
      canceled_at: new Date('2024-06-20'),
    };
    const mockPlan = {
      plan_id: 2,
      plan_name: 'Premium',
      plan_code: 'premium',
    };

    (subscriptionService.getUserSubscription as any).mockResolvedValue(mockUserSubscription);
    (db.select as any).mockImplementationOnce(() => ({
      from: (vi as any).fn().mockReturnThis(),
      where: (vi as any).fn().mockReturnThis(),
      limit: (vi as any).fn().mockResolvedValue([mockPlan]),
    }));

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.subscription.formattedDates.trialEnd).toBe(format(mockUserSubscription.trial_end, 'dd MMMM yyyy'));
    expect(body.subscription.formattedDates.canceledAt).toBe(format(mockUserSubscription.canceled_at, 'dd MMMM yyyy'));
  });

  it('should handle generic errors gracefully', async () => {
    (subscriptionService.getUserSubscription as any).mockRejectedValue(new Error('Service error'));

    const response = await GET();
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({ error: 'Failed to fetch subscription details' });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching user subscription:',
      expect.any(Error)
    );
  });

  it('should handle cache set errors and return 500', async () => {
    const mockUserSubscription = {
      subscription_id: 1,
      user_id: userId,
      plan_id: 1,
      current_period_start: new Date('2025-01-01'),
      current_period_end: new Date('2026-01-01'),
      trial_end: null,
      canceled_at: null,
    };
    const mockPlan = {
      plan_id: 1,
      plan_name: 'Basic',
      plan_code: 'free',
    };

    (subscriptionService.getUserSubscription as any).mockResolvedValue(mockUserSubscription);
    (db.select as any).mockImplementationOnce(() => ({
      from: (vi as any).fn().mockReturnThis(),
      where: (vi as any).fn().mockReturnThis(),
      limit: (vi as any).fn().mockResolvedValue([mockPlan]),
    }));
    (cache.set as any).mockRejectedValue(new Error('Cache write error'));

    const response = await GET();
    expect(response.status).toBe(500); // Returns 500 because cache.set error is caught
    const body = await response.json();
    expect(body).toEqual({ error: 'Failed to fetch subscription details' });
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error fetching user subscription:',
      expect.any(Error)
    );
  });
});
