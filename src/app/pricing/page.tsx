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
  try {
    // Import the database logic directly to avoid HTTP requests during SSR
    const { db } = await import('@/db');
    const drizzleOrm = await import('drizzle-orm');
    const { subscription_plans } = await import('@/db/schema');
    
    console.log('Fetching subscription plans from database...');
    
    // Fetch directly from database
    const plans = await db
      .select()
      .from(subscription_plans)
      .where(drizzleOrm.eq(subscription_plans.is_active, true))
      .orderBy(drizzleOrm.asc(subscription_plans.price_inr));
    
    console.log(`Found ${plans.length} active subscription plans`);
    
    // Process the features field to ensure it's a proper array
    const processedPlans: SubscriptionPlan[] = plans.map(plan => {
      let processedFeatures: string[] = [];
      
      // If features is a string (JSON string), parse it into an array
      if (typeof plan.features === 'string') {
        try {
          const parsed = JSON.parse(plan.features);
          processedFeatures = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.log(`Failed to parse features for plan ${plan.plan_id}:`, e);
          // If it's not valid JSON, split by comma
          processedFeatures = plan.features.split(',').map(f => f.trim());
        }
      } else if (Array.isArray(plan.features)) {
        processedFeatures = plan.features;
      }
      
      return {
        plan_id: plan.plan_id,
        plan_name: plan.plan_name,
        plan_code: plan.plan_code,
        description: plan.description || '',
        price_inr: plan.price_inr,
        price_id_stripe: plan.price_id_stripe,
        features: processedFeatures,
        test_limit_daily: plan.test_limit_daily,
        duration_days: plan.duration_days,
        is_active: plan.is_active ?? true
      };
    });
    
    console.log('Processed plans:', processedPlans.map(p => ({ id: p.plan_id, name: p.plan_name })));
    
    return processedPlans;
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw new Error('Failed to fetch subscription plans');
  }
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