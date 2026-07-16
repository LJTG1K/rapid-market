import { Html, Head, Main, NextScript } from 'next/document';

// Google Analytics 4 - G-2EKT9VWVPS

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="sitemap" href="/api/sitemap.xml" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#DAD5C8" />
        <meta name="description" content="RAPID - Access 100+ sellers, with new items indexed daily, through Sugargoo" />

        {/* Preload fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..900&family=Inter+Tight:ital,wght@0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
          rel="preload"
          as="style"
        />

        {/* Meta tags for SEO */}
        <meta property="og:title" content="RAPID. - Direct from China" />
        <meta property="og:description" content="100+ sellers, new items indexed daily. Shipped via Sugargoo. No middleman, no markup." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://rapid.market" />
        <meta property="og:image" content="https://rapid.market/assets/logo.png" />
        <meta property="og:image:alt" content="RAPID Logo" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="RAPID. - Direct from China" />
        <meta name="twitter:description" content="100+ sellers, new items indexed daily. Shipped via Sugargoo." />
        <meta name="twitter:image" content="https://rapid.market/assets/logo.png" />
        <link rel="canonical" href="https://rapid.market" />
        <link rel="alternate" type="application/rss+xml" href="/api/sitemap.xml" />
        <meta name="keywords" content="marketplace, sellers, products, Sugargoo, shopping, China" />
        <meta name="robots" content="index, follow" />

        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org/',
              '@type': 'Organization',
              name: 'RAPID',
              description: 'Direct access to 100+ sellers via Sugargoo, with new items indexed daily',
              url: 'https://rapid.market',
              logo: 'https://rapid.market/assets/logo.png',
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Customer Support',
                url: 'https://rapid.market',
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
              fbq('track', 'PageView');
              console.log('[Meta Pixel] Initialized');
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

      </Head>
      <body>
        <Main />
        <NextScript />

        {/* Omnisend Email & SMS Marketing */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              window.omnisend = window.omnisend || [];
              omnisend.push(["brandID", "6a39f9fd9193b63999bda5b2"]);
              omnisend.push(["track", "$pageViewed"]);
              !function(){var e=document.createElement("script");
              e.type="text/javascript",e.async=!0,
              e.src="https://omnisnippet1.com/inshop/launcher-v2.js";
              var t=document.getElementsByTagName("script")[0];
              t.parentNode.insertBefore(e,t)}();
            `,
          }}
        />
        {/* End Omnisend */}
      </body>
    </Html>
  );
}
