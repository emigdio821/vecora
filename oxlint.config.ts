import { defineConfig } from 'oxlint'

export default defineConfig({
  ignorePatterns: ['**/src/components/ui/**'],
  plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'promise', 'nextjs', 'react', 'react-perf', 'jsx-a11y'],
  rules: {
    'object-shorthand': 'error',
    'react/rules-of-hooks': 'error',
    'react/self-closing-comp': 'error',
    'typescript/no-explicit-any': 'error',
    'react/jsx-no-useless-fragment': 'error',
    'typescript/consistent-type-imports': 'error',
    'typescript/consistent-type-definitions': 'error',
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
})
