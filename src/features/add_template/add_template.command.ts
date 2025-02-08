import {
  containsOnlyLettersAndNumbers,
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
    .option(
      '-o, --output-extension <OUTPUT EXTENSION>',
      'Set the output extension of the template to create',
    )
    .action(async function () {
      const opts = this.opts();
      const invalidOptionsErrors: string[] = [];
      console.log(opts);

      if (opts.name && !opts.name?.trim())
        invalidOptionsErrors.push(
          'The template name must not be empty: provide a valid name or omit the option flag',
        );

      if (opts.description && !opts.description?.trim())
        invalidOptionsErrors.push(
          'The template description must not be empty: either provide one or omit the option flag',
        );

      if (
        opts.filename &&
        !opts.filename.trim() &&
        !containsOnlyLettersNumbersUnderscoresAndDashes(opts.filename.trim())
      ) {
        invalidOptionsErrors.push(
          'The filename must not be empty and must only contain letters, numbers, underscores and dashes: provide a valid value or omit the option flag',
        );
      }

      if (
        opts['output-extension'] &&
        !opts['output-extension'].trim() &&
        !containsOnlyLettersAndNumbers(opts.filename.trim())
      ) {
        invalidOptionsErrors.push(
          'The output extension must not be empty and must only contain letters and numbers: provide a valid value or omit the option flag',
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
