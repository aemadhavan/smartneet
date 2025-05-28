// src/components/layout/GoogleTagManager.tsx
import React from 'react';
import Script from 'next/script';

/**
 * GoogleTagManager component that adds Google Tag Manager scripts to the page
 * This should be included in the Header component
 */

const GoogleTagManager = () => {
  //const GTM_ID = 'G-VEF6K86RLG'; // Google Tag Manager ID from the provided script
const GTM_ID = 'GTM-WVBD7SRF'; 
  return (
    <>
      {/* Google Tag Manager - Script that goes in the head */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GTM_ID}');
          `,
        }}
      />
      
      {/* Google Tag Manager - Script for async loading */}
      <Script
        id="gtm-script-async"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GTM_ID}`}
      />
    </>
  );
};

export default GoogleTagManager;