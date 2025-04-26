import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SmarterNEET - Terms of Service',
  description: 'Terms of service for SmarterNEET educational platform',
  robots: 'index, follow',
};
const LAST_MODIFIED_DATE = '2024-04-27';

const termsOfServiceContent = `# SmarterNEET Terms of Service

**Last Updated:** ${new Date(LAST_MODIFIED_DATE).toLocaleDateString('en-IN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}

## 1. Introduction

Welcome to SmarterNEET, an online educational platform designed to help students prepare for the NEET (National Eligibility cum Entrance Test) examination. By accessing or using our platform, you agree to these Terms of Service.

## 2. Platform Description

SmarterNEET provides:
- Practice questions from the last 10 years of NEET examinations
- Comprehensive learning analytics
- Performance tracking and improvement insights
- Subscription-based access model

## 3. User Eligibility

- Users must be at least 16 years old
- Students preparing for NEET examinations are our primary user base
- Parental consent required for users under 18

## 4. Account Registration

### 4.1 User Accounts
- Accounts are created through Clerk.com authentication
- Users must provide accurate and current information
- One account per individual is permitted
- Users are responsible for maintaining account confidentiality

### 4.2 Account Types
1. **Freemium Plan**
   - Limited to 3 tests per day
   - Basic performance analytics
   - Access to selected practice questions

2. **Premium Plan**
   - Unlimited test attempts
   - Comprehensive performance analytics
   - Full access to question bank
   - Additional learning resources

## 5. Subscription and Payments

### 5.1 Payment Processing
- Payments processed through Stripe
- Secure and PCI DSS compliant transaction handling
- Supports Indian Rupee (INR) transactions
- GST will be applied as per Indian tax regulations

### 5.2 Subscription Management
- Monthly and annual subscription options available
- Automatic renewal unless canceled
- Prorated refunds may be available
- Subscription can be canceled at any time

### 5.3 Pricing
- Current pricing available on the website
- Prices subject to change with prior notice
- Taxes and additional charges may apply

## 6. User Conduct and Responsibilities

### 6.1 Prohibited Activities
Users may NOT:
- Share account credentials
- Attempt to bypass system limitations
- Use the platform for illegal purposes
- Engage in harassment or discriminatory behavior
- Reproduce or distribute platform content without authorization

### 6.2 Content Usage
- Practice questions are for personal educational use
- Commercial reproduction is strictly prohibited
- Intellectual property rights are reserved

## 7. Data and Privacy

### 7.1 Data Collection
- Personal information collected as per our Privacy Policy
- Usage data tracked for platform improvement
- Learning analytics generated from user interactions

### 7.2 Data Protection
- Secure storage on Xata.io PostgreSQL database
- Encrypted data transmission
- Compliance with Indian data protection regulations

## 8. Performance Analytics

### 8.1 Learning Insights
- Performance tracking across topics
- Personalized improvement recommendations
- Anonymized data may be used for research purposes

### 8.2 Analytics Limitations
- Analytics are indicative, not definitive
- Individual study and preparation remain crucial

## 9. Intellectual Property

- All platform content is proprietary
- Questions, analytics, and user interface are protected
- Trademarks and copyrights belong to SmarterNEET

## 10. Limitation of Liability

### 10.1 Platform Performance
- Platform provided "as is"
- No guarantee of specific exam performance
- Users responsible for comprehensive exam preparation

### 10.2 Financial Liability
- Maximum liability limited to subscription fees
- No compensation for indirect or consequential damages

## 11. Modifications to Terms

- Terms may be updated periodically
- Continued use implies acceptance of new terms
- Users will be notified of significant changes

## 12. Termination

### 12.1 User Termination
- SmarterNEET reserves right to terminate accounts
- Grounds include terms violation, fraudulent activity
- Termination may be without prior notice

### 12.2 Subscription Termination
- Users can cancel subscription anytime
- Prorated refunds may be considered
- Account data may be retained as per privacy policy

## 13. Dispute Resolution

- Governed by laws of India
- Disputes subject to jurisdiction of courts in [Specific City/State]
- Arbitration clause may apply for unresolved disputes

## 14. Contact Information

For queries or concerns:
- Email: support@smarterneet.com
- Address: [Your Registered Business Address]

## 15. Acknowledgment

By using SmarterNEET, you acknowledge that you have read, understood, and agree to these Terms of Service.

---

`;

export default function TermsOfService() {
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
            {termsOfServiceContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}