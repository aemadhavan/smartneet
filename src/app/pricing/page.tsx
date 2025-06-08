// src/app/pricing/page.tsx
import { Suspense } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import PricingUserSection from './PricingUserSection';

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
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/subscription-plans`, {
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
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-md mx-auto bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mr-2" />
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">Error</h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
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