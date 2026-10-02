/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // Lets Studio import the site's own lib/ (e.g. brandMatch) so its checks
  // can never disagree with the live site.
  experimental: { externalDir: true },
  async headers() {
    return [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }];
  },
};
