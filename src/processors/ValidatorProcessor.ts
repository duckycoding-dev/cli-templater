import { z } from 'zod';
import ansis from 'ansis';

const validatorPlaceholderDataSchema = z.object({
  description: z.string().optional(),
  value: z.string().or(z.array(z.string())).optional(),
  required: z.boolean().default(false),
});

export const validatorConfigSchema = z.object({
  name: z.string().min(1, { message: 'Validator name is required' }).optional(),
  description: z
    .string()
    .min(1, { message: 'Validator description is required' })
    .optional(),
  placeholders: z
    .record(
      z.string().regex(/^[a-zA-Z0-9_-]+$/), // Placeholder name must be alphanumeric with underscores,
      validatorPlaceholderDataSchema,
    )
    .optional()
    .default({}),
  dependencies: z.record(z.string(), z.string()).optional(),
  devDependencies: z.record(z.string(), z.string()).optional(),
});
export type ValidatorConfig = z.infer<typeof validatorConfigSchema>;
export type ValidatorPlaceholderDataSchema = z.infer<
  typeof validatorPlaceholderDataSchema
>;

export class ValidatorProcessor {
  private validatorConfigs: ValidatorConfig;
  private notFoundPlaceholders: Map<string, boolean>;

  constructor(configs: ValidatorConfig) {
    ValidatorProcessor.validateValidatorConfigs(configs);
    this.validatorConfigs = configs;
    this.notFoundPlaceholders = new Map(
      Object.entries(configs.placeholders).map(
        ([placeholderName, placeholderData]) => [
          placeholderName,
          placeholderData.required ?? false,
        ],
      ),
    );
  }

  /** Ensures valid options before processing */
  private static async validateValidatorConfigs(
    validatorConfigs: ValidatorConfig,
  ) {
    const parsed = validatorConfigSchema.safeParse(validatorConfigs);
    if (parsed.error) {
      throw new Error(
        `${validatorConfigs.name ? `${validatorConfigs.name} validator` : 'Validator'} configs are not valid:\n${parsed.error.errors
          .map((e, index) => {
            const errorMessage = `${index + 1}- ${e.message}`;
            return index % 2 === 0
              ? ansis.blueBright(errorMessage)
              : errorMessage;
          })
          .join('\n')}`,
      );
    }
  }

  private checkPlaceholdersExistInTemplate(template: string) {
    for (const placeholder of Object.keys(this.validatorConfigs.placeholders)) {
      if (template.includes(`{{${placeholder}}}`)) {
        this.notFoundPlaceholders.delete(placeholder);
      }
    }
  }

  alertOrThrowForMissingPlaceholders() {
    if (this.notFoundPlaceholders.size === 0) return;

    console.log(
      "🔎 These are all the placeholders that were listed in the validator's config file but not found in the template:",
    );
    let requiredPlaceholdersMessage = '';
    for (const [placeholder, required] of this.notFoundPlaceholders) {
      if (required) {
        requiredPlaceholdersMessage += `🚨 Validator's placeholder {{${placeholder}}}, marked as required, was not found in template\n`;
      } else {
        console.warn(
          `⚠️ Validator's placeholder {{${placeholder}}} missing but not required...`,
        );
      }
    }
    if (requiredPlaceholdersMessage.length > 0) {
      throw new Error(requiredPlaceholdersMessage);
    }
  }

  /** Processes the given validator configs */
  processValidator(rawTemplate: string) {
    this.checkPlaceholdersExistInTemplate(rawTemplate);

    // Process the validator configs
    // Replace the placeholders in the template
    // if first character is a newline, remove it
    let processedTemplate = rawTemplate.replace(/^\n/, '');
    for (const [placeholderName, placeholderData] of Object.entries(
      this.validatorConfigs.placeholders,
    )) {
      let formattedData = placeholderData.value ?? '';
      if (Array.isArray(formattedData)) {
        // If the placeholder data is an array, join it with newlines
        formattedData = formattedData.join('\n');
      }
      processedTemplate = processedTemplate.replace(
        new RegExp(`{{${placeholderName}}}`, 'g'),
        formattedData,
      );
    }

    return processedTemplate;
  }
}
