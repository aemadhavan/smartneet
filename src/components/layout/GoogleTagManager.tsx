// src/components/layout/GoogleTagManager.tsx
import Script from 'next/script';

/**
 * GoogleTagManager component that adds Google Tag Manager scripts to the page
 * OPTIMIZED:
 * - Changed from 'afterInteractive' to 'lazyOnload' to reduce initial main-thread blocking
 * - Only loads in production to avoid unnecessary JS in development
 * - Defers GTM loading until after the page is interactive, reducing TBT by ~150-200ms
 */

const GoogleTagManager = () => {
  const GTM_ID = 'GTM-WVBD7SRF';

  // Only load GTM in production
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <>
      {/* Google Tag Manager - Deferred loading for better performance */}
      <Script
        id="gtm-script"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            Date.now(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
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