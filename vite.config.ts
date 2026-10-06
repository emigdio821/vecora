import { paraglideVitePlugin } from '@inlang/paraglide-js'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  server: { port: 3000 },
  // Native binary: dev's dependency optimizer can't bundle it.
  optimizeDeps: { exclude: ['@resvg/resvg-js'] },
  build: {
    rolldownOptions: {
      // Libraries ship "use client" for RSC apps; this app doesn't use RSC, so dropping it is fine.
      onLog(level, log, handler) {
        if (log.code === 'MODULE_LEVEL_DIRECTIVE') return
        handler(level, log)
      },
    },
  },
  plugins: [
    // The strategy lives in project.inlang/paraglide.config.ts.
    paraglideVitePlugin({ project: './project.inlang', outdir: './src/paraglide' }),
    tailwindcss(),
    tanstackStart(),
    nitro({
      vercel: { functions: { regions: ['pdx1'] } },
      // Packages that only work unbundled. pdfkit resolves its fonts through
      // package.json "imports"; satori's harfbuzzjs loads its wasm from __dirname.
      // The tracer misses those files, hence the full copies (*).
      traceDeps: ['@react-pdf/renderer', 'pdfkit*', 'satori', 'harfbuzzjs*'],
    }),
    viteReact(),
  ],
})
