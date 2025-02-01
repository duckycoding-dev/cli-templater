import { Command } from 'commander';
import { input, confirm } from '@inquirer/prompts';
import * as fs from 'fs';
import * as path from 'path';
import ansis from 'ansis';

const templatesDir = path.resolve(__dirname, '../templates');

export const addTemplateAction = async () => {
  console.log('\n📌 Let’s create a new template!');

  // Step 1: Get template name
  const templateName = await input({
    message: 'Enter the template name:',
    validate: (input) => {
      if (!input.trim()) return 'Template name cannot be empty.';
      if (!/^[a-zA-Z0-9_-]+$/.test(input))
        return 'Template name must only contain letters, numbers, dashes, and underscores.';
      return true;
    },
  });

  const templatePath = path.join(templatesDir, templateName);
  if (fs.existsSync(templatePath)) {
    const overwrite = await confirm({
      message: `Template "${templateName}" already exists. Overwrite?`,
      default: false,
    });
    if (!overwrite) {
      console.log(ansis.red('❌ Operation cancelled.'));
      return;
    }
    fs.rmSync(templatePath, { recursive: true });
  }

  // Step 2: Get required placeholders
  const requiredPlaceholders = await input({
    message:
      'Enter required placeholders (comma-separated, e.g., entity, Entity, entities):',
    default: 'entity, Entity, entities',
  });
  const requiredKeys = requiredPlaceholders
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);

  // Step 3: Get optional placeholders
  const optionalPlaceholders = await input({
    message:
      'Enter optional placeholders (comma-separated, e.g., imports, types):',
    default: 'imports, types',
  });
  const optionalKeys = optionalPlaceholders
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);

  // Step 4: Choose validator support
  const validatorSupport = await input({
    message:
      'Enter supported validation types (comma-separated, e.g., zod, yup):',
    default: 'zod, yup, none',
  });
  const validators = validatorSupport
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);

  // Step 5: Create template directory & files
  fs.mkdirSync(templatePath, { recursive: true });

  // Config file
  const config = {
    requiredPlaceholders: requiredKeys,
    optionalPlaceholders: optionalKeys,
    validatorSupport: validators,
  };
  fs.writeFileSync(
    path.join(templatePath, 'config.json'),
    JSON.stringify(config, null, 2),
  );

  // Sample template file
  const templateContent = requiredKeys
    .map((key) => `// Placeholder: {{${key}}}`)
    .join('\n');
  fs.writeFileSync(path.join(templatePath, 'template.ts'), templateContent);

  console.log(ansis.green('\n✅ Template created successfully!'));
  console.log(`📂 Location: ${ansis.cyan(templatePath)}`);
};
