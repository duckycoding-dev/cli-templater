/**
 * @filename: lint-staged.config.js
 * @type {import('lint-staged').Configuration}
 */
const configs = {
  '*.{js,jsx,ts,tsx}': (stagedFiles) => [
    `eslint .`,
    `prettier --ignore-unknown --write ${stagedFiles.join(' ')}`,
  ],
};

// this configuration runs eslint and prettier (in order) on all staged files
// that are JavaScript or TypeScript files
// the `--ignore-unknown` flag tells prettier to ignore files that are not supported to avoid errors

export default configs;
