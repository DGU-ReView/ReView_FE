import pluginJs from '@eslint/js';
import typescriptParser from '@typescript-eslint/parser';
import prettierPluginRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

import defaultConfig from './eslint/default.mjs';
import importConfig from './eslint/import.mjs';
import reactConfig from './eslint/react.mjs';
import tsConfig from './eslint/typescript.mjs';

import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: ['src/vite-env.d.ts'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
      parser: typescriptParser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    rules: {
      'prettier/prettier': 'warn',
    },
  },
  tsConfig,
  pluginJs.configs.recommended,
  defaultConfig,
  importConfig,
  reactConfig,
  
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  prettierPluginRecommended,
];
