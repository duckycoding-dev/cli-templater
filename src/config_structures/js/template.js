const templateConfig = {
  name: 'HUMAN_READABLE_NAME_MORE_INFORMATIVE_THAN_THE_FILENAME',
  description: '',
  validatorSupport: [''],
  filename: 'NAME_OF_THE_GENERATED_TEMPLATE_FILE',
  outputExtension: 'js',
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
  dependencies: {
    PACKAGEJSON_DEP: 'SEMVER_VERSION',
  },
  devDepencencies: {
    PACKAGEJSON_DEV_DEP: 'SEMVER_VERSION',
  },
};

export default templateConfig;
