#!/usr/bin/env node
import { Command } from 'commander';
import figlet from 'figlet';
import ansis from 'ansis';
import { version } from '../package.json'; // could check if this is of any security concern
import { insert } from './actions/insert';

console.log(
  ansis.magentaBright(
    figlet.textSync('CLI Templater', {
      horizontalLayout: 'default',
      verticalLayout: 'default',
      printDirection: 0, // 0 for left-to-right, 1 for right-to-left
      showHardBlanks: false,
      whitespaceBreak: true,
      font: 'Standard',
    }),
  ),
);
console.log(ansis.cyanBright(figlet.textSync(`version ${version}`)));
console.log(
  ansis.bgCyanBright(
    figlet.textSync(`Developed by: `, {
      font: 'Term',
    }),
  ),
  ansis.cyanBright(
    figlet.textSync(`@duckycoding-dev`, {
      font: 'Term',
    }),
  ),
);

console.log(
  ansis.bgMagentaBright(
    figlet.textSync(`Check the repo at: `, {
      font: 'Term',
    }),
  ),
  ansis.magentaBright(
    figlet.textSync(`https://github.com/duckycoding-dev/cli-templater`, {
      font: 'Term',
    }),
  ),
);

console.log('');

const program = new Command();

// This is used as an example in the README for the Quick Start.

program
  .name('cli-templater')
  .description(
    'Interactive CLI tool that aids in setting up repetitive files with a common structure',
  )
  .version('0.0.1');

/* 
  action callback takes as arguments the following arguments;
  - the arguments passed to the command (as many as you define with the argument() method)
  - the options passed to the command
  - the command itself

  the typings are not great for this, so you can use the Command itself to get the arguments and options:
  - this to retrieve the command itself
  - this.args to retrieve the arguments as an array
  - this.opts() to retrieve the options as an object
*/

program
  .command('insert')
  .description('Insert boilerplate code by choosing from an existing template')
  .argument('[string]', 'argument a', 'a')
  .argument('[string]', 'argument b', 'b')
  .argument('[string]', 'argument c', 'c')
  .option('-d, --debug', 'output extra debugging')
  .action(function () {
    const args = this.args;
    const opts = this.opts();
    console.log(args);
    console.log(opts);
    // console.log(this);
    // console.log(a);
    // console.log(b);
    // console.log(c);
    // console.log(d);
    // console.log(e);
    // console.log(f);
    insert(...args);
  });

program
  .command('split')
  .description('Split a string into substrings and display as an array.')
  .argument('<string>', 'string to split')
  .option('--first', 'display just the first substring')
  .argument('<string>', 'string to split2')
  .option('-s, --separator <char>', 'separator character', ',')
  .action((str, options) => {
    console.log(str);
    console.log(options);
    console.log(options);
    console.log(options.separator);
  });

program.parse(process.argv);

// Execute by calling `node src/index.ts OPTIONS,`
