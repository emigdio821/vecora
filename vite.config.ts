import { paraglideVitePlugin } from '@inlang/paraglide-js'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig, lazyPlugins } from 'vite-plus'

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  fmt: {
    ignorePatterns: ['.claude', '.agents', '**/src/routeTree.gen.ts', '**/src/paraglide/**'],
    tabWidth: 2,
    semi: false,
    useTabs: false,
    printWidth: 110,
    endOfLine: 'lf',
    singleQuote: true,
    sortImports: {
      newlinesBetween: false,
    },
    sortTailwindcss: {
      preserveWhitespace: false,
      stylesheet: './src/styles/globals.css',
      functions: ['clsx', 'cva', 'tw', 'tw.*', 'cn'],
      attributes: ['className', 'iconClassName', 'class'],
    },
  },
  lint: {
    ignorePatterns: [
      '.claude',
      '.agents',
      '**/src/components/ui/**',
      '**/src/routeTree.gen.ts',
      '**/src/paraglide/**',
    ],
    plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'promise', 'react', 'react-perf', 'jsx-a11y'],
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    rules: {
      'object-shorthand': 'error',
      'react/rules-of-hooks': 'error',
      'react/self-closing-comp': 'error',
      'typescript/no-explicit-any': 'error',
      'react/jsx-no-useless-fragment': 'error',
      'typescript/consistent-type-imports': 'error',
      'typescript/consistent-type-definitions': 'error',
      'vite-plus/prefer-vite-plus-imports': 'error',
    },
    categories: {
      correctness: 'error',
    },
    env: {
      builtin: true,
    },
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  resolve: { tsconfigPaths: true },
  server: { port: 3000 },
  // Native binary: dev's dependency optimizer can't bundle it.
  optimizeDeps: { exclude: ['@resvg/resvg-js'] },
  build: {
    rolldownOptions: {
      checks: {
        moduleLevelDirective: false,
      },
    },
  },
  plugins: lazyPlugins(() => [
    // The strategy lives in project.inlang/paraglide.config.ts.
    paraglideVitePlugin({ project: './project.inlang', outdir: './src/paraglide' }),
    tailwindcss(),
    tanstackStart(),
    nitro({
      vercel: { functions: { regions: ['iad1'] } },
      // Packages that only work unbundled. pdfkit resolves its fonts through
      // package.json "imports"; satori's harfbuzzjs loads its wasm from __dirname.
      // The tracer misses those files, hence the full copies (*).
      traceDeps: ['@react-pdf/renderer', 'pdfkit*', 'satori', 'harfbuzzjs*'],
      compressPublicAssets: { gzip: true, brotli: true },
    }),
    viteReact(),
  ]),
})
