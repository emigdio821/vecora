import { defineConfig } from '@inlang/paraglide-js'
import { MULTI_LANGUAGE } from '../src/lib/config/i18n'

// Read by both the vite plugin and `npm run i18n`, so they compile the same runtime.
export default defineConfig({
  // The visitor's own choice, then their browser's, then Spanish. Signing in
  // sets the cookie to the HOA's default language when there's none yet.
  // With a single language, everyone gets Spanish.
  strategy: MULTI_LANGUAGE ? ['cookie', 'preferredLanguage', 'baseLocale'] : ['baseLocale'],
})
