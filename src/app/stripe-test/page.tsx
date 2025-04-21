'use client';

import { useEffect, useState } from 'react';

export default function StripeTest() {
  const [stripeKey, setStripeKey] = useState<string | null>(null);
  
  useEffect(() => {
    // Log the environment variable directly
    console.log('Stripe key from env:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    
    // Save it to state for rendering
    setStripeKey(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null);
    
    // Try loading Stripe manually
    const loadStripe = async () => {
      try {
        const { loadStripe } = await import('@stripe/stripe-js');
        const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        
        if (!key) {
          console.error('No Stripe key available');
          return;
        }
        
        console.log('Loading Stripe with key prefix:', key.substring(0, 5));
        const stripe = await loadStripe(key);
        console.log('Stripe loaded successfully:', !!stripe);
      } catch (error) {
        console.error('Error loading Stripe:', error);
      }
    };
    
    loadStripe();
  }, []);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Stripe Test Page</h1>
      <div className="p-4 border rounded">
        <p>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:</p>
        <p className="font-mono bg-gray-100 p-2 mt-2">
          {stripeKey ? `${stripeKey.substring(0, 10)}...` : 'Not available'}
        </p>
      </div>
    </div>
  );
}