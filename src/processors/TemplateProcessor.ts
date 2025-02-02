import { z } from 'zod';
import pluralize from 'pluralize';
import { importTemplate, importTypesTemplate } from '../utils/imports';
import { ValidatorProcessor, type ValidatorConfig } from './ValidatorProcessor';
import { validateEntityNameInput } from '../utils/entity';
import ansis from 'ansis';
/*
 * These placeholders will always be handled by the template processor in a special way
 * and are available in all templates
 * If the user provides a placeholder with the same name, it will override these
 * Thus, if the user wants to make these placeholders NOT optional, they should set `required` to `true`
 */
const DEFAULT_TEMPLATE_PLACEHOLDERS = [
  {
    entity: {
      description: 'The name of the entity, camelCase format',
      required: false,
    },
  },
  {
    entities: {
      description: 'The name of the entity in plural form, camelCase format',
      required: false,
    },
  },
  {
    Entity: {
      description: 'The name of the entity in PascalCase',
      required: false,
    },
  },
  {
    Entities: {
      description: 'The name of the entity in plural form, in PascalCase',
      required: false,
    },
  },
  {
    entity_: {
      description: 'The name of the entity, snake_case format',
      required: false,
    },
  },
  {
    entities_: {
      description: 'The name of the entity in plural form, snake_case format',
      required: false,
    },
  },
  {
    ENTITY_: {
      description: 'The name of the entity, SCREAMING_SNAKE_CASE format',
      required: false,
    },
  },
  {
    ENTITIES_: {
      description:
        'The name of the entity in plural form, SCREAMING_SNAKE_CASE format',
      required: false,
    },
  },
  {
    'entity-': {
      description: 'The name of the entity, kebab-case format',
      required: false,
    },
  },
  {
    'entities-': {
      description: 'The name of the entity in plural form, kebab-case format',
      required: false,
    },
  },
  {
    types: {
      description: 'Types definitions for the entity',
      required: false,
    },
  },
] as const satisfies TemplatePlaceholderSchema[];

const TemplatePlaceholderSchema = z.record(
  z.string(),
  z.object({
    description: z.string().optional(),
    required: z.boolean().default(false),
  }),
);

export const TemplateConfigSchema = z
  .object({
    filename: z.string().min(1, 'Filename is required'),
    name: z.string().optional(),
    author: z.string().optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    version: z.string(),
    placeholders: z.array(TemplatePlaceholderSchema).default([]),
    validatorSupport: z.array(z.string()).default(['default']),
    dependencies: z.record(z.string(), z.string()).optional(),
    devDependencies: z.record(z.string(), z.string()).optional(),
  })
  .transform((data) => ({
    ...data,
    name: data.name ?? data.filename, // Set `name` to `filename` if not provided
  }));

export const ProcessingOptionsSchema = z.object({
  entity: z.string().refine(
    (entityName) => validateEntityNameInput(entityName) === true,
    (entityName: string) => {
      const errorMessage = validateEntityNameInput(entityName);
      return {
        message:
          typeof errorMessage === 'string'
            ? errorMessage
            : 'Invalid entity name',
      };
    },
  ),
  removeComments: z.boolean({
    message: 'You must defined whether you want to remove comments or not',
  }),
  validatorType: z.string().default('none'),
  separateTypes: z.boolean({
    message:
      'You must specifiy if you want to store the types in a separate file',
  }),
});

export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;
export type ProcessingOptions = z.infer<typeof ProcessingOptionsSchema>;
export type TemplatePlaceholderSchema = z.infer<
  typeof TemplatePlaceholderSchema
>;

type HookType = 'pre-process' | 'post-process';
type PreProcessHook = (options: ProcessingOptions) => void | Promise<void>;
type PostProcessHook = (
  code: string,
  options: ProcessingOptions,
) => string | Promise<string>;

/** Mapping hook types to their corresponding function signatures */
type HookTypeMapping = {
  'pre-process': PreProcessHook[];
  'post-process': PostProcessHook[];
};

type HookMapping = {
  [K in HookType]: HookTypeMapping[K];
};

export class TemplateProcessor {
  private templates: Map<string, TemplateConfig>;
  private validators: Map<string, ValidatorConfig>;
  private hooks: HookMapping;
  private validatorProcessor?: ValidatorProcessor;
  private rawTemplate?: string;
  private mainFileContent?: string;
  private rawTypesTemplate?: string;
  private typesFileContent?: string;

  constructor() {
    this.templates = new Map();
    this.validators = new Map();
    this.hooks = {
      'pre-process': [],
      'post-process': [],
    };

    // Register built-in processing hooks
    this.registerHook('pre-process', this.validateOptions);
    this.registerHook('post-process', this.removeCommentsIfNeeded);
    this.registerHook('post-process', this.removeLeftoverPlaceholders);
    this.registerHook('post-process', this.normalizeCommas);
    this.registerHook('post-process', this.removeMultipleEmptyLines);
    this.registerHook('post-process', this.removeFirstNewline);
  }

  /** Registers a new template */
  registerTemplate(name: string, template: TemplateConfig) {
    if (this.templates.has(name)) {
      console.warn(`Template "${name}" already exists and will be overwritten`);
    }
    this.templates.set(name, template);
  }

  /** Registers a new validator */
  registerValidator(name: string, config: ValidatorConfig) {
    if (this.validators.has(name)) {
      console.warn(
        `Validator "${name}" already exists and will be overwritten`,
      );
    }
    this.validators.set(name, config);
  }

  /** Reads a template file and returns the content */
  private async loadTemplate(templateName: string): Promise<string> {
    return await importTemplate(templateName);
  }

  /** Registers a processing hook */
  registerHook<T extends HookType>(
    hookType: T,
    hook: HookMapping[T][number],
  ): void {
    if (hookType === 'pre-process') {
      this.hooks['pre-process'].push(hook as PreProcessHook);
    } else {
      this.hooks['post-process'].push(hook as PostProcessHook);
    }
  }

  async runHooks(
    hookType: 'pre-process',
    options: ProcessingOptions,
  ): Promise<void>;
  async runHooks(
    hookType: 'post-process',
    code: string,
    options: ProcessingOptions,
  ): Promise<string>;
  async runHooks<T extends HookType>(
    hookType: T,
    input: T extends 'pre-process' ? ProcessingOptions : string,
    options?: ProcessingOptions,
  ): Promise<void | string> {
    if (hookType === 'pre-process') {
      const phaseHooks = this.hooks['pre-process'] ?? [];
      for (const hook of phaseHooks) {
        await hook(input as ProcessingOptions);
      }
      return;
    } else {
      const phaseHooks = this.hooks['post-process'] ?? [];
      let code = input as string;
      for (const hook of phaseHooks) {
        code = await hook(code, options!);
      }
      return code;
    }
  }

  /** Ensures valid options before processing */
  private async validateOptions(processingOptions: ProcessingOptions) {
    const parsed = ProcessingOptionsSchema.safeParse(processingOptions);
    if (parsed.error) {
      throw new Error(
        `Options are not valid:\n${parsed.error.errors
          .map((e, index) => {
            console.log(e.path);
            const errorMessage = `${index + 1}- ${e.message}`;
            return index % 2 === 0
              ? ansis.blueBright(errorMessage)
              : errorMessage;
          })
          .join('\n')}`,
      );
    }
  }

  /** Replaces placeholders in the template string */
  private replaceDefaultEntityNamePlaceholders(
    template: string,
    entityName: string,
  ): string {
    const formattedEntitySnakeCase = entityName
      .toLowerCase()
      .replace(/(?:\s*\s)+/g, '_');
    const formattedEntityScreamingSnakeCase =
      formattedEntitySnakeCase.toUpperCase();
    const formattedEntityKebabCase = formattedEntitySnakeCase.replaceAll(
      '_',
      '-',
    );
    const formattedEntityCamelCase = formattedEntitySnakeCase.replace(
      /(_\w)/g,
      (match) => match[1].toUpperCase(),
    );
    const formattedEntityPascalCase =
      formattedEntityCamelCase.charAt(0).toUpperCase() +
      formattedEntityCamelCase.slice(1);

    const formattedEntityCamelCasePlural = pluralize(formattedEntityCamelCase);
    const formattedEntityPascalCasePlural = pluralize(
      formattedEntityPascalCase,
    );
    const formattedEntityKebabCasePlural = pluralize(formattedEntityKebabCase);
    const formattedEntitySnakeCasePlural = pluralize(formattedEntitySnakeCase);
    const formattedEntityScreamingSnakeCasePlural = pluralize(
      formattedEntityScreamingSnakeCase,
    );

    return template
      .replace(/\{\{entity\}\}/g, formattedEntityCamelCase)
      .replace(/\{\{entities\}\}/g, formattedEntityCamelCasePlural)
      .replace(/\{\{Entity\}\}/g, formattedEntityPascalCase)
      .replace(/\{\{Entities\}\}/g, formattedEntityPascalCasePlural)
      .replace(/\{\{entity_\}\}/g, formattedEntitySnakeCase)
      .replace(/\{\{entities_\}\}/g, formattedEntitySnakeCasePlural)
      .replace(/\{\{ENTITY_\}\}/g, formattedEntityScreamingSnakeCase)
      .replace(/\{\{ENTITIES_\}\}/g, formattedEntityScreamingSnakeCasePlural)
      .replace(/\{\{entity-\}\}/g, formattedEntityKebabCase)
      .replace(/\{\{entities-\}\}/g, formattedEntityKebabCasePlural);
  }

  /** Injects types */
  private async injectTypes(templateName: string, separateTypes: boolean) {
    let importedTypesTemplateContent = '';
    const typesTemplate = await importTypesTemplate(templateName);
    if (this.validatorProcessor) {
      importedTypesTemplateContent = this.removeFirstNewline(
        typesTemplate ?? '',
      );
    }

    if (separateTypes) {
      // add types to separate new file
      this.rawTypesTemplate = importedTypesTemplateContent;
    } else {
      // add types to main output file
      this.rawTemplate = this.rawTemplate?.replace(
        /\{\{types\}\}/g,
        importedTypesTemplateContent,
      );
    }
  }

  /** Removes comments */
  private removeCommentsIfNeeded(
    text: string,
    options: ProcessingOptions,
  ): string {
    if (options.removeComments) {
      return text.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''); // Remove multi-line and inline comments
    }
    return text;
  }

  /** Removes leftover placeholders from the processed code */
  private removeLeftoverPlaceholders(text: string): string {
    return text.replace(/\{\{[^}]+\}\}/g, '');
  }

  /** Replaces leftover multiple commas */
  private normalizeCommas(text: string) {
    // First replace multiple comma patterns (with spaces before)
    let result = text.replace(/(?:\s*,)+/g, ',');

    // Then replace semicolon + spaces + comma with just semicolon
    result = result.replace(/;\s*,/g, ';');
    return result;
  }

  /** Remove multiple empty lines */
  private removeMultipleEmptyLines(text: string) {
    // reduce multiple empty lines to single empty line
    // this regex matches multiple empty lines and replaces them with a single empty line
    return text.replace(/^\s*$(?:\r\n?|\n)/gm, '\n');
  }

  /** Remove first character if it is a newline character*/
  private removeFirstNewline(text: string) {
    return text.replace(/^\n/, '');
  }

  /** Returns available templates */
  getAvailableTemplatesNames(): string[] {
    return Array.from(this.templates.keys());
  }

  /** Returns available validators */
  getAvailableValidatorsNames(): string[] {
    return Array.from(this.validators.keys());
  }

  /** Returns template metadata */
  getTemplateConfigs(name: string): TemplateConfig | undefined {
    const template = this.templates.get(name);
    if (!template) return undefined;

    return {
      name: template.name,
      description: template.description,
      version: template.version,
      author: template.author,
      tags: template.tags,
      validatorSupport: template.validatorSupport,
      filename: template.filename,
      placeholders: template.placeholders,
    };
  }

  /** Returns generated main file content */
  getMainFileContent(): string | undefined {
    return this.mainFileContent;
  }

  /** Returns generated types file content */
  getTypesFileContent(): string | undefined {
    return this.typesFileContent;
  }

  /** Processes a template with the given options */
  async processTemplate(
    templateName: string,
    options: ProcessingOptions,
  ): Promise<{ mainFileContent: string; typesFileContent?: string }> {
    // 1. Run pre-processing hooks
    await this.runHooks('pre-process', options);

    // 2. Get template and validator from private fields
    const templateConfigs = this.templates.get(templateName);
    if (!templateConfigs) {
      throw new Error(`Template "${templateName}" not found`);
    }

    this.rawTemplate = await this.loadTemplate(templateConfigs.filename);

    const selectedValidatorConfigs = this.validators.get(options.validatorType);
    if (selectedValidatorConfigs) {
      this.validatorProcessor = new ValidatorProcessor(
        selectedValidatorConfigs,
      );
    }

    // 3. Inject types
    await this.injectTypes(templateName, options.separateTypes);

    // 4. Inject validator-specific code
    if (this.validatorProcessor) {
      this.rawTemplate = this.validatorProcessor?.processValidator(
        this.rawTemplate,
        'main',
      );
      if (this.rawTypesTemplate) {
        this.rawTypesTemplate = this.validatorProcessor?.processValidator(
          this.rawTypesTemplate,
          'types',
        );
      }
      this.validatorProcessor.alertOrThrowForMissingPlaceholders();
    }

    // 5. Perform entity replacements
    this.rawTemplate = this.replaceDefaultEntityNamePlaceholders(
      this.rawTemplate,
      options.entity,
    );

    if (this.rawTypesTemplate) {
      this.rawTypesTemplate = this.replaceDefaultEntityNamePlaceholders(
        this.rawTypesTemplate,
        options.entity,
      );
    }

    // 6. Run post-processing hooks
    this.mainFileContent = await this.runHooks(
      'post-process',
      this.rawTemplate,
      options,
    );
    if (this.rawTypesTemplate) {
      this.typesFileContent = await this.runHooks(
        'post-process',
        this.rawTypesTemplate,
        options,
      );
    }
    return {
      mainFileContent: this.mainFileContent,
      typesFileContent: this.typesFileContent,
    };
  }
}
