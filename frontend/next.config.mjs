/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000'
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        // Proxy uploaded images served via Laravel's `php artisan storage:link`
        source: '/storage/:path*',
        destination: `${backendUrl}/storage/:path*`,
      },
    ]
  },
}

export default nextConfig
