// src/app/api/customer-portal/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/stripe', () => ({
  createCustomerPortalSession: vi.fn(),
}));

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(),
  },
  user_subscriptions: {},
}));

// Import mocks for typing and control
import { auth } from '@clerk/nextjs/server';
import { createCustomerPortalSession } from '@/lib/stripe';
import { db } from '@/db';

const mockedAuth = auth as vi.Mock;
const mockedCreateCustomerPortalSession = createCustomerPortalSession as vi.Mock;
const mockedDb = db as any;

describe('POST /api/customer-portal', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Mock environment variable
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  const createMockRequest = (body: any) => {
    return { json: () => Promise.resolve(body) } as NextRequest;
  };

  it('should return 401 if user is not authenticated', async () => {
    mockedAuth.mockResolvedValue({ userId: null });
    const req = createMockRequest({});

    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: 'Authentication required' });
  });

  it('should use customerId from body if provided', async () => {
    const userId = 'user_123';
    const customerId = 'cus_from_body';
    const portalUrl = 'https://stripe.com/portal/session';

    mockedAuth.mockResolvedValue({ userId });
    mockedCreateCustomerPortalSession.mockResolvedValue({ url: portalUrl });

    const req = createMockRequest({ customerId });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ url: portalUrl });
    expect(mockedCreateCustomerPortalSession).toHaveBeenCalledWith({
      customerId,
      returnUrl: 'http://localhost:3000/dashboard/subscription',
    });
    expect(mockedDb.select).not.toHaveBeenCalled();
  });

  it('should fetch customerId from DB if not in body', async () => {
    const userId = 'user_123';
    const customerId = 'cus_from_db';
    const portalUrl = 'https://stripe.com/portal/session';

    mockedAuth.mockResolvedValue({ userId });
    mockedCreateCustomerPortalSession.mockResolvedValue({ url: portalUrl });
    mockedDb.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ stripe_customer_id: customerId }]),
    });

    const req = createMockRequest({});
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ url: portalUrl });
    expect(mockedDb.select).toHaveBeenCalled();
    expect(mockedCreateCustomerPortalSession).toHaveBeenCalledWith({
      customerId,
      returnUrl: 'http://localhost:3000/dashboard/subscription',
    });
  });

  it('should return 404 if no subscription is found in DB', async () => {
    const userId = 'user_123';
    mockedAuth.mockResolvedValue({ userId });
    mockedDb.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    });

    const req = createMockRequest({});
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ error: 'No active subscription found' });
  });

  it('should return 404 if subscription has no customer_id', async () => {
    const userId = 'user_123';
    mockedAuth.mockResolvedValue({ userId });
    mockedDb.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ stripe_customer_id: null }]),
    });

    const req = createMockRequest({});
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ error: 'No active subscription found' });
  });

  it('should return 500 if stripe session creation fails', async () => {
    const userId = 'user_123';
    const customerId = 'cus_123';
    const error = new Error('Stripe error');

    mockedAuth.mockResolvedValue({ userId });
    mockedCreateCustomerPortalSession.mockRejectedValue(error);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const req = createMockRequest({ customerId });
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: 'Failed to create customer portal session' });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating customer portal session:', error);

    consoleErrorSpy.mockRestore();
  });

  it('should return 500 if database query fails', async () => {
    const userId = 'user_123';
    const error = new Error('DB error');

    mockedAuth.mockResolvedValue({ userId });
    mockedDb.select.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockRejectedValue(error),
    });
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const req = createMockRequest({});
    const response = await POST(req);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: 'Failed to create customer portal session' });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating customer portal session:', error);

    consoleErrorSpy.mockRestore();
  });
});