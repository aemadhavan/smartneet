// src/app/api/user/payments/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextResponse } from 'next/server';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/services/SubscriptionService', () => ({
  subscriptionService: {
    getUserPaymentHistory: vi.fn(),
  },
}));

vi.mock('@/lib/cache', () => ({
  cache: {
    get: vi.fn(),
    set: vi.fn(),
  },
}));

// Import mocks for typing
import { auth } from '@clerk/nextjs/server';
import { subscriptionService } from '@/lib/services/SubscriptionService';
import { cache } from '@/lib/cache';

const mockedAuth = auth as vi.Mock;
const mockedGetUserPaymentHistory = subscriptionService.getUserPaymentHistory as vi.Mock;
const mockedCacheGet = cache.get as vi.Mock;
const mockedCacheSet = cache.set as vi.Mock;

describe('GET /api/user/payments', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    mockedAuth.mockResolvedValue({ userId: null });

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: 'Authentication required' });
  });

  it('should return payments from cache if available', async () => {
    const userId = 'user_123';
    const cachedPayments = [{ id: 'pay_1', amount: 1000 }];
    mockedAuth.mockResolvedValue({ userId });
    mockedCacheGet.mockResolvedValue(cachedPayments);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ payments: cachedPayments, source: 'cache' });
    expect(mockedCacheGet).toHaveBeenCalledWith(`api:user:${userId}:payments`);
    expect(mockedGetUserPaymentHistory).not.toHaveBeenCalled();
    expect(mockedCacheSet).not.toHaveBeenCalled();
  });

  it('should fetch payments from database if not in cache', async () => {
    const userId = 'user_123';
    const dbPayments = [{ id: 'pay_2', amount: 2000 }];
    mockedAuth.mockResolvedValue({ userId });
    mockedCacheGet.mockResolvedValue(null); // Not in cache
    mockedGetUserPaymentHistory.mockResolvedValue(dbPayments);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ payments: dbPayments, source: 'database' });
    expect(mockedCacheGet).toHaveBeenCalledWith(`api:user:${userId}:payments`);
    expect(mockedGetUserPaymentHistory).toHaveBeenCalledWith(userId);
    expect(mockedCacheSet).toHaveBeenCalledWith(`api:user:${userId}:payments`, dbPayments, 300);
  });

  it('should return 500 if an error occurs during auth', async () => {
    const error = new Error('Something went wrong');
    mockedAuth.mockRejectedValue(error);

    // Mock console.error to prevent logging during tests
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: 'Failed to fetch payment history' });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching payment history:', error);

    consoleErrorSpy.mockRestore();
  });

  it('should return 500 if fetching from service fails', async () => {
    const userId = 'user_123';
    const error = new Error('Database error');
    mockedAuth.mockResolvedValue({ userId });
    mockedCacheGet.mockResolvedValue(null);
    mockedGetUserPaymentHistory.mockRejectedValue(error);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: 'Failed to fetch payment history' });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching payment history:', error);

    consoleErrorSpy.mockRestore();
  });
});