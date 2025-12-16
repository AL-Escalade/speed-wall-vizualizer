import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

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
