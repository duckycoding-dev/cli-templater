import ansis from 'ansis';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the director

export function showTemplatesDirAction() {
  const TEMPLATES_DIR = path.join(`${__dirname}`, `./../../templates`);
  console.log(
    '📂 You can find all existing templates here: ' +
      ansis.cyanBright(TEMPLATES_DIR),
  );
}
