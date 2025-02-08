import { input, confirm, checkbox } from '@inquirer/prompts';
import * as fs from 'fs';
import * as path from 'path';
import ansis from 'ansis';
import {
  containsOnlyLettersAndNumbers,
  containsOnlyLettersNumbersSpacesAndUnderscores,
  containsOnlyLettersNumbersUnderscoresAndDashes,
  removeExtraSpaces,
  removeFirstNewline,
  removeMultipleEmptyLines,
} from 'utils/strings';
import {
  DEFAULT_TEMPLATE_PLACEHOLDERS,
  type TemplateConfig,
  type TemplatePlaceholderSchema,
} from 'processors/TemplateProcessor';
import type {
  ValidatorConfig,
  ValidatorPlaceholderDataSchema,
} from 'processors/ValidatorProcessor';

const templatesDir = path.resolve(__dirname, '../../templates');

export type AddTemplateOptions = {
  filename?: string;
  name?: string;
  description?: string;
  outputExtension?: string;
  typesFileOutputExtension?: string;
};

export const addTemplateAction = async (options: AddTemplateOptions) => {
  console.log('\n📌 Let’s create a new template!');

  // Step 1: Get template name
  const templateName =
    options.name ||
    (
      await input({
        message: 'Enter the template descriptive name:',
        validate: (input) => {
          if (!input.trim()) return 'Template name cannot be empty.';
          return true;
        },
      })
    )?.trim();

  // Step 2: Get template filename
  const templateFilename =
    options.filename ||
    (
      await input({
        message: 'Enter the generated template filename:',
        validate: (input) => {
          if (!input.trim()) return 'Template filename cannot be empty.';
          if (!containsOnlyLettersNumbersUnderscoresAndDashes(input))
            return 'The filename must not be empty and must only contain letters, numbers, underscores and dashes';
          return true;
        },
      })
    )?.trim();

  // Step 3: Get template filename
  const templateDescription =
    options.description ||
    (
      await input({
        message: 'Enter the generated template description (or pass empty):',
      })
    )?.trim();

  const templatePath = path.join(templatesDir, templateFilename);
  let overwriteExistingTemplate = false;
  if (fs.existsSync(templatePath)) {
    overwriteExistingTemplate = await confirm({
      message: `Template "${templateFilename}" already exists. Overwrite?`,
      default: false,
    });
    if (!overwriteExistingTemplate) {
      console.log(ansis.red('❌ Operation cancelled.'));
      return;
    }
  }

  // Step 4: Get output extension
  const templateOutputExtension =
    options.outputExtension ||
    (
      await input({
        message:
          'Enter the output file extension (e.g.: "ts", "js", "md", "html"):',
        default: 'ts',
        validate: (input) => {
          if (!input.trim()) return 'Output extension cannot be empty.';
          if (!containsOnlyLettersAndNumbers(input))
            return 'Output extension must only contain letters and numbers';
          return true;
        },
      })
    )?.trim();

  // Step 5: Get types file output extension
  const templateTypesFileOutputExtension =
    options.typesFileOutputExtension ||
    (
      await input({
        message:
          'Enter the file extension for the types file (e.g.: "ts", "d.ts"), or omit if you don\'t want a file for types:',
        validate: (input) => {
          if (input.trim() && !containsOnlyLettersAndNumbers(input))
            return 'Output extension must only contain letters and numbers';
          return true;
        },
        default: 'ts',
      })
    )?.trim();

  // Step 6: Choose template placeholders from the list of default placeholders to mark as required
  const DEFAULT_TEMPLATE_PLACEHOLDERS_NAMES = Object.entries(
    DEFAULT_TEMPLATE_PLACEHOLDERS,
  ).map(([placeholderName]) => placeholderName);
  const chosenRequiredTemplatePlaceholders = await checkbox<string>({
    message:
      'Choose from this default list the placeholders to use and mark as required (their implementations are automatically handled by the templater)\n',
    choices: DEFAULT_TEMPLATE_PLACEHOLDERS_NAMES,
    pageSize: 20,
    instructions: true,
    loop: true,
    prefix: 'ciao',
  });

  // Step 7: Choose template placeholders from the list of default placeholders to mark as optional
  const chosenOptionalTemplatePlaceholders =
    chosenRequiredTemplatePlaceholders.length <
    DEFAULT_TEMPLATE_PLACEHOLDERS_NAMES.length
      ? await checkbox<string>({
          message:
            'Choose from this default list the placeholders to use and mark as optional (their implementations are automatically handled by the templater)\n',
          choices: DEFAULT_TEMPLATE_PLACEHOLDERS_NAMES.filter(
            (placeholderName) => {
              return !chosenRequiredTemplatePlaceholders.includes(
                placeholderName,
              );
            },
          ),
          instructions: true,
          pageSize: 20,
          loop: true,
          prefix: 'ciao',
        })
      : [];

  // Step 8: Get required placeholders for validators
  const requiredKeys = await input({
    message:
      'Enter required placeholders for your content (comma-separated, e.g.: "imports, dataLog"), or pass empty if you you don\'t want any:',
    default: 'imports, dataLog',
  });
  const requiredPlaceholdersForValidators = requiredKeys
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean)
    .filter(
      (placeholder) =>
        !chosenRequiredTemplatePlaceholders.includes(placeholder) &&
        !chosenOptionalTemplatePlaceholders.includes(placeholder),
    );

  // Step 9: Get optional placeholders for validators
  const optionalKeys = await input({
    message:
      'Enter optional placeholders for your content (comma-separated, e.g.: "imports, dataLog"), or pass empty if you you don\'t want any:',
    default: undefined,
  });
  const optionalPlaceholdersForValidators = optionalKeys
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean)
    .filter(
      (placeholder) =>
        !requiredPlaceholdersForValidators.includes(placeholder) &&
        !chosenRequiredTemplatePlaceholders.includes(placeholder) &&
        !chosenOptionalTemplatePlaceholders.includes(placeholder),
    );

  // Step 10: Choose validator support
  const validatorSupport = await input({
    message:
      'Enter supported validation types (comma-separated, e.g.: "zod, yup"), or pass empty if you you don\'t want any (a default validator will always be created and will need customization):',
    default: undefined,
    validate: (input) => {
      if (!input.trim()) return true;
      const values = input.split(',').map((key) => key.trim());
      if (
        values.some(
          (value) => !containsOnlyLettersNumbersSpacesAndUnderscores(value),
        )
      ) {
        return 'Validators names can only contain letters, numbers, spaces and underscores (notice that spaces will be transformed into underscores)';
      }
      return true;
    },
  });
  const validators = validatorSupport
    .split(',')
    .map((key) => removeExtraSpaces(key.trim()))
    .filter(Boolean);

  // Step 11: Choose dev dependencies if any
  const devDependenciesInput = await input({
    message:
      'Enter recommended devDependencies (comma-separated, e.g.: "lodash@^4.17.21, axios@^0.21.1"), or pass empty if you don\'t want any:',
    default: undefined,
  });
  const templateDevDependencies = devDependenciesInput
    .split(',')
    .map((dep) => dep.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, dep) => {
      const atIndex = dep.lastIndexOf('@');
      const name = dep.slice(0, atIndex)?.trim();
      const version = dep.slice(atIndex + 1)?.trim();
      if (name && version) {
        acc[name] = version;
      } else {
        console.error(
          `❌ Invalid dependency: ${dep}, skipping. Manually add it to the template later.`,
        );
      }
      return acc;
    }, {});

  // Step 12: Choose dependencies if any
  const dependenciesInput = await input({
    message:
      'Enter recommended dependencies (comma-separated, e.g.: "lodash@^4.17.21, axios@^0.21.1"), or pass empty if you don\'t want any:',
    default: undefined,
  });
  const templateDependencies = dependenciesInput
    .split(',')
    .map((dep) => dep.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, dep) => {
      const atIndex = dep.lastIndexOf('@');
      const name = dep.slice(0, atIndex)?.trim();
      const version = dep.slice(atIndex + 1)?.trim();
      if (name && version) {
        acc[name] = version;
      } else {
        console.error(
          `❌ Invalid dependency: ${dep}, skipping. Manually add it to the template later.`,
        );
      }
      return acc;
    }, {});

  // Step 13: Create template directory & files

  if (overwriteExistingTemplate) {
    fs.rmSync(templatePath, { recursive: true });
  }
  fs.mkdirSync(templatePath, { recursive: true });

  const templatePlaceholders: TemplatePlaceholderSchema = {
    ...chosenRequiredTemplatePlaceholders.reduce<TemplatePlaceholderSchema>(
      (acc, placeholder) => {
        acc[placeholder] = { required: true, description: '' };
        return acc;
      },
      {},
    ),
    ...chosenOptionalTemplatePlaceholders.reduce<TemplatePlaceholderSchema>(
      (acc, placeholder) => {
        acc[placeholder] = { required: false, description: '' };
        return acc;
      },
      {},
    ),
  };
  // Config files
  const templateConfig: TemplateConfig = {
    name: templateName,
    description: templateDescription,
    filename: templateFilename,
    validatorSupport: validators,
    outputExtension: templateOutputExtension,
    typesFileOutputExtension: templateTypesFileOutputExtension,
    placeholders: templatePlaceholders,
    dependencies: templateDependencies,
    devDependencies: templateDevDependencies,
  };
  fs.writeFileSync(
    path.join(templatePath, `${templateFilename}.config.json`),
    JSON.stringify(templateConfig, null, 2),
  );

  if (templateTypesFileOutputExtension) {
    fs.writeFileSync(
      path.join(templatePath, `${templateFilename}.types.js`),
      '\n\nexport default``;\n',
    );
  }

  const validatorPLaceholders: Record<string, ValidatorPlaceholderDataSchema> =
    {
      ...requiredPlaceholdersForValidators.reduce<
        Record<string, ValidatorPlaceholderDataSchema>
      >((acc, placeholder) => {
        acc[placeholder] = { required: true, description: '' };
        return acc;
      }, {}),
      ...optionalPlaceholdersForValidators.reduce<
        Record<string, ValidatorPlaceholderDataSchema>
      >((acc, placeholder) => {
        acc[placeholder] = { required: false, description: '' };
        return acc;
      }, {}),
    };

  const validatorConfig: ValidatorConfig = {
    placeholders: validatorPLaceholders,
    name: `default validator config for ${templateConfig.name}`,
    description: `default validator config for ${templateConfig.name}`,
    dependencies: {},
    devDependencies: {},
  };

  fs.mkdirSync(`${templatePath}/validators`, { recursive: true });
  fs.writeFileSync(
    path.join(templatePath, `validators/default.config.json`),
    JSON.stringify(validatorConfig, null, 2),
  );

  validators.forEach((validatorName) => {
    const config = {
      ...validatorConfig,
      name: `${validatorName} validator config for ${templateConfig.name}`,
      description: `${validatorName} validator config for ${templateConfig.name}`,
    };
    fs.writeFileSync(
      path.join(templatePath, `validators/${validatorName}.config.json`),
      JSON.stringify(config, null, 2),
    );
  });

  // Sample template file
  let templateContent = '';
  const filteredRequiredKeys = chosenRequiredTemplatePlaceholders
    .concat(requiredPlaceholdersForValidators)
    .filter((key) => {
      if (key === 'types')
        return templateTypesFileOutputExtension ? false : true;
      else {
        return true;
      }
    });
  if (filteredRequiredKeys.length) {
    templateContent += '// Required placeholders you must use\n';
  }
  templateContent += filteredRequiredKeys
    .map((key) => `// - {{${key}}}`)
    .join('\n');

  const filteredOptionalKeys = chosenOptionalTemplatePlaceholders
    .concat(optionalPlaceholdersForValidators)
    .filter((key) => {
      if (key === 'types')
        return templateTypesFileOutputExtension ? false : true;
      else {
        return true;
      }
    });
  if (filteredOptionalKeys.length) {
    templateContent += '\n\n// Optional placeholders you could use\n';
  }
  templateContent += filteredOptionalKeys
    .map((key) => `// - {{${key}}}`)
    .join('\n');

  if (templateTypesFileOutputExtension) {
    templateContent += '\n\n// Types file is available\n';
    templateContent += `// Use following ${requiredPlaceholdersForValidators.includes('types') ? 'required' : 'optional'} placeholder (provided by the @cli-templater default placeholders) where you want to include types when not generating a separate types file\n`;
    templateContent += `// - {{types}}\n`;
  }

  templateContent += '\n\nexport default``;\n';

  fs.writeFileSync(
    path.join(templatePath, `${templateFilename}.js`),
    removeFirstNewline(removeMultipleEmptyLines(templateContent)),
  );

  console.log(ansis.green('\n✅ Template created successfully!'));
  console.log(`📂 Location: ${ansis.cyan(templatePath)}`);
};
