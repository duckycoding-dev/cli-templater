import { z } from 'zod';
import pluralize from 'pluralize';
import { importTemplate } from './imports';

// import type { ProcessingHook } from './types';

export const ValidatorConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  author: z.string(),
  imports: z.array(z.string()),
  validationCode: z.string(),
  dependencies: z.record(z.string(), z.string()),
});

export const TemplateConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  version: z.string(),
  author: z.string(),
  tags: z.array(z.string()),
  validatorSupport: z.array(z.string()),
  filename: z.string(),
});

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

export type ValidatorConfig = z.infer<typeof ValidatorConfigSchema>;
export type TemplateConfig = z.infer<typeof TemplateConfigSchema>;
export type ProcessingOptions = z.infer<typeof ProcessingOptionsSchema>;

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type ProcessingHook = Function;

export class TemplateProcessor {
  private templates: Map<string, TemplateConfig>;
  private validators: Map<string, ValidatorConfig>;
  private hooks: Map<string, ProcessingHook[]>;

  constructor() {
    this.templates = new Map();
    this.validators = new Map();
    this.hooks = new Map();

    // Register built-in processing hooks
    this.registerHook('pre-process', this.validateOptions);
    this.registerHook('post-process', this.formatCode);
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

  /** Processes a template with the given options */
  async processTemplate(
    templateName: string,
    options: ProcessingOptions,
  ): Promise<string> {
    // 1. Run pre-processing hooks
    // await this.runHooks('pre-process', options);

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

  /** Registers a processing hook */
  private registerHook(phase: string, hook: ProcessingHook) {
    const hooks = this.hooks.get(phase) || [];
    hooks.push(hook);
    this.hooks.set(phase, hooks);
  }

  /** Runs all hooks for a given phase */
  private async runHooks<T>(
    phase: string,
    input: T,
    options?: ProcessingOptions,
  ) {
    const hooks = this.hooks.get(phase) || [];
    for (const hook of hooks) {
      input = await hook(input, options);
    }
    return input;
  }

  /** Ensures valid options before processing */
  private async validateOptions(options: ProcessingOptions) {
    const parsed = ProcessingOptionsSchema.safeParse(options);
    if (parsed.error) {
      throw new Error(
        'Options are not valid; ' + parsed.error.errors.join(', '),
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
    validator: ValidatorConfig,
  ): string {
    return template
      .replace(`import { z } from 'zod';`, validator.imports?.join('\n') || '')
      .replace(
        `zValidator('json', create{{Entity}}Schema)`,
        validator.validationCode || '',
      );
  }

  /** Formats generated code (removes comments if required) */
  private async formatCode(
    text: string,
    options: ProcessingOptions,
  ): Promise<string> {
    if (options.removeComments) {
      return text.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, ''); // Remove multi-line and inline comments
      // .replace(/^\s*[\r\n]/gm, ''); // Remove empty lines
    }
    return text;
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
    };
  }
}

// need to improve the pluralization of entities with underlines
// - need to consider the case where they are used as URL paths: here they must keep the underscores
// - need to consider the case where they are used as class names: here they must be transformed to camel/pascal case and have no underscores

// need to improve the replacement logic for placeholders for validation
