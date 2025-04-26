import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SmarterNEET - Privacy Policy',
  description: 'Privacy policy for SmarterNEET educational platform',
  robots: 'index, follow',
};
const LAST_MODIFIED_DATE = '2024-04-27';

const privacyPolicyContent = `# SmarterNEET Privacy Policy

**Last Updated:** ${new Date(LAST_MODIFIED_DATE).toLocaleDateString('en-IN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}

## 1. Introduction

Welcome to SmarterNEET. We are committed to protecting your personal information and being transparent about how we collect, use, and safeguard your data. This Privacy Policy explains our practices regarding the collection, use, and disclosure of your information when you use our website, mobile application, and services.

## 2. Information We Collect

We collect several types of information:

### 2.1 Personal Information
- Name
- Email address
- Phone number
- Demographic information
- Educational background
- Profile information from Clerk.com authentication

### 2.2 Usage and Performance Data
- IP address
- Browser type
- Device information
- Operating system
- Pages visited
- Time spent on pages
- Practice session details
- Test performance and analytics
- Learning progress and analytics

### 2.3 Payment and Subscription Information
- Billing details
- Subscription status
- Payment history
- Transaction information processed through Stripe

### 2.4 Cookies and Tracking Technologies
- Google Analytics tracking
- Google Tag Manager data collection
- Performance and functional cookies

## 3. How We Use Your Information

We use your information for the following purposes:

- Providing and personalizing educational services
- Managing user accounts
- Processing payments and subscriptions
- Improving our platform and user experience
- Sending educational and platform-related communications
- Analyzing user performance and providing learning insights
- Compliance with legal obligations

## 4. Legal Basis for Processing

We process your data based on:
- Consent
- Contractual necessity
- Legal obligations
- Legitimate interests in providing educational services

## 5. Data Sharing and Disclosure

We may share your information with:
- Stripe for payment processing
- Clerk.com for user authentication
- Xata.io for database services
- Google Analytics for performance tracking
- Authorized service providers
- Legal authorities when required by law

## 6. Data Storage and Security

- Data stored on secure Xata.io PostgreSQL database
- Encrypted data transmission
- Regular security audits
- Access controls and authentication measures
- Compliance with Indian data protection regulations

## 7. User Rights

As a user, you have the right to:
- Access your personal data
- Correct inaccurate information
- Request data deletion
- Withdraw consent
- Object to data processing
- Request data portability
- Lodge a complaint with authorities

## 8. Cookies and Tracking

### 8.1 Types of Cookies
- Essential cookies
- Performance cookies
- Functional cookies
- Analytical cookies

### 8.2 Cookie Management
- Users can manage cookie preferences
- Browser settings can control cookie acceptance

## 9. Third-Party Services

### 9.1 Payment Processing
- Stripe handles payment transactions
- PCI DSS compliant payment processing

### 9.2 Authentication
- Clerk.com manages user authentication
- Secure login and account management

### 9.3 Analytics
- Google Analytics tracks platform performance
- Google Tag Manager manages tracking tags

## 10. International Data Transfers

- Data may be transferred and processed internationally
- Appropriate safeguards implemented
- Compliance with Indian data protection laws

## 11. Children's Privacy

- Platform designed for students 16 years and older
- Parental consent required for users under 18
- No intentional data collection from children under 16

## 12. Changes to Privacy Policy

- We may update this policy periodically
- Users will be notified of significant changes
- Continued use implies acceptance of updated policy

## 13. GST and Billing Transparency

- Transparent billing information
- GST details provided with invoices
- Compliance with Indian tax regulations

## 14. Contact Information

For privacy-related inquiries:
- Email: privacy@smarterneet.com
- Address: [Your Company Address]

## 15. Jurisdiction and Governing Law

- This policy is governed by Indian laws
- Any disputes subject to jurisdiction of courts in [Specific City/State]

## 16. Consent

By using SmarterNEET, you consent to the terms of this Privacy Policy.

---
`;

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="prose prose-sm sm:prose lg:prose-lg max-w-none">
          <ReactMarkdown 
            components={{
              h1: (props) => <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4" {...props} />,
              h2: (props) => <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mt-6 mb-3 border-b pb-2" {...props} />,
              h3: (props) => <h3 className="text-lg md:text-xl font-medium text-gray-700 mt-4 mb-2" {...props} />,
              p: (props) => <p className="mb-3 text-gray-600 leading-relaxed" {...props} />,
              ul: (props) => <ul className="list-disc list-inside mb-3 pl-4 text-gray-600" {...props} />,
              a: (props) => <a className="text-blue-600 hover:underline" {...props} />
            }}
          >
            {privacyPolicyContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}