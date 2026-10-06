import { defineConfig } from 'oxfmt'

export default defineConfig({
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
})
