// src/app/api/subscription-plans/route.test.ts
import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { GET } from './route';
import { db } from '@/db';

// Mock external modules
(vi as any).mock('@/db', () => ({
  db: {
    select: (vi as any).fn(),
    from: (vi as any).fn(),
    where: (vi as any).fn(),
    orderBy: (vi as any).fn(),
  },
}));

(vi as any).mock('@/db/schema', () => ({
  subscription_plans: {
    is_active: 'is_active',
    price_inr: 'price_inr',
    plan_id: 'plan_id',
  },
}));

// Mock console methods to prevent noise during tests
const consoleLogSpy = (vi as any).spyOn(console, 'log').mockImplementation(() => {});
const consoleErrorSpy = (vi as any).spyOn(console, 'error').mockImplementation(() => {});

describe('GET /api/subscription-plans', () => {
  beforeEach(() => {
    (vi as any).clearAllMocks();
    // Default DB mock for select operations
    (db.select as any).mockImplementation(() => ({
      from: (vi as any).fn().mockReturnThis(),
      where: (vi as any).fn().mockReturnThis(),
      orderBy: (vi as any).fn().mockResolvedValue([]), // Default to empty array
    }));
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should return empty plans array if no active plans found in database', async () => {
    // db.select is already mocked to return [] by default
    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      plans: [],
      source: 'database',
    });
    expect(consoleLogSpy).toHaveBeenCalledWith('Fetching subscription plans from database...');
    expect(consoleLogSpy).toHaveBeenCalledWith('Found 0 active subscription plans');
  });

  it('should return plans with properly parsed JSON features', async () => {
    const mockPlans = [
      {
        plan_id: 1,
        plan_name: 'Basic',
        plan_code: 'basic',
        price_inr: 99,
        features: '["Feature 1", "Feature 2", "Feature 3"]', // JSON string
        is_active: true,
      },
      {
        plan_id: 2,
        plan_name: 'Premium',
        plan_code: 'premium',
        price_inr: 199,
        features: '["Premium Feature 1", "Premium Feature 2"]', // JSON string
        is_active: true,
      },
    ];

    (db.select as any).mockImplementationOnce(() => ({
      from: (vi as any).fn().mockReturnThis(),
      where: (vi as any).fn().mockReturnThis(),
      orderBy: (vi as any).fn().mockResolvedValue(mockPlans),
    }));

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      plans: [
        {
          plan_id: 1,
          plan_name: 'Basic',
          plan_code: 'basic',
          price_inr: 99,
          features: ['Feature 1', 'Feature 2', 'Feature 3'], // Parsed array
          is_active: true,
        },
        {
          plan_id: 2,
          plan_name: 'Premium',
          plan_code: 'premium',
          price_inr: 199,
          features: ['Premium Feature 1', 'Premium Feature 2'], // Parsed array
          is_active: true,
        },
      ],
      source: 'database',
    });
    expect(consoleLogSpy).toHaveBeenCalledWith('Found 2 active subscription plans');
  });

  it('should handle plans with comma-separated features string when JSON parsing fails', async () => {
    const mockPlans = [
      {
        plan_id: 3,
        plan_name: 'Standard',
        plan_code: 'standard',
        price_inr: 149,
        features: 'Feature A, Feature B, Feature C', // Comma-separated string
        is_active: true,
      },
    ];

    (db.select as any).mockImplementationOnce(() => ({
      from: (vi as any).fn().mockReturnThis(),
      where: (vi as any).fn().mockReturnThis(),
      orderBy: (vi as any).fn().mockResolvedValue(mockPlans),
    }));

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      plans: [
        {
          plan_id: 3,
          plan_name: 'Standard',
          plan_code: 'standard',
          price_inr: 149,
          features: ['Feature A', 'Feature B', 'Feature C'], // Split and trimmed array
          is_active: true,
        },
      ],
      source: 'database',
    });
    expect(consoleLogSpy).toHaveBeenCalledWith('Found 1 active subscription plans');
    expect(consoleLogSpy).toHaveBeenCalledWith('Failed to parse features for plan 3:', expect.any(Error));
  });

  it('should handle plans with already parsed features array', async () => {
    const mockPlans = [
      {
        plan_id: 4,
        plan_name: 'Enterprise',
        plan_code: 'enterprise',
        price_inr: 299,
        features: ['Enterprise Feature 1', 'Enterprise Feature 2'], // Already an array
        is_active: true,
      },
    ];

    (db.select as any).mockImplementationOnce(() => ({
      from: (vi as any).fn().mockReturnThis(),
      where: (vi as any).fn().mockReturnThis(),
      orderBy: (vi as any).fn().mockResolvedValue(mockPlans),
    }));

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({
      plans: [
        {
          plan_id: 4,
          plan_name: 'Enterprise',
          plan_code: 'enterprise',
          price_inr: 299,
          features: ['Enterprise Feature 1', 'Enterprise Feature 2'], // Unchanged array
          is_active: true,
        },
      ],
      source: 'database',
    });
    expect(consoleLogSpy).toHaveBeenCalledWith('Found 1 active subscription plans');
  });

  it('should handle mixed feature formats in multiple plans', async () => {
    const mockPlans = [
      {
        plan_id: 1,
        plan_name: 'Plan 1',
        features: '["JSON Feature 1", "JSON Feature 2"]', // JSON string
        is_active: true,
      },
      {
        plan_id: 2,
        plan_name: 'Plan 2',
        features: 'Comma Feature 1, Comma Feature 2', // Comma-separated
        is_active: true,
      },
      {
        plan_id: 3,
        plan_name: 'Plan 3',
        features: ['Array Feature 1', 'Array Feature 2'], // Already array
        is_active: true,
      },
    ];

    (db.select as any).mockImplementationOnce(() => ({
      from: (vi as any).fn().mockReturnThis(),
      where: (vi as any).fn().mockReturnThis(),
      orderBy: (vi as any).fn().mockResolvedValue(mockPlans),
    }));

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.plans).toHaveLength(3);
    expect(body.plans[0].features).toEqual(['JSON Feature 1', 'JSON Feature 2']);
    expect(body.plans[1].features).toEqual(['Comma Feature 1', 'Comma Feature 2']);
    expect(body.plans[2].features).toEqual(['Array Feature 1', 'Array Feature 2']);
  });

  it('should return 500 on database connection error', async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw new Error('Database connection failed');
    });

    const response = await GET();
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({
      error: 'Failed to fetch subscription plans',
      details: 'Database connection failed',
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching subscription plans:', expect.any(Error));
    expect(consoleErrorSpy).toHaveBeenCalledWith('Stack trace:', expect.any(String));
  });

  it('should return 500 on non-Error exceptions', async () => {
    (db.select as any).mockImplementationOnce(() => {
      throw 'String error'; // Non-Error exception
    });

    const response = await GET();
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({
      error: 'Failed to fetch subscription plans',
      details: 'String error',
    });
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching subscription plans:', 'String error');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Stack trace:', 'No stack trace');
  });

  it('should handle database query that throws during feature processing', async () => {
    const mockPlans = [
      {
        plan_id: 5,
        plan_name: 'Problematic Plan',
        features: '{"invalid": json}', // Invalid JSON that will cause JSON.parse to fail
        is_active: true,
      },
    ];

    (db.select as any).mockImplementationOnce(() => ({
      from: (vi as any).fn().mockReturnThis(),
      where: (vi as any).fn().mockReturnThis(),
      orderBy: (vi as any).fn().mockResolvedValue(mockPlans),
    }));

    const response = await GET();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.plans[0].features).toEqual(['{\"invalid\": json}']); // Should fallback to split by comma
    expect(consoleLogSpy).toHaveBeenCalledWith('Failed to parse features for plan 5:', expect.any(Error));
  });
});