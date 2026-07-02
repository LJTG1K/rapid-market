import Head from 'next/head';
import Link from 'next/link';

const SECTIONS = [
  {
    title: 'Overview',
    body: (
      <p>
        RAPID (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the RAPID website and
        services. This Privacy Policy explains how we collect, use, and protect your information when you
        use our website, signup forms, and services.
      </p>
    ),
  },
  {
    title: 'Information we collect',
    body: (
      <>
        <p className="mb-3">We collect the following information:</p>
        <ul className="list-disc list-outside pl-5 space-y-2">
          <li><strong>Name:</strong> Provided when you sign up through our forms or register for an account.</li>
          <li><strong>Email address:</strong> Provided when you sign up through our forms or register for an account.</li>
          <li><strong>Usage data:</strong> Information about how you interact with our website (pages visited, click events, session duration).</li>
        </ul>
      </>
    ),
  },
  {
    title: 'How we use your information',
    body: (
      <>
        <p className="mb-3">We use your information for the following purposes:</p>
        <ul className="list-disc list-outside pl-5 space-y-2">
          <li><strong>Account creation:</strong> When you provide your name and email, we use this information to automatically create a Sugargoo account on your behalf.</li>
          <li><strong>Service delivery:</strong> To provide, maintain, and improve our services.</li>
          <li><strong>Communication:</strong> To send you important information about your account or our services.</li>
          <li><strong>Analytics:</strong> To understand how users interact with our website and improve user experience.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Data sharing with Sugargoo',
    body: (
      <>
        <p className="mb-3">
          When you sign up through RAPID, we share your name and email address with Sugargoo to create your
          account. Sugargoo is responsible for your data according to their own privacy policy. Your Sugargoo
          account credentials are provided to you immediately after signup.
        </p>
        <p className="text-sm text-muted">
          For more information about how Sugargoo handles your data, visit the{' '}
          <a href="https://www.sugargoo.com" className="link-underline font-semibold" target="_blank" rel="noopener noreferrer">
            Sugargoo website
          </a>.
        </p>
      </>
    ),
  },
  {
    title: 'Third-party services',
    body: (
      <>
        <p className="mb-3">We use the following third-party services:</p>
        <ul className="list-disc list-outside pl-5 space-y-2 mb-3">
          <li><strong>Meta Pixel:</strong> For tracking conversions and optimising our advertising.</li>
          <li><strong>Facebook Lead Ads:</strong> For collecting lead information through lead forms.</li>
          <li><strong>Google Analytics:</strong> For analysing website traffic and user behaviour.</li>
        </ul>
        <p className="text-sm text-muted">These services may collect additional data according to their own privacy policies.</p>
      </>
    ),
  },
  {
    title: 'Data security',
    body: (
      <p>
        We take reasonable measures to protect your information from unauthorised access, alteration, and
        destruction. All data transmission is encrypted using HTTPS. However, no method of transmission over
        the internet is 100% secure.
      </p>
    ),
  },
  {
    title: 'Your rights',
    body: (
      <>
        <p className="mb-3">You have the right to:</p>
        <ul className="list-disc list-outside pl-5 space-y-2 mb-3">
          <li>Request access to your personal information.</li>
          <li>Request correction of inaccurate information.</li>
          <li>Request deletion of your information, subject to legal obligations.</li>
          <li>Opt out of certain communications.</li>
        </ul>
        <p className="text-sm text-muted">To exercise these rights, contact us at the email address below.</p>
      </>
    ),
  },
  {
    title: 'Cookies',
    body: (
      <p>
        We use cookies and similar tracking technologies to enhance your experience on our website. Cookies
        help us remember your preferences and track activity for analytics and advertising purposes.
      </p>
    ),
  },
  {
    title: 'Changes to this policy',
    body: (
      <p>
        We may update this Privacy Policy from time to time. We will notify you of any changes by updating
        the &ldquo;Last updated&rdquo; date at the top of this page. Continued use of RAPID after changes
        constitutes acceptance of the updated policy.
      </p>
    ),
  },
  {
    title: 'Contact us',
    body: (
      <div className="border border-line bg-paper p-5 mt-2">
        <p>
          <strong>Email:</strong>{' '}
          <a href="mailto:privacy@rapid.market" className="link-underline font-semibold">privacy@rapid.market</a>
        </p>
      </div>
    ),
  },
];

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy — RAPID Marketplace</title>
        <meta name="description" content="RAPID Privacy Policy" />
      </Head>

      <div className="container-edit py-12 md:py-16">
        <span className="eyebrow block mb-3">Legal</span>
        <h1 className="font-display font-black text-ink text-5xl md:text-6xl tracking-tightest mb-3">
          Privacy Policy
        </h1>
        <p className="font-mono text-xs uppercase tracking-wide text-muted mb-16">Last updated: June 8, 2026</p>

        <div className="max-w-2xl border-t border-line">
          {SECTIONS.map((section) => (
            <section key={section.title} className="py-8 border-b border-line">
              <h2 className="font-display font-black text-2xl tracking-tightest mb-4">{section.title}</h2>
              <div className="text-ink/80 leading-relaxed">{section.body}</div>
            </section>
          ))}
        </div>

        <div className="mt-14">
          <Link href="/" className="link-underline font-mono text-xs uppercase tracking-wide">
            ← Back home
          </Link>
        </div>
      </div>
    </>
  );
}
