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
  // Adiciona a configuração do Webpack para PostCSS e PurgeCSS
  webpack: (config, { isServer, dev }) => {
    // Exclude temp directories from being processed
    config.module.rules.push({
      test: /\.(ts|tsx|js|jsx)$/,
      include: [/temp-scripts/, /scripts\/temp/],
      use: 'ignore-loader',
    });

    if (!dev && !isServer) {
      // Apenas em produção (client-side)
      const originalPostcssLoader = config.module.rules.find(
        rule =>
          typeof rule === 'object' &&
          rule.use &&
          Array.isArray(rule.use) &&
          rule.use.some(use => typeof use === 'object' && use.loader?.includes('postcss-loader'))
      );

      if (
        originalPostcssLoader &&
        typeof originalPostcssLoader === 'object' &&
        originalPostcssLoader.use
      ) {
        const postcssLoader = originalPostcssLoader.use.find(
          use => typeof use === 'object' && use.loader?.includes('postcss-loader')
        );

        if (postcssLoader && typeof postcssLoader === 'object' && postcssLoader.options) {
          const originalPlugins = postcssLoader.options.postcssOptions?.plugins || [];

          postcssLoader.options.postcssOptions = {
            plugins: [
              ...originalPlugins,
              // Adiciona o PurgeCSS
              (async () => {
                const purgecss = (await import('@fullhuman/postcss-purgecss')).default;
                return purgecss({
                  content: [
                    './app/**/*.{js,jsx,ts,tsx}',
                    './modules/**/*.{js,jsx,ts,tsx}',
                    './public/**/*.html',
                  ],
                  defaultExtractor: content => {
                    return content.match(/[A-Za-z0-9-_:/]+/g) || [];
                  },
                  safelist: {
                    standard: [
                      /^html/,
                      /^body/,
                      /^next-/, // Classes do Next.js
                      /^Toast/, // Classes do componente Toast
                      // Adicione outras classes ou padrões de classes que não devem ser removidas
                      // Ex: /^swiper-/, se estiver usando Swiper.js
                    ],
                    deep: [],
                    greedy: [],
                  },
                });
              })(),
            ].filter(Boolean),
          };
        }
      }
    }
    return config;
  },
};

export default nextConfig;
