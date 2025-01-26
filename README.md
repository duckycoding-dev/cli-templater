# cli-templater

Interactive CLI tool that aids in setting up repetitive files with a common structure

# Steps that were taken to create this project

## Project setup

- `bun init`
- setup tsconfig
- `npm init @eslint/config@latest`
- `bun add --save-dev --save-exact prettier`
- `bun add --save-dev eslint-config-prettier`
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

We are using bun to run project scripts and the husky pre-commit script: if you have any issues try installing bun globally `npm install -g bun`

## Libraries used

- CommanderJS: used to create the main interactive flow, define all the available commands format, arguments, etc
  - `bun add commander`
- InquirerJS: used to create the actions used by the Commands
  - `bun add @inquirer/prompts`
- Ansis: used to color console output; ansis is a relatively new library that is competing with Chalk and ColorsJS; its size is very small compared to others and claim to be much faster while being able to handle more use cases.
  I'm trying it out in this project.
  - `bun add ansis`
- Figlet: used to create nice looking ascii art
  - `bun add figlet`
  - `bun add --save-dev @types/figlet`
