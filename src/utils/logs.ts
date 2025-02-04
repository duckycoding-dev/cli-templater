import ansis from 'ansis';

export function printWithHeadings(
  data:
    | { title: string; content: string }
    | { title: string; content: string }[],
) {
  if (Array.isArray(data)) {
    let colorText: Function;
    data.forEach(({ title, content }, index) => {
      if (index % 2 === 0) {
        colorText = ansis.cyanBright;
      } else {
        colorText = ansis.magentaBright;
      }
      console.log(
        ansis.greenBright('================================================='),
      );
      console.log(
        ansis.greenBright(
          `================${title.toUpperCase()}================`,
        ),
      );
      console.log(
        ansis.greenBright('================================================='),
      );
      console.log('');
      console.log(colorText(content));
    });
  } else {
    console.log(
      ansis.greenBright('================================================='),
    );
    console.log(
      ansis.greenBright(
        `================${data.title.toUpperCase()}================`,
      ),
    );
    console.log(
      ansis.greenBright('================================================='),
    );
    console.log('');
    console.log(ansis.cyanBright(data.content));
  }
}
