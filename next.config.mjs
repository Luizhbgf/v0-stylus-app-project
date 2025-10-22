/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Necessário para Docker
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'blob.v0.app',
      },
    ],
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Configurações específicas por ambiente
  env: {
    APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  },
}

export default nextConfig
