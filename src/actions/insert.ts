import { input, select, confirm } from '@inquirer/prompts';
import * as fs from 'fs';
import * as path from 'path';
import ansis from 'ansis';
import {
  TemplateProcessor,
  type ProcessingOptions,
  type TemplateConfig,
} from '../utils/template/templateProcessor';
import {
  importTemplateConfigs,
  importValidatorConfigs,
} from '../utils/imports';
import { formatEntityName, validateEntityNameInput } from '@/utils/entity';
import { writeFileWithIncrementalName } from '@/utils/filesystem';

export async function insertBoilerplateAction(
  commandLineOptions: Partial<
    ProcessingOptions & { template: string; debug: boolean; print: boolean }
  >,
) {
  console.log('\n💡 Let’s set up your boilerplate!');

  // Step 1: Get entity name
  if (commandLineOptions.entity) {
    validateEntityNameInput(commandLineOptions.entity, true);
  }
  let chosenEntityName =
    commandLineOptions.entity ||
    (await input({
      message: 'Enter the entity name:',
      default: commandLineOptions.entity || 'entity',
      validate: (input) => validateEntityNameInput(input),
    }));

  chosenEntityName = formatEntityName(chosenEntityName, false);

  // Step 2: Get base directory
  const chosenBaseDir = await input({
    message: 'Enter the base directory:',
    default: './src',
    validate: (input) => {
      if (input.trim() === '') {
        return 'Base directory cannot be empty';
      }
      return true;
    },
  });

  // Step 3: Choose template

  const templatesDir = path.resolve(__dirname, '../templates');
  const templateChoices = fs.readdirSync(templatesDir).filter((file) => {
    return fs.statSync(path.join(templatesDir, file)).isDirectory();
  });

  if (templateChoices.length === 0) {
    throw new Error('No templates found in the templates directory');
  }

  const chosenTemplate =
    commandLineOptions.template &&
    templateChoices.includes(commandLineOptions.template)
      ? commandLineOptions.template
      : (
          await select<string>({
            message: 'Choose the template to use:',
            choices: templateChoices,
            default: templateChoices[0],
          })
        ).toLowerCase();

  let templateConfigs: TemplateConfig;
  try {
    templateConfigs = await importTemplateConfigs(chosenTemplate);
  } catch (err) {
    throw new Error(
      `Error importing template configs:\n${(err as Error).message}`,
    );
  }

  // Step 4: Validation type
  const chosenValidationType =
    commandLineOptions.validatorType &&
    templateConfigs.validatorSupport.includes(commandLineOptions.validatorType)
      ? commandLineOptions.validatorType
      : (
          await select<string>({
            message: 'Choose what type of validation to use:',
            choices: templateConfigs.validatorSupport,
            default: templateConfigs.validatorSupport[0],
          })
        ).toLowerCase();

  // Step 5: Generate types in separate file
  const separateTypes = await confirm({
    message: 'Do you want generate types to a separate file?',
    default: true,
  });

  let chosenTypesDir: string | undefined;
  if (separateTypes) {
    chosenTypesDir = await input({
      message: 'Enter the base directory for your types:',
      default: './src/types',
      validate: (input) => {
        if (input.trim() === '') {
          return 'Base directory cannot be empty';
        }
        return true;
      },
    });
  }

  // Step 6: Keep comments in generated files
  const keepComments =
    !commandLineOptions.removeComments ||
    (await confirm({
      message: 'Do you want to keep comments in generated files?',
      default: false,
    }));

  // Output the collected data (or implement the boilerplate generation logic)
  console.log('\n✅ Your selections:');
  console.log(`- Entity name: ${ansis.cyanBright(chosenEntityName)}`);
  console.log(`- Base directory: ${ansis.magentaBright(chosenBaseDir)}`);
  console.log(`- Template: ${ansis.cyanBright(chosenTemplate)}`);
  console.log(`- Validation type: ${ansis.cyanBright(chosenValidationType)}`);
  if (separateTypes && chosenTypesDir) {
    console.log(`- Types directory: ${ansis.magentaBright(chosenTypesDir)}`);
  } else {
    console.log('- Types saved in entity file');
  }
  console.log(
    `- Keep comments: ${ansis.magentaBright(keepComments ? 'Yes' : 'No')}`,
  );

  const processor = new TemplateProcessor();

  processor.registerTemplate(chosenTemplate, templateConfigs);

  if (chosenValidationType && chosenValidationType !== 'none') {
    try {
      const validatorConfigs = await importValidatorConfigs(
        chosenTemplate,
        chosenValidationType,
      );
      processor.registerValidator(chosenValidationType, validatorConfigs);
    } catch (err) {
      throw new Error(
        `Error importing validator configs:\n${(err as Error).message}`,
      );
    }
  }
  let mainFileContent: string;
  let typesFileContent: string | undefined;

  try {
    const { mainFileContent: main, typesFileContent: types } =
      await processor.processTemplate(chosenTemplate, {
        removeComments: !keepComments,
        entity: chosenEntityName,
        validatorType: chosenValidationType,
        separateTypes: separateTypes,
      });
    mainFileContent = main;
    typesFileContent = types;
  } catch (err) {
    throw new Error(`Error processing template:\n${(err as Error).message}`);
  }

  // Create the base directory and example files (if desired)

  if (!fs.existsSync(chosenBaseDir)) {
    console.error(`⚠️ Directory "${chosenBaseDir}" does not exist.`);
    const shouldCreate = await confirm({
      message: 'Create it?',
      default: true,
    });
    if (shouldCreate) fs.mkdirSync(chosenBaseDir, { recursive: true });
    else process.exit(1);
  }

  const entityDir = path.join(chosenBaseDir, chosenEntityName);
  if (!fs.existsSync(entityDir)) {
    fs.mkdirSync(entityDir, { recursive: true });
    console.log(`\n📂 Created directory: ${entityDir}`);
  } else {
    console.log(`\n📂⚠️ Directory ${entityDir} already exists`);
  }
  //   console.log(`\n⚠️ Entity already exists at ${entityDir}`);
  //   const shouldOverwrite = await confirm({
  //     message: 'Do you want to overwrite the existing entity?',
  //     default: false,
  //   });
  //   if (!shouldOverwrite) process.exit(1);
  //   fs.mkdirSync(entityDir, { recursive: true });
  // }
  const mainFilePath = path.join(entityDir, `${chosenEntityName}.ts`);
  if (!fs.existsSync(mainFilePath)) {
    fs.writeFileSync(mainFilePath, mainFileContent);
  } else {
    console.log(`\n⚠️ Entity main file already exists at ${mainFilePath}`);
    const shouldOverwrite = await confirm({
      message: 'Do you want to overwrite the existing entity file?',
      default: false,
    });
    if (shouldOverwrite) {
      fs.writeFileSync(mainFilePath, mainFileContent);
      console.log(`📝 Created main file: ${mainFilePath}`);
    } else {
      const incrementalNameMainFilePath = writeFileWithIncrementalName(
        mainFilePath,
        mainFileContent,
        true,
      );
      console.log(`📝 Created main file: ${incrementalNameMainFilePath}`);
    }
  }

  if (separateTypes && chosenTypesDir) {
    const typesDir = path.join(chosenTypesDir, chosenEntityName);
    const typesFilePath = path.join(
      typesDir,
      `${chosenEntityName}${typesDir === entityDir ? '.types' : ''}.ts`,
    );
    if (!fs.existsSync(typesFilePath)) {
      fs.writeFileSync(typesFilePath, typesFileContent ?? ''); //the types template might exist and still be empty, we treat this as if the user wanted an empty file
    } else {
      console.log(`\n⚠️ Entity types] file already exists at ${typesFilePath}`);
      const shouldOverwrite = await confirm({
        message: 'Do you want to overwrite the existing entity file?',
        default: false,
      });
      if (shouldOverwrite) {
        fs.writeFileSync(typesFilePath, typesFileContent ?? ''); //the types template might exist and still be empty, we treat this as if the user wanted an empty file
        console.log(`📝 Created types file: ${typesFilePath}`);
      } else {
        const incrementalNameTypesFilePath = writeFileWithIncrementalName(
          typesFilePath,
          typesFileContent ?? '', //the types template might exist and still be empty, we treat this as if the user wanted an empty file
          true,
        );
        console.log(`📝 Created types file: ${incrementalNameTypesFilePath}`);
      }
    }
  }

  if (commandLineOptions.print) {
    console.log('=================================================');
    console.log('================MAIN FILE CONTENT================');
    console.log('=================================================');
    console.log(mainFileContent);

    console.log('=================================================');
    console.log('===============TYPES FILE CONTENT================');
    console.log('=================================================');
    console.log(ansis.greenBright(typesFileContent));
  }
}
