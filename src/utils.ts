import pluralize from 'pluralize';

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function generateFromTemplate(
  template: string,
  entityName: string,
  keepComments: boolean,
): string {
  // Helper functions for capitalization and pluralization

  // Replace placeholders with the appropriate values
  let result = template
    .replace(/{{entity}}/g, entityName.toLowerCase())
    .replace(/{{Entity}}/g, capitalize(entityName))
    .replace(/{{entities}}/g, pluralize(entityName.toLowerCase()))
    .replace(/{{Entities}}/g, capitalize(pluralize(entityName)));

  // Optionally remove comments
  if (!keepComments) {
    result = removeComments(result);
  }
  // Optionally use Zod for validation
  result = removeZodValidation(result);

  console.log(result);
  return result;
}

export function fromSnakeCaseToCamelCase(
  name: string,
  toPascalCase = false,
): string {
  const camelCaseName = name
    .split('_')
    .map((word, index) =>
      index === 0 && !toPascalCase ? word : capitalize(word),
    )
    .join('');

  return camelCaseName;
}

function removeComments(content: string) {
  console.log('Removing comments...');
  // single line comments
  content = content.replace(/\/\/.*$/gm, '');
  // multi line comments
  content = content.replace(/\/\*[\s\S]*?\*\//g, '');
  return content;
}

function removeZodValidation(content: string) {
  console.log('Removing Zod validation...');
  content = content.replace(/z\.object\({[^}]*}\);/g, '');
  content = content.replace(/z\.infer<[^>]*>/g, 'any');
  return content;
}
