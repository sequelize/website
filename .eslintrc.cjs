// eslint does not properly load plugins loaded by presets
// this fixes that
require('@rushstack/eslint-patch/modern-module-resolution');

/** @type import('eslint/') */
module.exports = {
  extends: [
    '@ephys/eslint-config-typescript',
    '@ephys/eslint-config-typescript/react',
    '@ephys/eslint-config-typescript/browser',

    // https://github.com/facebook/docusaurus/issues/6520
    '@ephys/eslint-config-typescript/commonjs',
    'plugin:mdx/recommended',
  ],
  rules: {
    // there are not supported enough in recent browsers to justify enforcing their usage
    'prefer-object-has-own': 'off',
    'unicorn/prefer-at': 'off',
    'unicorn/prefer-string-replace-all': 'off',
  },
  overrides: [{
    files: ['*.mdx/**', '*.md/**'],
    rules: {
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
  }],
  ignorePatterns: [
    // archives
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

    // as sad as it is, eslint-mdx has a syntax error when a JSX tag includes a code block
    // https://github.com/mdx-js/eslint-mdx/issues/367
    '*.mdx',

    // rules that should not run on json files are, for some unknown reason, ran.
    // need to figure out why before removing this:
    '*.json',
  ],
  settings: {
    'mdx/code-blocks': true,
  },
};
