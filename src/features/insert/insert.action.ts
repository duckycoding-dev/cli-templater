import { input, select, confirm } from '@inquirer/prompts';
import * as fs from 'fs';
import * as path from 'path';
import ansis from 'ansis';
import {
  TemplateProcessor,
  type ProcessingOptions,
  type TemplateConfig,
} from '../../processors/TemplateProcessor';
import {
  importTemplateConfigs,
  importValidatorConfigs,
} from '../../utils/imports';
import { formatEntityName, validateEntityNameInput } from '@/utils/entity';
import { writeFileWithIncrementalName } from '@/utils/filesystem';
import { thereIsAtLeastOneDependency } from '@/utils/processors';
import { printWithHeadings } from '@/utils/logs';
import { isValidDirectory } from '@/utils/strings';

export async function insertBoilerplateAction(
  commandLineOptions: Partial<
    ProcessingOptions & {
      template: string;
      print: boolean;
      separateFileForTypes: boolean;
      makeNewDirectories: boolean;
      entityDir: string;
      typesDir: string;
      overwrite: boolean;
      append: boolean;
    }
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
  const chosenEntityDir =
    commandLineOptions.entityDir ||
    (await input({
      message: 'Enter the entity directory:',
      default: './src',
      validate: (input) => {
        if (input.trim() === '') {
          return 'Entity directory cannot be empty';
        }
        if (!isValidDirectory(input)) return false;
        return true;
      },
    }));

  // Step 3: Choose template

  const templatesDir = path.resolve(__dirname, '../templates');
  const templateChoices = fs.readdirSync(templatesDir).filter((file) => {
    return fs.statSync(path.join(templatesDir, file)).isDirectory();
  });

  if (templateChoices.length === 0) {
    throw new Error('No templates found in the templates directory');
  }

  if (
    commandLineOptions.template &&
    !templateChoices.includes(commandLineOptions.template)
  )
    throw new Error(
      `Template "${commandLineOptions.template}" not found among the existing templates; check for typos or create a new template with that name.`,
    );

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
  if (
    commandLineOptions.validatorType &&
    commandLineOptions.validatorType !== 'none' &&
    !templateConfigs.validatorSupport.includes(commandLineOptions.validatorType)
  )
    throw new Error(
      `The template "${commandLineOptions.template}" does not support the validator type "${commandLineOptions.validatorType}"; check for typos or add the validator to the template's validatorSupport array.
      If no validator is supported, use "none" as the validator type.`,
    );
  let chosenValidationType =
    commandLineOptions.validatorType &&
    (templateConfigs.validatorSupport.includes(
      commandLineOptions.validatorType,
    ) ||
      commandLineOptions.validatorType.toLowerCase() === 'none')
      ? commandLineOptions.validatorType.toLowerCase()
      : (
          await select<string>({
            message: 'Choose what type of validation to use:',
            choices: ['none', ...templateConfigs.validatorSupport],
            default: ['none'],
          })
        ).toLowerCase();

  // Step 5: Generate types in separate file
  const separateTypes =
    commandLineOptions.separateFileForTypes ||
    (await confirm({
      message: 'Do you want generate types to a separate file?',
      default: true,
    }));

  let chosenTypesDir: string | undefined;
  if (separateTypes) {
    chosenTypesDir =
      commandLineOptions.typesDir ||
      (await input({
        message: 'Enter the directory for your types:',
        default: './src/types',
        validate: (input) => {
          if (input.trim() === '') {
            return 'Directory cannot be empty';
          }
          if (!isValidDirectory(input)) return false;
          return true;
        },
      }));
  }

  // Step 6: Keep comments in generated files
  const keepComments =
    !commandLineOptions.removeComments ||
    (await confirm({
      message: 'Do you want to keep comments in generated files?',
      default: false,
    }));

  // Output the collected data (or implement the boilerplate generation logic)
  console.log('\n📋 Your selections:');
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

  chosenValidationType =
    chosenValidationType === 'none' ? 'default' : chosenValidationType;
  if (chosenValidationType) {
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
    const shouldCreate =
      commandLineOptions.makeNewDirectories ||
      (await confirm({
        message: 'Create it?',
        default: true,
      }));
    if (shouldCreate) {
      fs.mkdirSync(chosenEntityDir, { recursive: true });
      console.log(`📂 Created directory: ${chosenEntityDir}`);
    } else process.exit(1);
  } else {
    console.log(`📂⚠️ Directory ${chosenEntityDir} already exists`);
  }

  if (separateTypes && chosenTypesDir) {
    if (!fs.existsSync(chosenTypesDir)) {
      console.warn(`⚠️ Directory "${chosenTypesDir}" does not exist.`);
      const shouldCreate =
        commandLineOptions.makeNewDirectories ||
        (await confirm({
          message: 'Create it?',
          default: true,
        }));
      if (shouldCreate) {
        fs.mkdirSync(chosenTypesDir, { recursive: true });
        console.log(`📂 Created directory: ${chosenTypesDir}`);
      } else process.exit(1);
    } else {
      console.log(`📂⚠️ Directory ${chosenEntityDir} already exists`);
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
      console.log(`⚠️ Entity types file already exists at ${typesFilePath}`);
      let shouldOverwrite = commandLineOptions.overwrite;
      // if the user didn't specify to overwrite and didn't specify to append, ask for confirmation
      if (!commandLineOptions.overwrite && !commandLineOptions.append) {
        shouldOverwrite = await confirm({
          message: 'Do you want to overwrite the existing types file?',
          default: false,
        });
      }
      if (shouldOverwrite) {
        fs.writeFileSync(typesFilePath, typesFileContent ?? ''); //the types template might exist and still be empty, we treat this as if the user wanted an empty file
        console.log(`📝 Created types file: ${path.resolve(typesFilePath)}`);
      } else {
        const appendToExistingFile =
          commandLineOptions.append ||
          (await confirm({
            message:
              'Do you want to append to the existing types file instead?',
            default: false,
          }));
        if (appendToExistingFile) {
          fs.appendFileSync(typesFilePath, `\n${typesFileContent}`);
        }
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
    console.log(`⚠️ Entity main file already exists at ${mainFilePath}`);
    let shouldOverwrite = commandLineOptions.overwrite;
    // if the user didn't specify to overwrite and didn't specify to append, ask for confirmation
    if (!commandLineOptions.overwrite && !commandLineOptions.append) {
      shouldOverwrite = await confirm({
        message: 'Do you want to overwrite the existing entity file?',
        default: false,
      });
    }
    if (shouldOverwrite) {
      fs.writeFileSync(mainFilePath, mainFileContent);
      console.log(`📝 Created main file: ${path.resolve(mainFilePath)}`);
    } else {
      const appendToExistingFile =
        commandLineOptions.append ||
        (await confirm({
          message: 'Do you want to append to the existing entity file instead?',
          default: false,
        }));
      if (appendToExistingFile) {
        fs.appendFileSync(mainFilePath, `\n${mainFileContent}`);
      }
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

  console.log('✨ Boilerplate setup complete!\n');

  if (thereIsAtLeastOneDependency(processor.getTemplates())) {
    console.log(
      ansis.cyanBright('Dependencies required by the chosen template'),
    );
  }
  processor.getTemplates().forEach((template) => {
    if (Object.entries(template?.devDependencies ?? {}).length) {
      console.log(`${template.name} dependencies:`);
    }
    Object.entries(template.dependencies ?? {}).forEach(([name, version]) => {
      console.log(`"${name}": "${version}"`);
    });

    if (Object.entries(template?.devDependencies ?? {}).length) {
      console.log(`${template.name} devDependencies:`);
    }
    Object.entries(template.devDependencies ?? {}).forEach(
      ([name, version]) => {
        console.log(`"${name}": "${version}"`);
      },
    );
  });

  if (thereIsAtLeastOneDependency(processor.getValidators())) {
    console.log(
      ansis.magentaBright('Dependencies required by the used validators'),
    );
  }

  processor.getValidators().forEach((validator) => {
    if (Object.entries(validator?.devDependencies ?? {}).length) {
      console.log(`${validator.name} dependencies:`);
    }
    Object.entries(validator.dependencies ?? {}).forEach(([name, version]) => {
      console.log(`"${name}": "${version}"`);
    });

    if (Object.entries(validator?.devDependencies ?? {}).length) {
      console.log(`${validator.name} devDependencies:`);
    }
    Object.entries(validator.devDependencies ?? {}).forEach(
      ([name, version]) => {
        console.log(`"${name}": "${version}"`);
      },
    );
  });

  if (commandLineOptions.print) {
    const contentToPrint = [
      { title: 'main file content', content: mainFileContent },
    ];
    if (typesFileContent)
      contentToPrint.push({
        title: 'types file content',
        content: typesFileContent,
      });
    printWithHeadings(contentToPrint);
  }
}
