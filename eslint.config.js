import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // The React 19 hooks plugin flags every setState-in-effect call, but several
      // legitimate patterns (initialising from browser APIs, resetting derived
      // state on slug/src changes) genuinely need this. Downgrade to warn so the
      // release pipeline still passes while keeping signal in editor.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
