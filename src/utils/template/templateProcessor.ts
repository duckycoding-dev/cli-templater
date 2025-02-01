import { z } from 'zod';
import pluralize from 'pluralize';
import { importTemplate } from './imports';
import {
  ValidatorProcessor,
  type ValidatorConfig,
} from '../validator/validatorProcessor';

const templatePlaceholderSchema = z.record(
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
    placeholders: z.array(templatePlaceholderSchema).default([]),
    files: z
      .array(
        z.object({
          defaultPath: z.string().min(1).optional(),
          outputName: z.string().min(1).optional(),
          templatePath: z.string().min(1),
        }),
      )
      .min(1),
    validatorSupport: z.array(z.string()).default(['none']),
  })
  .transform((data) => ({
    ...data,
    name: data.name ?? data.filename, // Set `name` to `filename` if not provided
  }));

export const ProcessingOptionsSchema = z.object({
  entity: z
    .string()
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'Invalid entity name. Must start with a letter and contain only letters, numbers and underscores',
    ),
  removeComments: z.boolean(),
  validatorType: z.string().optional(),
  customOptions: z.record(z.unknown()).optional(),
});

export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;
export type ProcessingOptions = z.infer<typeof ProcessingOptionsSchema>;

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

  constructor() {
    this.templates = new Map();
    this.validators = new Map();
    this.hooks = {
      'pre-process': [],
      'post-process': [],
    };

    // Register built-in processing hooks
    this.registerHook('pre-process', this.validateOptions);
    this.registerHook('post-process', this.formatCode);
    this.registerHook('post-process', this.removeLeftoverPlaceholders);
    this.registerHook('post-process', this.normalizeCommas);
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
  private async validateOptions(options: ProcessingOptions) {
    const parsed = ProcessingOptionsSchema.safeParse(options);
    if (parsed.error) {
      throw new Error(
        'Options are not valid: ' + parsed.error.errors.join(', '),
      );
    }
  }

  /** Replaces placeholders in the template string */
  private replacePlaceholders(
    template: string,
    options: ProcessingOptions,
  ): string {
    const formattedEntity = options.entity.toLowerCase();

    const entityCapitalized =
      formattedEntity.charAt(0).toUpperCase() + formattedEntity.slice(1);
    const entityPlural = pluralize(formattedEntity);

    return template
      .replace(/\{\{entity\}\}/g, formattedEntity)
      .replace(/\{\{Entity\}\}/g, entityCapitalized)
      .replace(/\{\{entities\}\}/g, entityPlural);
  }

  /** Injects validator-specific imports and validation code */
  private injectValidatorCode(
    template: string,
    validatorConfigs: ValidatorConfig,
  ): string {
    const validator = new ValidatorProcessor(validatorConfigs);
    return validator.processValidator(template);
  }

  /** Formats generated code (removes comments if required) */
  private formatCode(text: string, options: ProcessingOptions): string {
    if (options.removeComments) {
      return text.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''); // Remove multi-line and inline comments
      // .replace(/^\s*[\r\n]/gm, ''); // Remove empty lines
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
      files: template.files,
      placeholders: template.placeholders,
    };
  }

  /** Processes a template with the given options */
  async processTemplate(
    templateName: string,
    options: ProcessingOptions,
  ): Promise<string> {
    // 1. Run pre-processing hooks
    await this.runHooks('pre-process', options);

    // 2. Fetch template and validator
    const templateConfigs = this.templates.get(templateName);
    if (!templateConfigs) {
      throw new Error(`Template "${templateName}" not found`);
    }

    let rawTemplate = await this.loadTemplate(templateConfigs.filename);
    const validator =
      options.validatorType && options.validatorType !== 'none'
        ? this.validators.get(options.validatorType)
        : undefined;

    // 3. Inject validator-specific code
    if (validator) {
      rawTemplate = this.injectValidatorCode(rawTemplate, validator);
    }

    // 4. Perform entity replacements
    let processedCode = this.replacePlaceholders(rawTemplate, options);

    // 5. Run post-processing hooks
    processedCode = await this.runHooks('post-process', processedCode, options);

    return processedCode;
  }
}

// need to improve the pluralization of entities with underlines
// - need to consider the case where they are used as URL paths: here they must keep the underscores
// - need to consider the case where they are used as class names: here they must be transformed to camel/pascal case and have no underscores

// need to improve the replacement logic for placeholders for validation
