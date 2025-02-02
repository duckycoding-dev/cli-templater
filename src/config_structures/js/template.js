import { TemplateConfig } from '../../utils/template/templateProcessor';

/**
 * @property validatorSupport - This array will always contain a value "none" by default
 * @type TemplateConfig
 * @internal
 */
const templateConfig = {
  name: 'HUMAN_READABLE_NAME_MORE_INFORMATIVE_THAN_THE_FILENAME',
  description: '',
  version: '',
  author: '',
  tags: [''],
  validatorSupport: [''],
  filename: 'NAME_OF_THE_GENERATED_TEMPLATE_FILE',
  placeholders: [
    {
      entity: {
        description: 'The entity name',
        required: true,
      },
    },
    {
      Entity: {
        description: 'The entity name PascalCase',
        required: true,
      },
    },
    {
      optionalPlaceholder: {
        description:
          'Example of a placeholder that is not required - could be marked as required later',
        required: false,
      },
    },
  ],
};

export default templateConfig;
