import type { NextConfig } from 'next'

// Bundle analyzer setup
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config: NextConfig) => config;

const nextConfig: NextConfig = {
  // Ensure tracing (if enabled later) is scoped to this project root
  outputFileTracingRoot: process.cwd(),
  // Avoid Webpack symlink resolution (works around Windows readlink quirks)
  webpack: (config) => {
    config.resolve.symlinks = false

    // Optimize bundle size
    if (config.mode === 'production') {
      // Tree shake unused exports more aggressively
      config.optimization.usedExports = true
      config.optimization.sideEffects = false
    }

    return config
  },
  // Experimental features for better performance
  experimental: {
    // Optimize package imports to reduce bundle size
    optimizePackageImports: ['@supabase/supabase-js', '@tanstack/react-query'],
  },
  // Improve build performance
  swcMinify: true,
}

export default withBundleAnalyzer(nextConfig)
