import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Ensure tracing (if enabled later) is scoped to this project root
  outputFileTracingRoot: process.cwd(),
  // Avoid Webpack symlink resolution (works around Windows readlink quirks)
  webpack: (config) => {
    config.resolve.symlinks = false
    return config
  },
}

export default nextConfig
