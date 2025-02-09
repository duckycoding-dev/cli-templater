import ansis from 'ansis';
import {
  containsOnlyLettersNumbersSpacesAndUnderscores,
  removeExtraSpaces,
  startsWithNumber,
} from './strings.js';

export function validateEntityNameInput(text: string, shouldThrow = false) {
  text = text.trim();
  if (text === '') {
    const msg = `Entity name cannot be empty. Your input: ${ansis.yellowBright(text)}`;
    if (shouldThrow) throw new Error(msg);
    return msg;
  }
  if (startsWithNumber(text)) {
    const msg = `Entity name must not start with a number. Your input: ${ansis.yellowBright(text)}`;
    if (shouldThrow) throw new Error(msg);
    return msg;
  }
  if (!containsOnlyLettersNumbersSpacesAndUnderscores(text)) {
    const msg = `Entity name must only contain letters, numbers, spaces and underscores. Your input: ${ansis.yellowBright(text)}`;
    if (shouldThrow) throw new Error(msg);
    return msg;
  }
  return true;
}

export function formatEntityName(text: string, validate = true) {
  if (validate) validateEntityNameInput(text, true);
  return removeExtraSpaces(text);
}
