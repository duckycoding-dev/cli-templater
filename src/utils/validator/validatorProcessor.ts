import { z } from 'zod';

const validatorPlaceholderDataSchema = z.object({
  description: z.string().optional(),
  value: z.string().optional().or(z.array(z.string())),
  required: z.boolean().default(false),
});

export const ValidatorConfigSchema = z.object({
  name: z.string(),
  description: z.string(),
  author: z.string(),
  placeholders: z.record(
    z.string().regex(/^[a-zA-Z0-9_]+$/), // Placeholder name must be alphanumeric with underscores,
    validatorPlaceholderDataSchema,
  ),
  dependencies: z.record(z.string(), z.string()),
});
export type ValidatorConfig = z.infer<typeof ValidatorConfigSchema>;

export class ValidatorProcessor {
  private validatorConfigs: ValidatorConfig;

  constructor(configs: ValidatorConfig) {
    this.validatorConfigs = configs;
  }

  /** Ensures valid options before processing */
  private async validateValidatorConfigs() {
    const parsed = ValidatorConfigSchema.safeParse(this.validatorConfigs);
    if (parsed.error) {
      throw new Error(
        `${this.validatorConfigs.name ? `${this.validatorConfigs.name} validator` : 'Validator'} configs are not valid: ` +
          parsed.error.errors.join(', '),
      );
    }
  }

  private checkPlaceholdersExistInTemplate(template: string) {
    const missingRequiredPlaceholders: string[] = [];
    const missingOptionalPlaceholders: string[] = [];
    for (const placeholder of Object.keys(this.validatorConfigs.placeholders)) {
      if (!template.includes(`{{${placeholder}}}`)) {
        if (this.validatorConfigs.placeholders[placeholder].required) {
          missingRequiredPlaceholders.push(placeholder);
        } else {
          missingOptionalPlaceholders.push(placeholder);
        }
      }
    }

    for (const placeholder of missingOptionalPlaceholders) {
      console.warn(
        `⚠️ Validator's placeholder {{${placeholder}}} missing but not required...`,
      );
    }

    let requiredPlaceholdersMessage = '';
    for (const placeholder of missingRequiredPlaceholders) {
      requiredPlaceholdersMessage += `🚨 Validator's placeholder {{${placeholder}}}, marked as required, was not found in template\n`;
    }
    if (missingRequiredPlaceholders.length > 0) {
      throw new Error(requiredPlaceholdersMessage);
    }
  }

  /** Processes the given validator configs */
  processValidator(template: string) {
    this.validateValidatorConfigs();
    this.checkPlaceholdersExistInTemplate(template);

    // Process the validator configs
    console.log(`Processing ${this.validatorConfigs.name} validator...`);

    // Replace the placeholders in the template
    let processedTemplate = template;
    if (this.validatorConfigs.placeholders) {
      console.log(
        `Replacing ${this.validatorConfigs.name} validator placeholders...`,
      );
    }
    for (const [placeholderName, placeholderData] of Object.entries(
      this.validatorConfigs.placeholders,
    )) {
      let formattedDataAsString = placeholderData.value ?? '';
      if (Array.isArray(formattedDataAsString)) {
        // If the placeholder data is an array, join it with newlines
        formattedDataAsString = formattedDataAsString.join('\n');
      }
      processedTemplate = processedTemplate.replace(
        new RegExp(`{{${placeholderName}}}`, 'g'),
        formattedDataAsString,
      );
    }

    return processedTemplate;
  }
}
