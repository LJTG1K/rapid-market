import { Html, Head, Main, NextScript } from 'next/document';

// Google Analytics 4 - G-2EKT9VWVPS

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="sitemap" href="/sitemap.xml" />
        <meta name="theme-color" content="#E7E1D1" />

        {/* Every product photograph is client-fetched from the sellers' CDN
            after /api/products resolves, so the DNS+TCP+TLS handshake would
            otherwise be discovered late. Front-load it during HTML parse. */}
        <link rel="preconnect" href="https://img.alicdn.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://img.alicdn.com" />

        {/* Preload fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..900&family=Inter+Tight:ital,wght@0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="preload"
          as="style"
        />

        {/* Description, Open Graph and Twitter tags live in pages/_app.tsx
            (next/head), not here: tags rendered from _document can't be
            overridden per page, so every page ended up with two of each. */}
        <meta name="keywords" content="marketplace, sellers, products, Sugargoo, shopping, China" />

        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org/',
              '@type': 'Organization',
              name: 'RAPID',
              description: 'Direct access to 150+ sellers via Sugargoo, with new items indexed daily',
              url: 'https://www.rapid.market',
              logo: 'https://www.rapid.market/assets/logo.png',
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Customer Support',
                url: 'https://www.rapid.market',
              },
            }),
          }}
        />
        {/* Google Analytics 4 */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-2EKT9VWVPS"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-2EKT9VWVPS', {
                page_path: window.location.pathname,
                anonymize_ip: true,
              });
            `,
          }}
        />

        {/* Off rapid.market (localhost, *.vercel.app previews) the Meta and
            Reddit pixels are replaced by logging stubs, so local and preview
            runs never send events to the live pixels. The official snippets
            below see the existing fbq/rdt and skip loading their libraries.
            Calls are kept in window.__pixelLog for testing. The stubs carry
            callMethod/sendEvent so lib/metaPixel.ts and lib/redditPixel.ts
            report them as 'sent', like a loaded pixel. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function (w) {
                if (/(^|\\.)rapid\\.market$/.test(w.location.hostname)) return;
                w.__pixelLog = [];
                function stub(platform) {
                  var f = function () {
                    var args = Array.prototype.slice.call(arguments);
                    w.__pixelLog.push({ platform: platform, args: args, at: Date.now() });
                    console.info('[pixel stub: ' + platform + ']', JSON.stringify(args));
                  };
                  return f;
                }
                w.fbq = w._fbq = stub('meta');
                w.fbq.callMethod = function () {};
                w.rdt = stub('reddit');
                w.rdt.sendEvent = function () {};
              })(window);
            `,
          }}
        />

        {/* Meta Pixel Code - Official Facebook Pixel */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '951122617742977');
              // Skip PageView for self-identified automation (keep in sync with lib/botFilter.ts).
              if (!navigator.webdriver && !/bot|crawl|spider|headless|puppeteer|playwright|selenium|lighthouse|facebookexternalhit|bytespider/i.test(navigator.userAgent)) {
                fbq('track', 'PageView');
              }
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=951122617742977&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* End Meta Pixel Code */}

        {/* Reddit Pixel */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js?pixel_id=a2_jnll2uwvg52b",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);rdt('init','a2_jnll2uwvg52b');rdt('track', 'PageVisit');
            `,
          }}
        />
        {/* End Reddit Pixel */}

      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
