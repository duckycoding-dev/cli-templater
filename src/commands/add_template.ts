import { addTemplateAction } from '@/actions/add_template';
import type { Command } from 'commander';

export const addTemplateCommand = (program: Command) => {
  return program
    .command('add-template')
    .description('Create a new template')
    .action(async () => {
      try {
        await addTemplateAction();
      } catch (err) {
        console.error(`❌ ${(err as Error).message}`);
        process.exit(1);
      }
    });
};
