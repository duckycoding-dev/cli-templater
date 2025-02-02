import { insertBoilerplateAction } from '@/actions/insert';
import type { Command } from 'commander';

export const insertCommand = (program: Command) => {
  return program
    .command('insert')
    .description(
      'Insert boilerplate code by choosing from an existing template',
    )
    .option('-e, --entity <ENTITY NAME>', 'Set default entity name to use')
    .option('-t, --template <TEMPLATE NAME>', 'Set default template to use')
    .option('-v, --validator <VALIDATOR NAME>', 'Set default validator to use')
    .option('--kc, --keep_comments', 'Keep comments in generated files')
    .option('-d, --debug', 'Output extra debugging')
    .option(
      '-p, --print',
      'Prints the generated content to the console as well',
    )
    .action(async function () {
      const opts = this.opts();

      const formattedOptions = {
        entity: opts.entity,
        template: opts.template?.toLowerCase(),
        removeComments: !opts.keepComments,
        validatorType: opts.validator?.toLowerCase(),
        debug: opts.debug,
        print: opts.print,
      };

      try {
        await insertBoilerplateAction(formattedOptions);
      } catch (err) {
        console.error(`❌ ${(err as Error).message}`);
        process.exit(1);
      }
    });
};
