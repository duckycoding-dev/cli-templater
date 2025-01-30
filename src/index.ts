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
  .option('-e, --entity <ENTITY NAME>', 'Set default entity name to use')
  .option('-t, --template <TEMPLATE NAME>', 'Set default template to use')
  .option('-v, --validator <VALIDATOR NAME>', 'Set default validator to use')
  .option('--kc, --keepComments', 'Keep comments in generated files')
  .option('-d, --debug', 'output extra debugging')
  .action(async function () {
    const opts = this.opts();

    const formattedOptions = {
      entity: opts.entity,
      template: opts.template?.toLowerCase(),
      removeComments: !opts.keepComments,
      validatorType: opts.validator?.toLowerCase(),
    };

    try {
      await insertBoilerplate({ ...formattedOptions });
    } catch (err) {
      console.error(`❌ ${(err as Error).message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);

// Execute by calling `node src/index.ts OPTIONS,`
