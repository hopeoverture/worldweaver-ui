// Flat config for ESLint v9+
// Minimal setup that enables Next.js plugin in flat config
import js from '@eslint/js'
import nextPlugin from '@next/eslint-plugin-next'

export default [
  js.configs.recommended,
  {
    // Register Next plugin to satisfy Next build detection and basic rules
    plugins: { '@next/next': nextPlugin },
    rules: {
      // You can enable additional Next rules here as needed
      // '@next/next/no-html-link-for-pages': 'warn',
    },
  },
  {
    ignores: [
      '.next',
      'node_modules',
      'dist',
      'build',
      'coverage',
      'scripts/**',
      'test-*.js',
      'test-*.mjs',
      'check-*.js',
      'validate-*.js',
      // Generated types – keep out of lint
      'src/lib/supabase/types.generated.ts',
    ],
  },
]
