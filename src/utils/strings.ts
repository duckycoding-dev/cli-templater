export function removeExtraSpaces(text: string) {
  return text.trim().replace(/(?:\s*\s)+/g, '_');
}

export function containsOnlyLettersNumbersAndUnderscores(text: string) {
  return /^[a-zA-Z0-9_]+([a-zA-Z0-9_]+)*$/.test(text);
}

export function containsOnlyLettersNumbersSpacesAndUnderscores(text: string) {
  return /^[a-zA-Z0-9_]+( [a-zA-Z0-9_]+)*$/.test(text);
}

export function containsOnlyLettersNumbersUnderscoresAndDashes(text: string) {
  return /^[a-zA-Z0-9_-]+([a-zA-Z0-9_-]+)*$/.test(text);
}

export function startsWithNumber(text: string) {
  return /^[0-9]/.test(text);
}

export function isValidDirectory(value = '') {
  let replacedString = value.toString().replace(/\\/g, '/');
  if (
    replacedString.charAt(0) === '/' &&
    replacedString.charAt(0) === '.' &&
    replacedString.charAt(0) === '~'
  ) {
    replacedString = `./${replacedString}`;
  }

  console.log(replacedString);
  return new RegExp('^/|(/[\\w-]+)+$').test(replacedString);
}

/** Replaces leftover multiple commas */
export function normalizeCommas(text: string) {
  // First replace multiple comma patterns (with spaces before)
  let result = text.replace(/(?:\s*,)+/g, ',');

  // Then replace semicolon + spaces + comma with just semicolon
  result = result.replace(/;\s*,/g, ';');
  return result;
}

/** Remove multiple empty lines */
export function removeMultipleEmptyLines(text: string) {
  // reduce multiple empty lines to single empty line
  // this regex matches multiple empty lines and replaces them with a single empty line
  return text.replace(/^\s*$(?:\r\n?|\n)/gm, '\n');
}

/** Remove first character if it is a newline character*/
export function removeFirstNewline(text: string) {
  return text.replace(/^\n/, '');
}
