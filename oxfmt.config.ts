import { defineConfig } from 'oxfmt'

export default defineConfig({
  ignore: ['.claude', '.agents'],
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
    stylesheet: './src/app/globals.css',
    functions: ['clsx', 'cva', 'tw', 'tw.*', 'cn'],
    attributes: ['className', 'iconClassName', 'class'],
  },
})
