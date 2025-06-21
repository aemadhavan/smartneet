// Script to check and populate subscription plans
import { db } from '../src/db';
import { subscription_plans } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function checkAndPopulateSubscriptionPlans() {
  try {
    console.log('Checking subscription plans...');
    
    // First, check if there are any plans
    const existingPlans = await db.select().from(subscription_plans);
    console.log(`Found ${existingPlans.length} existing plans:`, existingPlans);
    
    if (existingPlans.length === 0) {
      console.log('No subscription plans found. Creating default plans...');
      
      // Insert default plans
      const defaultPlans = [
        {
          plan_name: 'Free Plan',
          plan_code: 'free' as const,
          description: 'Free plan with limited access',
          price_inr: 0,
          price_id_stripe: 'free_plan',
          product_id_stripe: 'free_product',
          features: JSON.stringify(['Basic questions access', 'Limited daily tests']),
          test_limit_daily: 5,
          duration_days: 30,
          is_active: true
        },
        {
          plan_name: 'Premium Monthly',
          plan_code: 'premium' as const,
          description: 'Unlimited access to all questions',
          price_inr: 299,
          price_id_stripe: 'price_1RGHUUI4vzdu0gk5Rt4HTiLV', // From env
          product_id_stripe: 'prod_premium_monthly',
          features: JSON.stringify(['Unlimited questions access', 'Advanced analytics', 'Performance tracking']),
          test_limit_daily: null, // unlimited
          duration_days: 30,
          is_active: true
        }
      ];
      
      const insertedPlans = await db.insert(subscription_plans).values(defaultPlans).returning();
      console.log('Created plans:', insertedPlans);
    } else {
      // Check if all plans are active
      const activePlans = existingPlans.filter(plan => plan.is_active);
      console.log(`Found ${activePlans.length} active plans out of ${existingPlans.length} total plans`);
      
      if (activePlans.length === 0) {
        console.log('No active plans found. Activating existing plans...');
        // Activate all existing plans
        const updatedPlans = await db.update(subscription_plans)
          .set({ is_active: true })
          .returning();
        console.log('Activated plans:', updatedPlans);
      }
    }
    
    // Final check
    const finalPlans = await db.select().from(subscription_plans).where(eq(subscription_plans.is_active, true));
    console.log(`Final check: ${finalPlans.length} active plans found`);
    
  } catch (error) {
    console.error('Error checking subscription plans:', error);
  }
}

// Run the script
checkAndPopulateSubscriptionPlans().then(() => {
  console.log('Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});