/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/portfolio/halcyon',
        destination: '/portfolio/the-halcyon-collection',
        permanent: true,
      },
      {
        source: '/portfolio/atmospheric',
        destination: '/portfolio/the-atmospheric-collection',
        permanent: true,
      },
    ]
  },
  images: {
    remotePatterns: [
      // Add your SmugMug domain here if migrating photos
      { protocol: 'https', hostname: '*.smugmug.com' },
      { protocol: 'https', hostname: 'images-api.printify.com' },
      { protocol: 'https', hostname: 'photos.studiotj.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://images-api.printify.com https://*.smugmug.com https://photos.studiotj.com",
              "font-src 'self' data:",
              "connect-src 'self' https://api.stripe.com https://nominatim.openstreetmap.org https://api.open-meteo.com https://overpass-api.de https://overpass.kumi.systems https://overpass.private.coffee https://router.project-osrm.org",
              "frame-src https://js.stripe.com https://hooks.stripe.com https://www.youtube-nocookie.com https://www.youtube.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
