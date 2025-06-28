
import { POST } from '@/app/api/checkout/route';
import { NextRequest } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createCheckoutSession } from '@/lib/stripe';
import { subscriptionService } from '@/lib/services/SubscriptionService';
import { vi } from 'vitest';

// Mock external dependencies
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}));

vi.mock('@/lib/stripe', () => ({
  createCheckoutSession: vi.fn(),
}));

vi.mock('@/db/schema', () => ({
  subscription_plans: {
    plan_id: 'plan_id',
    is_active: 'is_active',
    plan_code: 'plan_code',
    price_id_stripe: 'price_id_stripe',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
}));

// Create a mock that can be controlled in tests
const dbLimitMock = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: dbLimitMock,
        }),
      }),
    }),
  },
}));

vi.mock('@/lib/services/SubscriptionService', () => ({
  subscriptionService: {
    createOrUpdateSubscription: vi.fn(),
  },
}));

describe('POST /api/checkout', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    (auth as any).mockResolvedValue({ userId: null });

    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ planId: 'some-plan' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Authentication required');
  });

  it('should return 400 if planId is not provided', async () => {
    (auth as any).mockResolvedValue({ userId: 'user-123' });

    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Plan ID is required');
  });

  it('should return 404 if plan is not found', async () => {
    (auth as any).mockResolvedValue({ userId: 'user-123' });
    dbLimitMock.mockResolvedValue([]);

    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ planId: 'non-existent-plan' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe('Plan not found');
  });

  it('should return 400 if plan is not active', async () => {
    (auth as any).mockResolvedValue({ userId: 'user-123' });
    const mockPlan = { plan_id: 'inactive-plan', is_active: false };
    dbLimitMock.mockResolvedValue([mockPlan]);

    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ planId: 'inactive-plan' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('Plan is not available');
  });

  it('should return 400 if user email is not found', async () => {
    (auth as any).mockResolvedValue({ userId: 'user-123' });
    const mockPlan = { plan_id: 'active-plan', is_active: true, plan_code: 'paid' };
    dbLimitMock.mockResolvedValue([mockPlan]);
    (currentUser as any).mockResolvedValue({ emailAddresses: [] });

    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ planId: 'active-plan' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe('User email not found');
  });

  it('should handle free plan subscription', async () => {
    (auth as any).mockResolvedValue({ userId: 'user-123' });
    const mockPlan = { plan_id: 'free-plan', is_active: true, plan_code: 'free' };
    dbLimitMock.mockResolvedValue([mockPlan]);
    (currentUser as any).mockResolvedValue({
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    });

    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ planId: 'free-plan' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.redirectUrl).toBeDefined();
    expect(subscriptionService.createOrUpdateSubscription).toHaveBeenCalled();
  });

  it('should create a checkout session for a paid plan', async () => {
    (auth as any).mockResolvedValue({ userId: 'user-123' });
    const mockPlan = {
      plan_id: 'paid-plan',
      is_active: true,
      plan_code: 'paid',
      price_id_stripe: 'price-123',
    };
    dbLimitMock.mockResolvedValue([mockPlan]);
    (currentUser as any).mockResolvedValue({
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    });
    (createCheckoutSession as any).mockResolvedValue({ sessionId: 'session-123' });

    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ planId: 'paid-plan' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.isPaid).toBe(true);
    expect(body.sessionId).toBe('session-123');
    expect(createCheckoutSession).toHaveBeenCalled();
  });

  it('should return 500 on an unexpected error', async () => {
    (auth as any).mockRejectedValue(new Error('Something went wrong'));

    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ planId: 'any-plan' }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Failed to create checkout session');
  });
});
