import {
  TemplateConfigSchema,
  type TemplateConfig,
} from './template/templateProcessor';

import {
  ValidatorConfigSchema,
  type ValidatorConfig,
} from './validator/validatorProcessor';

export async function importTemplate(templateName: string): Promise<string> {
  const { default: template } = await import(
    `@/templates/${templateName}/${templateName}`
  );
  if (typeof template !== 'string') {
    throw new Error('Default export from template file must be a string');
  }

  return template;
}

export async function importTemplateConfigs(
  templateName: string,
): Promise<TemplateConfig> {
  const { default: templateConfigsFromJson } = await import(
    `@/templates/${templateName}/${templateName}.config.json`
  );
  const parsed = TemplateConfigSchema.safeParse(templateConfigsFromJson);
  if (parsed.error) {
    throw new Error('Template configuration is invalid');
  }

  return parsed.data;
}

export async function importValidatorConfigs(
  templateName: string,
  validatorName: string,
): Promise<ValidatorConfig> {
  const { default: validatorConfigsFromJson } = await import(
    `@/templates/${templateName}/validators/${validatorName}.config.json`
  );
  const parsed = ValidatorConfigSchema.safeParse(validatorConfigsFromJson);
  if (parsed.error) {
    throw new Error('Validator configuration is invalid');
  }

  return parsed.data;
}
