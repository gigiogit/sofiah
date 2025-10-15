import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  devIndicators: {
    buildActivity: false,
    appIsrStatus: false,
  },
}
module.exports = {
  reactStrictMode: true,
  output: 'standalone',
} 
export default nextConfig
