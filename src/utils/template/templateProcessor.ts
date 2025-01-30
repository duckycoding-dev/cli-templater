import { z } from 'zod';
import pluralize from 'pluralize';
import { importTemplate } from './imports';

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
  private registerHook<T extends HookType>(
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
