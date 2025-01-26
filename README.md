# cli-templater

Interactive CLI tool that aids in setting up repetitive files with a common structure

# Steps that were taken to create this project

## Project setup

- bun init
- setup tsconfig
- npm init @eslint/config@latest
- bun add --save-dev --save-exact prettier
- bun add --save-dev eslint-config-prettier
- add config to run prettier on commit using Husky and Lint Staged:
  ```
  bun add --dev husky lint-staged
  bunx husky init
  bun --eval "fs.writeFileSync('.husky/pre-commit','bunx lint-staged\n')"
  ```
- add lint-staged.config.js
- add prettier.config.js
- add vscode config file (`.vscode/settings.json`)
  - set `"editor.defaultFormatter": "esbenp.prettier-vscode"` to use the prettier extension to format your code
  - set `"editor.formatOnSave": true,` to run the formatter whenever we save

After having configured both prettier and eslint, make sure to restart your IDE to make sure those changes are applied.
