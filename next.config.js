const nextConfig = {
  // No `output: 'standalone'` — that's for self-hosting/Docker; Vercel builds its own output.
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com', pathname: '/**' },
    ],
  },
  // Next 16 builds with Turbopack by default; declare it so the presence of
  // the (dev-only, webpack-fallback) `webpack` block below isn't a fatal error.
  turbopack: {},
  webpack(config, { dev }) {
    if (dev) {
      config.watchOptions = {
        poll: 2000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules'],
      };
    }
    return config;
  },
  onDemandEntries: {
    maxInactiveAge: 10000,
    pagesBufferLength: 2,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // CORS for /api is handled by handleCORS() in app/api/[[...path]]/route.js
      // (origin allow-list from CORS_ORIGINS) — do not duplicate it here, the two
      // used to disagree. The Stripe webhook is server-to-server and needs none.
    ];
  },
};

module.exports = nextConfig;
