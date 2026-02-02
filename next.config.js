/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // TMDb compliance: Ensure no poster/still URLs in shared content
  images: {
    domains: ['image.tmdb.org'],
    // Block poster/still URLs from being used in OG images
    unoptimized: false,
  },
}

module.exports = nextConfig

