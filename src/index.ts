#!/usr/bin/env node
import { Command } from 'commander';
import { version } from '../package.json'; // could check if this is of any security concern
import { insertBoilerplate } from './actions/insert';
import { welcome } from './actions/welcome';

const program = new Command();

// This is used as an example in the README for the Quick Start.

if (process.argv.length === 2) {
  welcome(version);
}

program
  .name('cli-templater')
  .description(
    'Interactive CLI tool that aids in setting up repetitive files with a common structure',
  )
  .version(version);

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

program
  .command('insert')
  .description('Insert boilerplate code by choosing from an existing template')
  .option('-d, --debug', 'output extra debugging')
  .action(function () {
    const args = this.args;
    const opts = this.opts();
    console.log(args);
    console.log(opts);
    // const insertAction = new InsertAction(args, opts);
    // insertAction.insert();

    insertBoilerplate();
  });

program.parse(process.argv);

// Execute by calling `node src/index.ts OPTIONS,`
