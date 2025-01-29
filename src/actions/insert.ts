import { input, select, confirm } from '@inquirer/prompts';
import * as fs from 'fs';
import * as path from 'path';
import ansis from 'ansis';
import { TemplateProcessor } from '../utils/template/templateProcessor';
import {
  importTemplateConfigs,
  importValidatorConfigs,
} from '../utils/template/imports';

export async function insertBoilerplate() {
  console.log('\n💡 Let’s set up your boilerplate!');

  // Step 1: Get entity name
  const chosenEntityName = await input({
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
  const chosenBaseDir = await input({
    message: 'Enter the base directory:',
    default: './src/',
    validate: (input) => {
      if (input.trim() === '') {
        return 'Base directory cannot be empty';
      }
      return true;
    },
  });

  // Step 3: Choose template
  const chosenTemplate = (
    await select<string>({
      message: 'Choose the template to use:',
      choices: ['Hono', 'Express'],
      default: 'Hono',
    })
  ).toLowerCase();

  // Step 4: Keep comments in generated files
  const keepComments = await confirm({
    message: 'Do you want to keep comments in generated files?',
    default: false,
  });

  // Step 5: Validation type
  const templateConfigs = await importTemplateConfigs(chosenTemplate);

  const chosenValidationType = (
    await select<string>({
      message: 'Choose what type of validation to use:',
      choices: templateConfigs.validatorSupport,
      default: templateConfigs.validatorSupport[0],
    })
  ).toLowerCase();

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
  console.log(`- Entity name: ${ansis.cyanBright(chosenEntityName)}`);
  console.log(`- Base directory: ${ansis.magentaBright(chosenBaseDir)}`);
  console.log(`- Template: ${ansis.cyanBright(chosenTemplate)}`);
  console.log(`- Remove comments: ${ansis.magentaBright(keepComments)}`);
  console.log(`- Validation type: ${ansis.cyanBright(chosenValidationType)}`);
  if (separateTypes) {
    console.log(`- Types directory: ${ansis.magentaBright(typesDir)}`);
  } else {
    console.log('- Types saved in entity file');
  }

  const processor = new TemplateProcessor();

  processor.registerTemplate(chosenTemplate, templateConfigs);

  if (chosenValidationType && chosenValidationType !== 'none') {
    const validatorConfigs = await importValidatorConfigs(
      chosenTemplate,
      chosenValidationType,
    );
    processor.registerValidator(chosenValidationType, validatorConfigs);
  }
  const generatedCode = await processor.processTemplate(chosenTemplate, {
    removeComments: !keepComments,
    entity: chosenEntityName,
    validatorType: chosenValidationType,
  });

  console.log(generatedCode);
  // let boilerplateContent = '';
  // const { default: template } = await import(
  //   `../templates/${framework.toLowerCase()/${framework.toLowerCase()}`
  // );
  // boilerplateContent = generateFromTemplate(template, entityName, keepComments);

  // Create the base directory and example files (if desired)
  const entityDir = path.join(chosenBaseDir, chosenEntityName);
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
