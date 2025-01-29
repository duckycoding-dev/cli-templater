// import type { ProcessingHook } from './types';

type ValidatorConfig = {
  name: string;
  description: string;
  author: string;
  imports: string[];
  validationCode: string;
  dependencies: Record<string, string>;
};

type TemplateDefinition = {
  name: string;
  description: string;
  version: string;
  author: string;
  tags: string[];
  validatorSupport: string[];
  filename: string;
};

type ProcessingOptions = {
  entity: string;
  removeComments: boolean;
  validatorType?: string;
  customOptions?: Record<string, unknown>;
};

export class TemplateProcessor {
  private templates: Map<string, TemplateDefinition>;
  private validators: Map<string, ValidatorConfig>;
  // private hooks: Map<string, ProcessingHook[]>;

  constructor() {
    this.templates = new Map();
    this.validators = new Map();
    // this.hooks = new Map();

    // Register built-in processing hooks
    // this.registerHook('pre-process', this.validateOptions);
    // this.registerHook('post-process', this.formatCode);
  }

  /** Registers a new template */
  registerTemplate(name: string, template: TemplateDefinition) {
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
  private async loadTemplate(template: TemplateDefinition): Promise<string> {
    const file = await import(
      `@/templates/${template.filename.toLowerCase()}/${template.filename.toLowerCase()}`
    );

    return file.default;
  }

  /** Processes a template with the given options */
  async processTemplate(
    templateName: string,
    options: ProcessingOptions,
  ): Promise<string> {
    // 1. Run pre-processing hooks
    // await this.runHooks('pre-process', options);

    // 2. Fetch template and validator
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }

    let rawTemplate = await this.loadTemplate(template);
    const validator = options.validatorType
      ? this.validators.get(options.validatorType)
      : undefined;

    // 3. Inject validator-specific code
    if (validator) {
      rawTemplate = this.injectValidatorCode(rawTemplate, validator);
    }

    // 4. Perform entity replacements
    const processedCode = this.replacePlaceholders(rawTemplate, options);

    // 5. Run post-processing hooks
    // processedCode = await this.runHooks('post-process', processedCode, options);

    return processedCode;
  }

  /** Runs all hooks for a given phase */
  // private async runHooks(phase: string, input: any, options?: ProcessingOptions) {
  //   const hooks = this.hooks.get(phase) || [];
  //   for (const hook of hooks) {
  //     input = await hook(input, options);
  //   }
  //   return input;
  // }

  /** Ensures valid options before processing */
  private async validateOptions(options: ProcessingOptions) {
    if (!options.entity) {
      throw new Error('Entity name is required');
    }
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(options.entity)) {
      throw new Error(
        'Invalid entity name. Must start with a letter and contain only letters and numbers',
      );
    }
  }

  /** Replaces placeholders in the template string */
  private replacePlaceholders(
    template: string,
    options: ProcessingOptions,
  ): string {
    const entityCapitalized =
      options.entity.charAt(0).toUpperCase() + options.entity.slice(1);
    const entityPlural = `${options.entity}s`; // Basic pluralization

    return template
      .replace(/\{\{entity\}\}/g, options.entity)
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
    code: string,
    options: ProcessingOptions,
  ): Promise<string> {
    if (options.removeComments) {
      return code
        .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // Remove multi-line and inline comments
        .replace(/^\s*[\r\n]/gm, ''); // Remove empty lines
    }
    return code;
  }

  /** Returns available templates */
  getAvailableTemplates(): string[] {
    return Array.from(this.templates.keys());
  }

  /** Returns available validators */
  getAvailableValidators(): string[] {
    return Array.from(this.validators.keys());
  }

  /** Returns template metadata */
  getTemplateInfo(name: string) {
    const template = this.templates.get(name);
    if (!template) return null;

    return {
      name: template.name,
      description: template.description,
      version: template.version,
      author: template.author,
      tags: template.tags,
      validatorSupport: template.validatorSupport,
    };
  }
}
