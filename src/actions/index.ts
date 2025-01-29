export class InsertAction<A, O> {
  arguments: A;
  options: O;

  constructor(args: A, options: O) {
    this.arguments = args;
    this.options = options;
  }

  act() {
    console.log('action called');
  }
}
