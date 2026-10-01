import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**', 'codex/**']
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    },
    rules: {
      'max-lines': ['error', 160],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_' }
      ]
    }
  },
  {
    files: ['*.js', 'backend/**/*.{js,ts}'],
    languageOptions: {
      globals: globals.node
    }
  },
  {
    files: ['frontend/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: globals.browser
    }
  }
);
