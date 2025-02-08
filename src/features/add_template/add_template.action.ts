import { input, confirm } from '@inquirer/prompts';
import * as fs from 'fs';
import * as path from 'path';
import ansis from 'ansis';
import {
  containsOnlyLettersAndNumbers,
  containsOnlyLettersNumbersUnderscoresAndDashes,
} from 'utils/strings';
import type { TemplateConfig } from 'processors/TemplateProcessor';

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
  if (fs.existsSync(templatePath)) {
    const overwrite = await confirm({
      message: `Template "${templateFilename}" already exists. Overwrite?`,
      default: false,
    });
    if (!overwrite) {
      console.log(ansis.red('❌ Operation cancelled.'));
      return;
    }
    fs.rmSync(templatePath, { recursive: true });
  }

  // Step 4: Get output extension
  const templateOutputExtension =
    options.outputExtension ||
    (
      await input({
        message:
          'Enter the output file extension (e.g.: "ts", "js", "md", "html"):',
        validate: (input) => {
          if (!input.trim()) return 'Output extension cannot be empty.';
          if (!containsOnlyLettersAndNumbers(input))
            return 'Output extension must only contain letters and numbers';
          return true;
        },
      })
    )?.trim();

  // Step 5: Get output extension
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

  // Step 6: Get required placeholders
  const requiredPlaceholders = await input({
    message:
      'Enter required placeholders (comma-separated, e.g.: "entity, Entity, entities"), or pass empty if you you don\'t want any:',
    default: 'entity, Entity, entities',
  });
  const requiredKeys = requiredPlaceholders
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);

  // Step 7: Get optional placeholders
  const optionalPlaceholders = await input({
    message:
      'Enter optional placeholders (comma-separated, e.g.: "imports, types"), or pass empty if you you don\'t want any:',
    default: undefined,
  });
  const optionalKeys = optionalPlaceholders
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);

  // Step 8: Choose validator support
  const validatorSupport = await input({
    message:
      'Enter supported validation types (comma-separated, e.g.: "zod, yup"), or pass empty if you you don\'t want any:',
    default: undefined,
  });
  const validators = validatorSupport
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);

  // Step 9: Choose dev dependencies if any
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

  // Step 10: Choose dependencies if any
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

  // Step 11: Create template directory & files
  fs.mkdirSync(templatePath, { recursive: true });

  // Config file
  const config: TemplateConfig = {
    name: templateName,
    description: templateDescription,
    filename: templateFilename,
    validatorSupport: validators,
    outputExtension: templateOutputExtension,
    typesFileOutputExtension: templateTypesFileOutputExtension,
    placeholders: requiredKeys
      .map((placeholder) => ({
        [placeholder]: {
          required: true,
          description: '',
        },
      }))
      .concat(
        optionalKeys.map((placeholder) => ({
          [placeholder]: {
            required: false,
            description: '',
          },
        })),
      ),
    dependencies: templateDependencies,
    devDependencies: templateDevDependencies,
  };
  fs.writeFileSync(
    path.join(templatePath, `${templateFilename}.config.json`),
    JSON.stringify(config, null, 2),
  );

  if (templateTypesFileOutputExtension) {
    fs.writeFileSync(
      path.join(templatePath, `${templateFilename}.types.js`),
      JSON.stringify(config, null, 2),
    );
  }

  // Sample template file
  let templateContent = '';
  if (requiredKeys.length) {
    templateContent += '// Required placeholders you must use\n';
  }
  templateContent += requiredKeys.map((key) => `// - {{${key}}}`).join('\n');
  if (optionalKeys.length) {
    templateContent += '\n// Optional placeholders you could\n';
  }
  templateContent += optionalKeys.map((key) => `// - {{${key}}}`).join('\n');

  fs.writeFileSync(
    path.join(templatePath, `${templateFilename}.js`),
    templateContent,
  );

  console.log(ansis.green('\n✅ Template created successfully!'));
  console.log(`📂 Location: ${ansis.cyan(templatePath)}`);
};
