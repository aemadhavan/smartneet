import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Function to update Stripe version in config
async function updateStripeVersion(newVersion: string) {
  const configPath = path.join(process.cwd(), 'src/config/stripe.ts');
  
  try {
    // Read the current config file
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    // Update the API version
    const updatedContent = configContent.replace(
      /API_VERSION: ['"](.*?)['"]/,
      `API_VERSION: '${newVersion}'`
    );
    
    // Write the updated content back
    fs.writeFileSync(configPath, updatedContent);
    
    console.log(`✅ Successfully updated Stripe API version to ${newVersion}`);
    
    // Update Stripe packages
    console.log('📦 Updating Stripe packages...');
    execSync('npm install stripe@latest @stripe/stripe-js@latest', { stdio: 'inherit' });
    
    console.log('✨ Update complete! Please test your Stripe integration thoroughly.');
  } catch (error) {
    console.error('❌ Error updating Stripe version:', error);
    process.exit(1);
  }
}

// Get version from command line argument
const newVersion = process.argv[2];
if (!newVersion) {
  console.error('❌ Please provide a Stripe API version');
  console.log('Usage: npm run update-stripe-version <version>');
  console.log('Example: npm run update-stripe-version 2025-05-28.basil');
  process.exit(1);
}

updateStripeVersion(newVersion); 