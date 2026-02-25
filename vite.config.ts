import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    basicSsl(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router'],
          'vendor-ui': ['lucide-react', 'motion', '@radix-ui/react-dialog', '@radix-ui/react-select'],
          'vendor-charts': ['recharts'],
        },
      },
    },
  },
})
