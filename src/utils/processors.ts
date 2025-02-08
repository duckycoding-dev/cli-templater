import type { TemplateConfig } from '../processors/TemplateProcessor';
import type { ValidatorConfig } from '../processors/ValidatorProcessor';

export function thereIsAtLeastOneDependency<
  T extends ValidatorConfig | TemplateConfig,
>(map: Map<string, T>) {
  for (const value of map.values()) {
    if (
      Object.keys(value.dependencies ?? {}).length > 0 ||
      Object.keys(value.devDependencies ?? {}).length > 0
    ) {
      return true;
    }
  }
  return false;
}
