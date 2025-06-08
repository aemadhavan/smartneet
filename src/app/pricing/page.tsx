// src/app/pricing/page.tsx
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import PricingUserSection from './PricingUserSection';
import ErrorDisplay from './ErrorDisplay';

// Types
type SubscriptionPlan = {
  plan_id: number;
  plan_name: string;
  plan_code: string;
  description: string;
  price_inr: number;
  price_id_stripe: string;
  features: string[];
  test_limit_daily: number | null;
  duration_days: number;
  is_active: boolean;
};

async function getPlans() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  console.log('BASE URL:', baseUrl);
  const res = await fetch(`${baseUrl}/api/subscription-plans`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch subscription plans');
  const data = await res.json();
  return data.plans;
}

export default async function PricingPage() {
  let plans: SubscriptionPlan[] = [];
  let error: string | null = null;
  try {
    plans = await getPlans();
  } catch (err: unknown) {
    if (err instanceof Error) {
      error = err.message || 'An unknown error occurred';
    } else {
      error = 'An unknown error occurred';
    }
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-gray-100">Choose Your Plan</h1>
      <p className="text-lg text-center text-gray-600 dark:text-gray-300 mb-12">
        Get unlimited access to all practice tests and study materials
      </p>
      <Suspense fallback={<div className="flex justify-center items-center mt-12"><Loader2 className="h-12 w-12 text-blue-500 animate-spin" /></div>}>
        <PricingUserSection plans={plans} />
      </Suspense>
    </div>
  );
}