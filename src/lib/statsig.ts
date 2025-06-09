import { Statsig } from '@flags-sdk/statsig';

// Get the API key from environment variables
const apiKey = process.env.STATSIG_SERVER_API_KEY;

// Validate the API key
if (!apiKey) {
  console.error('STATSIG_SERVER_API_KEY is not set in environment variables');
  throw new Error('STATSIG_SERVER_API_KEY is required for feature flags');
}

// Initialize Statsig with the API key
export const statsig = Statsig.initialize(apiKey, {
  environment: {
    tier: process.env.NODE_ENV || 'development'
  }
});