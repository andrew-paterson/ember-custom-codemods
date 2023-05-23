module.exports = {
  globals: {
    require: true,
    process: true,
    module: true,
  },
  root: true,
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  extends: ['eslint:recommended'],
  env: {
    browser: true,
  },
  rules: {},
  overrides: [
    // node files
    {
      files: ['.eslintrc.js'],
      parserOptions: {
        sourceType: 'script',
      },
      env: {
        browser: false,
        node: true,
      },
      plugins: ['node'],
      rules: Object.assign({}, require('eslint-plugin-node').configs.recommended.rules, {
        // add your custom rules and overrides for node files here

        // this can be removed once the following is fixed
        // https://github.com/mysticatea/eslint-plugin-node/issues/77
        'node/no-unpublished-require': 'off',
      }),
    },
  ],
};
