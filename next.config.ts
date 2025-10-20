import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: false,
  },
  // Configuração simplificada do Webpack
  webpack: config => {
    // Exclude temp directories from being processed
    config.module.rules.push({
      test: /\.(ts|tsx|js|jsx)$/,
      include: [/temp-scripts/, /scripts\/temp/],
      use: 'ignore-loader',
    });

    return config;
  },
};

export default nextConfig;
