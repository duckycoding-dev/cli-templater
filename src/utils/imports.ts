import {
  TemplateConfigSchema,
  type TemplateConfig,
} from '../processors/TemplateProcessor.js';
import ansis from 'ansis';
import {
  validatorConfigSchema,
  type ValidatorConfig,
} from '../processors/ValidatorProcessor.js';

export async function importTemplate(templateName: string): Promise<string> {
  const { default: template } = await import(
    `../templates/${templateName}/${templateName}`
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
    `../templates/${templateName}/${templateName}.config.json`
  );
  const parsed = TemplateConfigSchema.safeParse(templateConfigsFromJson);
  if (parsed.error) {
    throw new Error(
      `Template configuration is invalid\n${parsed.error.errors
        .map((e, index) => {
          const errorMessage = `${index + 1}- ${e.message}`;
          return index % 2 === 0
            ? ansis.blueBright(errorMessage)
            : errorMessage;
        })
        .join('\n')}`,
    );
  }

  return parsed.data;
}

export async function importValidatorConfigs(
  templateName: string,
  validatorName: 'default' | (string & {}),
): Promise<ValidatorConfig> {
  const { default: validatorConfigsFromJson } = await import(
    `../templates/${templateName}/validators/${validatorName}.config.json`
  );
  const parsed = validatorConfigSchema.safeParse(validatorConfigsFromJson);
  if (parsed.error) {
    throw new Error(
      `Validator configuration is invalid:\n${parsed.error.errors
        .map((e, index) => {
          const errorMessage = `${index + 1}- ${e.message}`;
          return index % 2 === 0
            ? ansis.blueBright(errorMessage)
            : errorMessage;
        })
        .join('\n')}`,
    );
  }

  return parsed.data;
}

export async function importTypesTemplate(
  templateName: string,
): Promise<string> {
  const { default: typesTemplate } = await import(
    `../templates/${templateName}/${templateName}.types`
  );

  if (typeof typesTemplate !== 'string') {
    throw new Error('Default export from template file must be a string');
  }

  return typesTemplate;
}
