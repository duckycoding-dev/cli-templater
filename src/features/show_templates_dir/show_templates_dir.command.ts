import type { Command } from 'commander';
import { showTemplatesDirAction } from './show_templates_dir.action';

export const showTemplatesDirCommand = (program: Command) => {
  return program
    .command('show-dir')
    .description('Get the path to the templates directory')
    .action(async function () {
      showTemplatesDirAction();
    });
};
