import { basePreset, browserAddon, reactAddon } from '@ephys/eslint-config-typescript';
import * as mdx from 'eslint-plugin-mdx';

const __dirname = import.meta.dirname;

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      // archives
      'static/v1',
      'static/v2',
      'static/v3',
      'static/v4',
      'static/v5',
      // auto-generated
      'static/api',
      'build',
      '.sequelize',
      '.docusaurus',
      '**/_category_.json',

      // We do not currently support JSX in JS files, and we can't use the .jsx or .tsx extensions in
      // docusaurus theme files because of the way they are imported by docusaurus.
      'src/theme/**/*.js',
    ],
  },
  ...basePreset(__dirname),
  ...reactAddon,
  ...browserAddon,
  mdx.configs.flat,
  mdx.configs.flatCodeBlocks,
  {
    // https://github.com/facebook/docusaurus/issues/6520
    files: ['*.cjs', 'docusaurus.config.js', 'sidebars.js'],
    languageOptions: {
      sourceType: 'commonjs',
    },
    rules: {
      'unicorn/prefer-module': 'off',
      'import/no-commonjs': 'off',
    },
  },
  {
    settings: {
      'mdx/code-blocks': true,
    },
  },
  {
    files: ['**/*.mdx', '**/*.md'],
    rules: {
      // Produces broken results
      'react/jsx-indent': 'off',
      'react/jsx-tag-spacing': 'off',
      'import/first': 'off',

      // these rules require proper type-checking and cannot be enabled on code snippets inside markdown files
      '@typescript-eslint/dot-notation': 'off',
      '@typescript-eslint/return-await': 'off',
      '@typescript-eslint/no-throw-literal': 'off',
      '@typescript-eslint/no-implied-eval': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      '@typescript-eslint/prefer-includes': 'off',
      '@typescript-eslint/prefer-readonly': 'off',
      '@typescript-eslint/prefer-string-starts-ends-with': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/require-array-sort-compare': 'off',
      '@typescript-eslint/promise-function-async': 'off',
      '@typescript-eslint/consistent-type-exports': 'off',
      '@typescript-eslint/prefer-return-this-type': 'off',
    },
  },
  {
    files: ['**/*.d.ts', 'src/pages/*', 'src/theme/**/*', '*.config.*'],
    rules: {
      // in .d.ts files, we don't really have a choice as it's dictated by the file that's being typed.
      // For pages and theme files, docusaurus imposes the default export
      'import/no-default-export': 'off',
    },
  },
];
