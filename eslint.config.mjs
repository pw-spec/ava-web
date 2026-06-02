import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // Config files and generated output are not application code; don't lint them.
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts',
      'coverage/**',
      '*.config.mjs',
      '*.config.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/lib/llm', '**/lib/llm/**', '@/lib/llm', '@/lib/llm/**'],
              message:
                'The LLM client may only be imported by /lib/safeguards. Route all model calls through runChatPipeline.',
            },
          ],
        },
      ],
    },
  },
  {
    // The safeguards layer is the single legitimate consumer of /lib/llm.
    files: ['lib/safeguards/**/*.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
);
