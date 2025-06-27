// src/app/api/subscription/route.test.ts
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from './route';
import { auth } from '@clerk/nextjs/server';
import { cache } from '@/lib/cache';
import { db } from '@/db';
import { user_subscriptions, subscription_plans } from '@/db/schema';

// Mock external modules
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
  },
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
  user_subscriptions: {},
  subscription_plans: {},
}));

// Mock console.error to prevent noise during tests
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('GET /api/subscription', () => {
  const userId = 'user_test_123';
  const cacheKey = `api:subscription:user:${userId}`;

  beforeEach(() => {
    vi.clearAllMocks();
    (auth as vi.Mock).mockResolvedValue({ userId });
    (cache.get as vi.Mock).mockResolvedValue(null); // Default to cache miss
    (cache.set as vi.Mock).mockResolvedValue(undefined);
    // Default DB mock for select operations
    (db.select as vi.Mock).mockImplementation(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), // Default to no subscription found
    }));
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should return 401 if user is not authenticated', async () => {
    (auth as vi.Mock).mockResolvedValue({ userId: null });
    const request = new NextRequest('http://localhost/api/subscription');
    const response = await GET(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('should return 401 if requesting another user data', async () => {
    const request = new NextRequest('http://localhost/api/subscription?userId=another_user');
    const response = await GET(request);
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body).toEqual({ success: false, error: 'Unauthorized' });
  });

  it('should return cached data if available', async () => {
    const mockCachedData = {
      isPremium: true,
      maxTopicsPerSubject: Infinity,
      maxTestsPerDay: Infinity,
      remainingTests: Infinity,
      planName: 'Premium',
      planCode: 'premium',
      expiresAt: null,
    };
    (cache.get as vi.Mock).mockResolvedValue(mockCachedData);

    const request = new NextRequest('http://localhost/api/subscription');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    // JSON serialization converts Infinity to null
    expect(body).toEqual({ 
      success: true, 
      data: {
        isPremium: true,
        maxTopicsPerSubject: null,
        maxTestsPerDay: null,
        remainingTests: null,
        planName: 'Premium',
        planCode: 'premium',
        expiresAt: null,
      }, 
      source: 'cache' 
    });
    expect(cache.get).toHaveBeenCalledWith(cacheKey);
    expect(db.select).not.toHaveBeenCalled();
  });

  it('should return default free plan data if no subscription found in DB', async () => {
    // db.select is already mocked to return [] by default
    const request = new NextRequest('http://localhost/api/subscription');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: {
        isPremium: false,
        maxTopicsPerSubject: 2,
        maxTestsPerDay: 3,
        remainingTests: 3,
        planName: 'Free',
        planCode: 'free',
        expiresAt: null,
      },
      source: 'database',
    });
    expect(cache.set).toHaveBeenCalledWith(cacheKey, expect.any(Object), 300);
  });

  it('should return 500 if user has subscription but plan is not found', async () => {
    (db.select as vi.Mock)
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ user_id: userId, plan_id: 999 }]), // User has sub, but invalid plan_id
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]), // Plan not found
      }));

    const request = new NextRequest('http://localhost/api/subscription');
    const response = await GET(request);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch subscription data');
    expect(body.details).toContain('Plan with ID 999 not found');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should return correct data for a free plan user', async () => {
    const mockUserSubscription = {
      user_id: userId,
      plan_id: 1, // Assuming 1 is a free plan ID
      tests_used_today: 1,
      current_period_end: null,
    };
    const mockFreePlan = {
      plan_id: 1,
      plan_name: 'Basic',
      plan_code: 'free',
      test_limit_daily: 5,
    };

    (db.select as vi.Mock)
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockUserSubscription]),
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockFreePlan]),
      }));

    const request = new NextRequest('http://localhost/api/subscription');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: {
        isPremium: false,
        maxTopicsPerSubject: 2,
        maxTestsPerDay: 5,
        remainingTests: 4,
        planName: 'Basic',
        planCode: 'free',
        expiresAt: null,
      },
      source: 'database',
    });
    expect(cache.set).toHaveBeenCalledWith(cacheKey, expect.any(Object), 300);
  });

  it('should return correct data for a premium plan user', async () => {
    const mockUserSubscription = {
      user_id: userId,
      plan_id: 2, // Assuming 2 is a premium plan ID
      tests_used_today: 10, // Should not affect premium limits
      current_period_end: new Date('2025-12-31'),
    };
    const mockPremiumPlan = {
      plan_id: 2,
      plan_name: 'Premium',
      plan_code: 'premium',
      test_limit_daily: null, // No daily limit for premium
    };

    (db.select as vi.Mock)
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockUserSubscription]),
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockPremiumPlan]),
      }));

    const request = new NextRequest('http://localhost/api/subscription');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: {
        isPremium: true,
        maxTopicsPerSubject: null, // JSON serializes Infinity to null
        maxTestsPerDay: null, // JSON serializes Infinity to null
        remainingTests: null, // JSON serializes Infinity to null
        planName: 'Premium',
        planCode: 'premium',
        expiresAt: '2025-12-31T00:00:00.000Z', // Date serializes to string
      },
      source: 'database',
    });
    expect(cache.set).toHaveBeenCalledWith(cacheKey, expect.any(Object), 300);
  });

  it('should handle null tests_used_today value in subscription', async () => {
    const mockUserSubscription = {
      user_id: userId,
      plan_id: 3,
      tests_used_today: null, // This should trigger the || 0 fallback on line 70
      current_period_end: null,
    };
    const mockPlan = {
      plan_id: 3,
      plan_name: 'Standard',
      plan_code: 'standard',
      test_limit_daily: 10,
    };

    (db.select as vi.Mock)
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockUserSubscription]),
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockPlan]),
      }));

    const request = new NextRequest('http://localhost/api/subscription');
    const response = await GET(request);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      success: true,
      data: {
        isPremium: false,
        maxTopicsPerSubject: 2,
        maxTestsPerDay: 10,
        remainingTests: 10, // Should be 10 - 0 = 10 due to || 0 fallback
        planName: 'Standard',
        planCode: 'standard',
        expiresAt: null,
      },
      source: 'database',
    });
    expect(cache.set).toHaveBeenCalledWith(cacheKey, expect.any(Object), 300);
  });

  it('should handle generic errors gracefully', async () => {
    (db.select as vi.Mock).mockImplementationOnce(() => {
      throw new Error('Database connection failed');
    });

    const request = new NextRequest('http://localhost/api/subscription');
    const response = await GET(request);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Failed to fetch subscription data');
    expect(body.details).toContain('Database connection failed');
    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
