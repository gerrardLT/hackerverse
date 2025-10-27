import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 现有配置保持不变
  serverExternalPackages: ['@prisma/client'],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'illustrations.popsy.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.undraw.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storyset.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdni.iconscout.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.freepik.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.pollinations.ai',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);