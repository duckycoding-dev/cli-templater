import { ValidatorConfig } from '../../utils/validator/validatorProcessor';

/**
 * @type ValidatorConfig
 * @property dependencies: this object is just for reference for now
 * @property devDependencies: this object is just for reference for now
 * @internal
 */
const validatorConfig = {
  name: '',
  description: '',
  author: '',
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
