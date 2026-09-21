import { defineConfig } from 'oxfmt'

export default defineConfig({
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
    stylesheet: './src/app/styles/globals.css',
    functions: ['clsx', 'cva', 'tw', 'tw.*', 'cn'],
    attributes: ['className', 'iconClassName', 'class'],
  },
})
