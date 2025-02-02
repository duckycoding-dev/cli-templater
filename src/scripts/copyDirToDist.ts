import fs from 'fs';
import { resolve } from 'path';

function copyDirToDist(dirToCopy: string) {
  const startDir = resolve(__dirname, '..', dirToCopy);
  const outputDir = resolve(__dirname, '..', '..', 'dist', dirToCopy);

  fs.cpSync(startDir, outputDir, { recursive: true });
}

if (!process.argv[2])
  throw new Error('Argument for starting directory required');
copyDirToDist(process.argv[2]);
