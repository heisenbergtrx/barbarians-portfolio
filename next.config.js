/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode for better development experience
  reactStrictMode: true,
  
  // API routes will handle external data fetching
  // This keeps API keys server-side only
  
  // Image optimization settings
  images: {
    domains: ['lh3.googleusercontent.com'], // For Google profile pictures
  },
}

module.exports = nextConfig
