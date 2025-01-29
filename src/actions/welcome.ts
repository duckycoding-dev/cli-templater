import figlet from 'figlet';
import ansis from 'ansis';

export function welcome(version: string) {
  console.log(
    ansis.magentaBright(
      figlet.textSync('CLI Templater', {
        horizontalLayout: 'default',
        verticalLayout: 'default',
        printDirection: 0, // 0 for left-to-right, 1 for right-to-left
        showHardBlanks: false,
        whitespaceBreak: true,
        font: 'Standard',
      }),
    ),
  );
  console.log(ansis.cyanBright(figlet.textSync(`version ${version}`)));
  console.log(
    ansis.bgCyanBright(
      figlet.textSync(`Developed by: `, {
        font: 'Term',
      }),
    ),
    ansis.cyanBright(
      figlet.textSync(`@duckycoding-dev`, {
        font: 'Term',
      }),
    ),
  );

  console.log(
    ansis.bgMagentaBright(
      figlet.textSync(`Check the repo at: `, {
        font: 'Term',
      }),
    ),
    ansis.magentaBright(
      figlet.textSync(`https://github.com/duckycoding-dev/cli-templater`, {
        font: 'Term',
      }),
    ),
  );

  console.log('');
}
