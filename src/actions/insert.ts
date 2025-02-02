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
  const chosenEntityDir = await input({
    message: 'Enter the entity directory:',
    default: './src',
    validate: (input) => {
      if (input.trim() === '') {
        return 'Entity directory cannot be empty';
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
      message: 'Enter the directory for your types:',
      default: './src/types',
      validate: (input) => {
        if (input.trim() === '') {
          return 'Directory cannot be empty';
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
  const SELECTION_CHOICES: Map<string, string> = new Map([
    ['Entity name', `${chosenEntityName}`],
    ['Entity output directory', `${chosenEntityDir}`],
    ['Template', `${chosenTemplate}`],
    ['Validation type', `${chosenValidationType}`],
    [
      separateTypes && chosenTypesDir
        ? 'Types output directory'
        : 'Types saved in entity file',
      separateTypes && chosenTypesDir ? `${chosenTypesDir}` : '',
    ],
    ['Keep comments', `${keepComments ? 'Yes' : 'No'}`],
  ]);

  let colorIndex = 0;
  let color = ansis.cyanBright;
  for (const [title, choice] of SELECTION_CHOICES) {
    if (colorIndex % 2 === 0) {
      color = ansis.cyanBright;
    } else {
      color = ansis.magentaBright;
    }
    if (!choice) {
      console.log(` - ${color(title)}`);
    } else {
      console.log(` - ${title}: ${color(choice)}`);
    }
    colorIndex++;
  }

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

  // ============================= SETUP OUTPUT DIRECTORIES ==============================
  if (!fs.existsSync(chosenEntityDir)) {
    console.warn(`⚠️ Directory "${chosenEntityDir}" does not exist.`);
    const shouldCreate = await confirm({
      message: 'Create it?',
      default: true,
    });
    if (shouldCreate) {
      fs.mkdirSync(chosenEntityDir, { recursive: true });
      console.log(`\n📂 Created directory: ${chosenEntityDir}`);
    } else process.exit(1);
  } else {
    console.log(`\n📂⚠️ Directory ${chosenEntityDir} already exists`);
  }

  if (separateTypes && chosenTypesDir) {
    if (!fs.existsSync(chosenTypesDir)) {
      console.warn(`⚠️ Directory "${chosenTypesDir}" does not exist.`);
      const shouldCreate = await confirm({
        message: 'Create it?',
        default: true,
      });
      if (shouldCreate) {
        fs.mkdirSync(chosenTypesDir, { recursive: true });
        console.log(`\n📂 Created directory: ${chosenTypesDir}`);
      } else process.exit(1);
    } else {
      console.log(`\n📂⚠️ Directory ${chosenEntityDir} already exists`);
    }
  }

  // ==================================== WRITE FILES ====================================
  if (separateTypes && chosenTypesDir) {
    let typesFileSuffix = '';
    if (chosenTypesDir === chosenEntityDir) {
      typesFileSuffix = await input({
        message: 'Enter the suffix for your types filename:',
        default: '.types',
        validate: (input) => {
          if (input.trim() === '') {
            return "Suffix cannot be empty: can't create a type file with the same name as the entity file";
          }
          return true;
        },
      });
    }
    const typesFilePath = path.join(
      chosenTypesDir,
      `${chosenEntityName}${typesFileSuffix}.ts`,
    );
    if (!fs.existsSync(typesFilePath)) {
      fs.writeFileSync(typesFilePath, typesFileContent ?? ''); //the types template might exist and still be empty, we treat this as if the user wanted an empty file
      console.log(`📝 Created types file: ${path.resolve(typesFilePath)}`);
    } else {
      console.log(`\n⚠️ Entity types file already exists at ${typesFilePath}`);
      const shouldOverwrite = await confirm({
        message: 'Do you want to overwrite the existing entity file?',
        default: false,
      });
      if (shouldOverwrite) {
        fs.writeFileSync(typesFilePath, typesFileContent ?? ''); //the types template might exist and still be empty, we treat this as if the user wanted an empty file
        console.log(`📝 Created types file: ${path.resolve(typesFilePath)}`);
      } else {
        const incrementalNameTypesFilePath = writeFileWithIncrementalName(
          typesFilePath,
          typesFileContent ?? '', //the types template might exist and still be empty, we treat this as if the user wanted an empty file
          true,
        );
        console.log(
          `📝 Created types file: ${path.resolve(incrementalNameTypesFilePath)}`,
        );
      }
    }
  }

  const mainFilePath = path.join(chosenEntityDir, `${chosenEntityName}.ts`);
  if (!fs.existsSync(mainFilePath)) {
    fs.writeFileSync(mainFilePath, mainFileContent);
    console.log(`📝 Created main file: ${path.resolve(mainFilePath)}`);
  } else {
    console.log(`\n⚠️ Entity main file already exists at ${mainFilePath}`);
    const shouldOverwrite = await confirm({
      message: 'Do you want to overwrite the existing entity file?',
      default: false,
    });
    if (shouldOverwrite) {
      fs.writeFileSync(mainFilePath, mainFileContent);
      console.log(`📝 Created main file: ${path.resolve(mainFilePath)}`);
    } else {
      const incrementalNameMainFilePath = writeFileWithIncrementalName(
        mainFilePath,
        mainFileContent,
        true,
      );
      console.log(
        `📝 Created main file: ${path.resolve(incrementalNameMainFilePath)}`,
      );
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
