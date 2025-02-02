import path from 'path';
import fs from 'fs';
import type { SystemError } from 'bun';

export const writeFileWithIncrementalName = (
  filename: string,
  fileContent: string,
  shouldIncrementFilenameIfAlreadyExistsInsteadOfThrowing = false,
  increment = 0,
): string => {
  const name = path.join(
    path.dirname(filename),
    `${path.basename(filename, path.extname(filename))}${increment ? `_${increment}` : ''}${path.extname(filename)}`,
  );

  try {
    // the flag "wx" means: Open file for writing. The file is created (if it does not exist) or the operation fails (if it exists)
    fs.writeFileSync(name, fileContent, { encoding: 'utf-8', flag: 'wx' });
    return name;
  } catch (err) {
    if (
      shouldIncrementFilenameIfAlreadyExistsInsteadOfThrowing &&
      (err as SystemError).code === 'EEXIST'
    ) {
      return writeFileWithIncrementalName(
        filename,
        fileContent,
        shouldIncrementFilenameIfAlreadyExistsInsteadOfThrowing,
        (increment += 1),
      );
    } else {
      throw err;
    }
  }
};
