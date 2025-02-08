const validatorConfig = {
  name: '',
  description: '',
  placeholders: {
    stringThatWillBeReplaced: {
      value: [''],
      description: '',
      required: false,
    },
    anotherStringThatWillBeReplaced: {
      value: [''],
      description: '',
      required: false,
    },
  },
  dependencies: {
    PACKAGEJSON_DEP: 'SEMVER_VERSION',
  },
  devDepencencies: {
    PACKAGEJSON_DEV_DEP: 'SEMVER_VERSION',
  },
};

export default validatorConfig;
