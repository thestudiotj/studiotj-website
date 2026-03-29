/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // Add your SmugMug domain here if migrating photos
      { protocol: 'https', hostname: '*.smugmug.com' },
      // Shopify CDN for product images
      { protocol: 'https', hostname: '*.myshopify.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
    ],
  },
}

module.exports = nextConfig
