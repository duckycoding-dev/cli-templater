export function removeExtraSpaces(text: string) {
  return text.trim().replace(/(?:\s*\s)+/g, '_');
}

export function containsOnlyLettersNumbersSpacesAndUnderscores(text: string) {
  return /^[a-zA-Z0-9_]+( [a-zA-Z0-9_]+)*$/.test(text);
}

export function startsWithNumber(text: string) {
  return /^[0-9]/.test(text);
}
