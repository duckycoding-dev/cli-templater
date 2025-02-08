import ansis from 'ansis';
import path from 'path';

export function showTemplatesDirAction() {
  const TEMPLATES_DIR = path.join(`${__dirname}`, `./../../templates`);
  console.log(
    '📂 You can find all existing templates here: ' +
      ansis.cyanBright(TEMPLATES_DIR),
  );
}
