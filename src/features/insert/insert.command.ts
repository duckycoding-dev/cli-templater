import { insertBoilerplateAction } from '@/features/insert/insert.action';
import { isValidDirectory } from '@/utils/strings';
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
    .option('--st, --separate_types', 'Place types in a separate file')
    .option('--mkdir, --make_dirs', 'Make directories if they do not exist yet')
    .option(
      '--edir, --entityDir <ENTITY DIRECTORY>',
      'Set where the main file will be generated',
    )
    .option(
      '--tdir, --typesDir <TYPES DIRECTORY>',
      'Set where the types file will be generated',
    )
    .option(
      '-p, --print',
      'Prints the generated content to the console as well',
    )
    .option(
      '-o, --overwrite',
      'Overwrite existing files (if any) without asking for confirmation - USE WITH CAUTION (this has precedence over the append option)',
    )
    .option(
      '-a, --append',
      'Append to existing files (if any) without asking for confirmation - USE WITH CAUTION',
    )
    .action(async function () {
      const opts = this.opts();

      const formattedOptions = {
        entity: opts.entity,
        template: opts.template?.toLowerCase(),
        removeComments: !opts.keep_comments,
        separateFileForTypes: opts.separate_types,
        print: opts.print,
        makeNewDirectories: opts.make_dirs,
        validatorType: opts.validator?.toLowerCase(),
        entityDir: opts.entityDir?.toLowerCase(),
        typesDir: opts.typesDir?.toLowerCase(),
        overwrite: opts.overwrite,
        append: opts.append,
      };

      const invalidOptions = [];
      if (
        formattedOptions.entityDir &&
        !isValidDirectory(formattedOptions.entityDir)
      )
        invalidOptions.push('The entity directory you provided is invalid');
      if (
        formattedOptions.typesDir &&
        !isValidDirectory(formattedOptions.typesDir)
      )
        invalidOptions.push('The types directory you provided is invalid');

      if (invalidOptions.length > 0) {
        invalidOptions.forEach((option) => console.error(`❌ ${option}`));
        process.exit(1);
      }

      try {
        await insertBoilerplateAction(formattedOptions);
      } catch (err) {
        console.error(`❌ ${(err as Error).message}`);
        process.exit(1);
      }
    });
};
