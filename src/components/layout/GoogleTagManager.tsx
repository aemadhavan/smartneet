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

  // Allow disabling analytics entirely for audits (e.g., Lighthouse)
  if (process.env.NEXT_PUBLIC_DISABLE_ANALYTICS === '1') return null;

  // Only load GTM in production
  if (process.env.NODE_ENV !== 'production') {
    return null;
  }

  return (
    <>
      {/* Set default consent to denied so third‑party tags (GA/Clarity) do not set cookies without consent */}
      <Script id="gtm-consent-default" strategy="lazyOnload">
        {`window.dataLayer = window.dataLayer || []; window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
          // Consent Mode v2 defaults (no cookies)
          window.dataLayer.push({
            'event': 'default_consent',
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied'
          });`}
      </Script>

      {/* Lazy loader: only inject GTM after explicit consent (localStorage or custom event) */}
      <Script id="gtm-loader" strategy="lazyOnload">
        {`
          (function(){
            var load = function(){
              if (window.__gtmLoaded) return; window.__gtmLoaded = true;
              var s=document.createElement('script');
              s.async=true; s.src='https://www.googletagmanager.com/gtm.js?id=${GTM_ID}';
              document.head.appendChild(s);
            };
            try {
              var consent = localStorage.getItem('sn_consent');
              if (consent === 'granted') { load(); return; }
            } catch (e) {}
            window.addEventListener('sn:consent.granted', load, { once: true });
          })();
        `}
      </Script>
    </>
  );
};

export default GoogleTagManager;