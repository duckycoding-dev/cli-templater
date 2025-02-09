import fs from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = dirname(__filename); // get the name of the director

function copyDirToDist(dirToCopy: string) {
  const startDir = resolve(__dirname, '..', dirToCopy);
  const outputDir = resolve(__dirname, '..', '..', 'dist', dirToCopy);

  fs.cpSync(startDir, outputDir, { recursive: true });
}

if (!process.argv[2])
  throw new Error('Argument for starting directory required');
copyDirToDist(process.argv[2]);
