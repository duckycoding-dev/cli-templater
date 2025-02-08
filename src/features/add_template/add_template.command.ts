import {
  containsOnlyLettersNumbersAndUnderscores,
  containsOnlyLettersNumbersUnderscoresAndDashes,
} from 'utils/strings';
import {
  addTemplateAction,
  type AddTemplateOptions,
} from './add_template.action';
import type { Command } from 'commander';

export const addTemplateCommand = (program: Command) => {
  return program
    .command('add-template')
    .description('Create a new template')
    .option(
      '-n, --name <TEMPLATE NAME>',
      'Set the name of the template to create',
    )
    .option(
      '-f, --filename <FILENAME>',
      'Set the filename of the template to create',
    )
    .option(
      '-d, --description <DESCRIPTION>',
      'Set the description of the template to create',
    )
    .action(async function () {
      const opts = this.opts();
      const invalidOptionsErrors: string[] = [];

      if (!opts.name?.trim())
        invalidOptionsErrors.push('The template name must not be empty');
      if (!opts.description?.trim())
        invalidOptionsErrors.push(
          'The template description must not be empty: either provide one or omit the option flag',
        );

      if (
        !opts.filename ||
        !opts.filename.trim() ||
        containsOnlyLettersNumbersUnderscoresAndDashes(opts.filename.trim())
      ) {
        invalidOptionsErrors.push(
          'The filename must not be empty and must only contain letters, numbers, underscores and dashes',
        );
      }

      if (invalidOptionsErrors.length > 0) {
        invalidOptionsErrors.forEach((option) => console.error(`❌ ${option}`));
        process.exit(1);
      }

      const formattedOptions: AddTemplateOptions = {
        name: opts.name?.trim(),
        filename: opts.filename?.trim(),
        description: opts.description?.trim(),
      };
      try {
        await addTemplateAction(formattedOptions);
      } catch (err) {
        console.error(`❌ ${(err as Error).message}`);
        process.exit(1);
      }
    });
};
