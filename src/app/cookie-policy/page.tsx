import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SmarterNEET - Cookie Policy',
  description: 'Cookie policy for SmarterNEET educational platform',
  robots: 'index, follow',
};
const LAST_MODIFIED_DATE = '2024-04-27';

const cookiePolicyContent = `# SmarterNEET Cookie Policy

**Last Updated:** ${new Date(LAST_MODIFIED_DATE).toLocaleDateString('en-IN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})}

## 1. Introduction

This Cookie Policy explains how SmarterNEET uses cookies and similar tracking technologies on our online educational platform for NEET exam preparation.

## 2. What Are Cookies?

Cookies are small text files stored on your device when you visit a website. They help us:
- Improve your browsing experience
- Understand how you use our platform
- Provide personalized content and services

## 3. Types of Cookies We Use

### 3.1 Essential Cookies
- Necessary for platform functionality
- Enable core features like user authentication
- Cannot be disabled without impacting site performance

#### Examples:
- Login session cookies
- Security verification cookies
- User preference settings

### 3.2 Analytical Cookies
- Powered by Google Analytics
- Track website usage and performance
- Help us understand user interactions

#### What We Track:
- Pages visited
- Time spent on platform
- User flow and navigation
- Device and browser information

### 3.3 Performance Cookies
- Improve platform speed and responsiveness
- Analyze and enhance user experience
- Collect aggregated performance data

### 3.4 Marketing and Tracking Cookies
- Managed through Google Tag Manager
- Support personalized content and advertising
- Help us understand user interests

## 4. Third-Party Cookies

We use cookies from trusted third-party services:
- Clerk.com (User Authentication)
- Stripe (Payment Processing)
- Google Analytics
- Google Tag Manager

## 5. Cookie Management

### 5.1 Browser Controls
You can manage cookies through your browser settings:
- Chrome: Settings > Privacy and Security > Cookies
- Firefox: Options > Privacy & Security
- Safari: Preferences > Privacy
- Edge: Settings > Cookies and site permissions

### 5.2 Cookie Consent
- First-time visitors are prompted to accept cookies
- You can modify your preferences at any time
- Essential cookies are always active

## 6. Specific Tracking Technologies

### 6.1 Learning Analytics Cookies
- Track practice session performance
- Monitor user progress and learning patterns
- Help generate personalized improvement recommendations

### 6.2 Subscription Tracking
- Monitor subscription type (Freemium/Premium)
- Track test attempts and usage limits
- Validate subscription status

## 7. Data Protection and Privacy

- All tracked data is anonymized
- Compliance with Indian data protection regulations
- No personal identification without consent
- Aggregated data used for platform improvement

## 8. Cookie Lifespan

### 8.1 Session Cookies
- Temporary cookies
- Deleted when you close the browser
- Essential for immediate platform functionality

### 8.2 Persistent Cookies
- Remain on your device for a set period
- Maximum duration: 12 months
- Can be manually deleted through browser settings

## 9. Purpose of Data Collection

- Enhance user experience
- Improve platform performance
- Provide personalized learning insights
- Support platform security
- Comply with legal and regulatory requirements

## 10. International Data Transfers

- Cookies may involve data transfer to servers outside India
- Appropriate safeguards are implemented
- Compliance with data protection standards

## 11. Updates to Cookie Policy

- We may update this policy periodically
- Changes will be reflected on this page
- Continued use implies acceptance of updates

## 12. Contact Information

For cookie-related queries:
- Email: privacy@smarterneet.com
- Address: [Your Registered Business Address]

## 13. Consent

By using SmarterNEET, you consent to our use of cookies as described in this policy.

---

`;

export default function CookiePolicy() {
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
            {cookiePolicyContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}