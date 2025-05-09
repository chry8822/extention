import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background.ts'),
        content: resolve(__dirname, 'src/content.ts')
      },
      output: {
        entryFileNames: (chunk) => {
          return chunk.name === 'background' || chunk.name === 'content'
            ? '[name].js'
            : 'assets/[name]-[hash].js'
        }
      }
    },
    emptyOutDir: true,
    sourcemap: true,
    // 확인: public 폴더의 내용이 dist 폴더로 복사됩니다.
    copyPublicDir: true
  },
  publicDir: 'public',
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  define: {
    'process.env': {},
    'global': 'window'
  }
})