function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
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
