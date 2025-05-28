// src/components/layout/GoogleTagManager.tsx
import React from 'react';
import Script from 'next/script';

/**
 * GoogleTagManager component that adds Google Tag Manager scripts to the page
 * This should be included in the Header component
 */

const GoogleTagManager = () => {
  const GTM_ID = 'GTM-WVBD7SRF'; 
  return (
    <>
      {/* Google Tag Manager */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');
          `,
        }}
      />
    </>
  );
};

export default GoogleTagManager;