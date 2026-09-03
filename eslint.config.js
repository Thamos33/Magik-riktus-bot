import js from '@eslint/js';
import globals from 'globals';

export default [
  // Configuration recommandée ESLint JS
  js.configs.recommended,

  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node, // Support des globales Node.js (process, console, Buffer, etc.)
        ...globals.es2021,
      },
    },
    rules: {
      // Règles personnalisées du projet
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Ignore les arguments préfixés par _
      'no-console': 'off', // Autorisera l'usage des logs console pour le bot
    },
  },
];
