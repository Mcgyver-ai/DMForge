const nextConfig = {
  // Sentry DSNs aren't secret (they're meant to be embedded in client bundles),
  // so the single SENTRY_DSN env var doubles as the public client DSN here —
  // no separate NEXT_PUBLIC_ var to configure in Vercel.
  env: {
    NEXT_PUBLIC_SENTRY_DSN: process.env.SENTRY_DSN,
  },
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
    // ponytail: unsafe-inline required for Next.js App Router hydration scripts + Tailwind inline styles.
    // Upgrade to nonce-based CSP when/if a stricter posture is needed.
    const csp = [
      "default-src 'self'",
<<<<<<< HEAD
      "script-src 'self' 'unsafe-inline' https://js.stripe.com https://apis.google.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://api.stripe.com https://m.stripe.com https://m.stripe.network https://q.stripe.com https://apis.google.com https://www.googleapis.com https://oauth2.googleapis.com",
      "frame-src https://js.stripe.com https://accounts.google.com https://www.google.com https://*.firebaseapp.com",
=======
      "script-src 'self' 'unsafe-inline' https://js.stripe.com https://*.i.posthog.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://api.stripe.com https://m.stripe.com https://m.stripe.network https://q.stripe.com https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io https://*.i.posthog.com",
      "frame-src https://js.stripe.com https://accounts.google.com",
>>>>>>> fe72542c2cfc95c0f0c283e0de51c5d8ab03e7fb
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
      // CORS for /api is handled by handleCORS() in app/api/[[...path]]/route.js
      // (origin allow-list from CORS_ORIGINS) — do not duplicate it here, the two
      // used to disagree. The Stripe webhook is server-to-server and needs none.
    ];
  },
};

module.exports = nextConfig;
