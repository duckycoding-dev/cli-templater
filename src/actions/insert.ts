import { input, select, confirm } from '@inquirer/prompts';
import * as fs from 'fs';
import * as path from 'path';
import { generateFromTemplate } from '../utils';
import ansis from 'ansis';

export async function insertBoilerplate() {
  console.log('\n💡 Let’s set up your boilerplate!');

  // Step 1: Get entity name
  const entityName = await input({
    message: 'Enter the entity name:',
    default: 'entity',
    validate: (input) => {
      if (input.trim() === '') {
        return 'Entity name cannot be empty';
      }
      if (!/^[a-zA-Z0-9_]+$/.test(input)) {
        return 'Entity name must only contain letters, numbers, and underscores';
      }
      if (/^[0-9]/.test(input)) {
        return 'Entity name must not start with a number';
      }
      return true;
    },
  });

  // Step 2: Get base directory
  const baseDir = await input({
    message: 'Enter the base directory:',
    default: './src/',
    validate: (input) => {
      if (input.trim() === '') {
        return 'Base directory cannot be empty';
      }
      return true;
    },
  });

  // Step 3: Choose framework template
  const framework: string = await select({
    message: 'Choose the framework template to use:',
    choices: ['Hono', 'ExpressJS'],
    default: 'Hono',
  });

  // Step 4: Keep comments in generated files
  const keepComments = await confirm({
    message: 'Do you want to keep comments in generated files?',
    default: false,
  });

  // Step 5: Use Zod for validation
  const useZod = await confirm({
    message: 'Do you want to use Zod for validation?',
    default: true,
  });

  // Step 6: Generate types in separate file
  const separateTypes = await confirm({
    message: 'Do you want generate types to a separate file?',
    default: true,
  });

  let typesDir: string | undefined;
  if (separateTypes) {
    typesDir = await input({
      message: 'Enter the base directory:',
      default: './src/types/',
      validate: (input) => {
        if (input.trim() === '') {
          return 'Base directory cannot be empty';
        }
        return true;
      },
    });
  }

  // Output the collected data (or implement the boilerplate generation logic)
  console.log('\n✅ Your selections:');
  console.log(`- Entity name: ${ansis.cyanBright(entityName)}`);
  console.log(`- Base directory: ${ansis.magentaBright(baseDir)}`);
  console.log(`- Framework: ${ansis.cyanBright(framework)}`);
  console.log(`- Remove comments: ${ansis.magentaBright(keepComments)}`);
  console.log(`- Use Zod: ${ansis.cyanBright(useZod ? 'Yes' : 'No')}`);
  if (separateTypes) {
    console.log(`- Types directory: ${ansis.magentaBright(typesDir)}`);
  } else {
    console.log('- Types saved in entity file');
  }

  let boilerplateContent = '';
  const { default: template } = await import(
    `../templates/frameworks/${framework.toLowerCase()}`
  );
  boilerplateContent = generateFromTemplate(template, entityName, keepComments);

  // Create the base directory and example files (if desired)
  const entityDir = path.join(baseDir, entityName);
  if (!fs.existsSync(entityDir)) {
    // fs.mkdirSync(entityDir, { recursive: true });
    console.log(`\n📂 Created directory: ${entityDir}`);
  } else {
    console.log(`\n⚠️ Directory already exists: ${entityDir}`);
  }

  // const boilerplateFile = path.join(entityDir, `${entityName}.ts`);
  // fs.writeFileSync(boilerplateFile, boilerplateContent);
  // console.log(`📝 Created boilerplate file: ${boilerplateFile}`);
}
