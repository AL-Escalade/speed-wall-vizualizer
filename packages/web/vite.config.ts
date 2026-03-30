import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Plugin to inject Umami analytics script into index.html at build time.
// Only active when both UMAMI_WEBSITE_ID and UMAMI_SCRIPT_URL environment variables are set.
function umamiAnalytics(): Plugin {
  const websiteId = process.env.UMAMI_WEBSITE_ID?.trim()
  const scriptUrl = process.env.UMAMI_SCRIPT_URL?.trim()

  return {
    name: 'umami-analytics',
    transformIndexHtml(html) {
      if (!websiteId && !scriptUrl) return html

      if (!websiteId || !scriptUrl) {
        console.warn(
          `[umami-analytics] Partial configuration: both UMAMI_WEBSITE_ID and UMAMI_SCRIPT_URL must be set. Missing: ${!websiteId ? 'UMAMI_WEBSITE_ID' : 'UMAMI_SCRIPT_URL'}. Analytics will not be injected.`,
        )
        return html
      }

      return {
        html,
        tags: [
          {
            tag: 'script',
            attrs: { defer: true, src: scriptUrl, 'data-website-id': websiteId },
            injectTo: 'head',
          },
        ],
      }
    },
  }
}

// Plugin to force full page reload when core package files change
// This is needed because HMR doesn't work well with non-React code (constants, utilities)
function corePackageReload(): Plugin {
  return {
    name: 'core-package-reload',
    handleHotUpdate({ file, server }) {
      if (file.includes('/packages/core/src/')) {
        server.ws.send({ type: 'full-reload' })
        return []
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    umamiAnalytics(),
    ...(command === 'serve' ? [corePackageReload()] : []),
  ],
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      // In dev mode, resolve @voie-vitesse/core to source files for hot reload
      ...(command === 'serve' && {
        '@voie-vitesse/core': resolve(__dirname, '../core/src/index.ts'),
      }),
    },
  },
  server: {
    watch: {
      // Watch core package source files for changes
      ignored: ['!**/packages/core/src/**'],
    },
  },
  optimizeDeps: {
    // Exclude core from pre-bundling so changes are detected immediately
    exclude: command === 'serve' ? ['@voie-vitesse/core'] : [],
  },
}))
