#!/usr/bin/env node
import { Command } from 'commander';
import { version } from '../package.json'; // could check if this is of any security concern
import { welcome } from './actions/welcome';
import { insertCommand } from './commands/insert';
import { addTemplateCommand } from './commands/add_template';

const program = new Command();

if (process.argv.length === 2) {
  welcome(version);
}

program
  .name('cli-templater')
  .description(
    'Interactive CLI tool that aids in setting up repetitive files with a common structure',
  )
  .version(version);

insertCommand(program);
addTemplateCommand(program);

program.parse(process.argv);

/* 
  action callback takes as arguments the following arguments;
  - the arguments passed to the command (as many as you define with the argument() method)
  - the options passed to the command
  - the command itself

  the typings are not great for this, so you can use the Command itself to get the arguments and options:
  - this to retrieve the command itself
  - this.args to retrieve the arguments as an array
  - this.opts() to retrieve the options as an object
  Note: this is not available in the action callback if you use an arrow function, only in a regular function.
*/

// .argument('[string]', 'optional argument', 'default value')
// .argument('<string>', 'non optional argument')
