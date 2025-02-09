# CLI Templater Documentation

## Overview

The CLI Templater is an interactive command-line tool designed to help you set up repetitive files with a common structure. It allows you to generate boilerplate code by choosing from existing templates and customize the generated files based on your needs.

## Installation

To install the CLI Templater, you need to have [Bun](https://bun.sh/) installed. Once you have Bun, you can install the dependencies and build the project:

```sh
bun install
bun run build
```

Running the build command will link the built code globally: this way you should be able to start the tool by typing `cli-templater` directly in the terminal; else you can run it from this package with `bun run start` (which calls `bun .dist/index.js`).\
I recommend using `cli-templater` for easier placement of the generate files, whose paths will be relative to the current working directory.

## Usage

The CLI Templater provides three main commands: `generate`, `add-template` and `show-dir`.

### Generate Command

The `generate` command allows you to generate boilerplate code using an existing template. You can customize the generated files by providing various options.

#### Command Syntax

```sh
cli-templater generate [options]
```

#### Options

- `-e, --entity <ENTITY NAME>`: Set the default entity name to use.
- `-t, --template <TEMPLATE NAME>`: Set the default template to use.
- `-v, --validator <VALIDATOR NAME>`: Set the default validator to use.
- `--kc, --keep_comments`: Keep comments in generated files.
- `--st, --separate_types`: Place types in a separate file.
- `--mkdir, --make_dirs`: Make directories if they do not exist yet.
- `--edir, --entityDir <ENTITY DIRECTORY>`: Set where the main file will be generated.
- `--tdir, --typesDir <TYPES DIRECTORY>`: Set where the types file will be generated.
- `-p, --print`: Print the generated content to the console as well.
- `-o, --overwrite`: Overwrite existing files without asking for confirmation.
- `-a, --append`: Append to existing files without asking for confirmation.

#### Example

```sh
cli-templater generate -e User -t hono -v zod --kc --st --mkdir --edir ./src/entities --tdir ./src/types -p
```

### Add Template Command

The `add-template` command allows you to create a new template that can then be used with the `generate` command.\
A default validator configuration will always be generated, copied for every specified custom validator during the command walkthrough.\
By using all the available options you can completely automate the generation process, thus you can include the command in any of your scripts if required: use this carefully, as some options will let you overwrite existing files without any extra confirmation.\
When in doubt, only provide safe options and generate the files by using the CLI interactive process.

#### Command Syntax

```sh
cli-templater add-template [options]
```

#### Options

- `-n, --name <TEMPLATE NAME>`: Set the name of the template to create.
- `-f, --filename <FILENAME>`: Set the filename of the template to create.
- `-d, --description <DESCRIPTION>`: Set the description of the template to create.
- `-o, --output-extension <OUTPUT EXTENSION>`: Set the output extension of the template to create.
- `-t, --types-file-output-extension <TYPES FILE OUTPUT EXTENSION>`: Set the types file output extension of the template to create.

#### Example

```sh
cli-templater add-template -n "My Template" -f my-template -d "A custom template" -o ts -t d.ts
```

When the `add-template` command is executed, a default validator config file called `default.config.json` is created in the `validators` directory. This file contains all the placeholders indicated by the user.

### Show-dir Command

The `show-dir` command displays the absolute path to the location of the available / added templates in the filesystem.\
You will mostly use this after adding a new template, to go to the template and config files in order to populate them before being able to use them (or later to edit them to your likings).\
This command does not accept any options.

#### Command Syntax

```sh
cli-templater show-dir
```

#### Example

```sh
cli-templater show-dir

Output > 📂 You can find all existing templates here: /home/duckycoding/repos/cli-templater/dist/templates'
```

## Template Structure

Templates are stored in the templates directory. Each template consists of the following files:

- `<templateName>.config.json`: Configuration file for the template.
- `<templateName>.js`: The main template file.
- `<templateName>.types.js` (optional): The types template file (which get's generated only if a types file extension is provided).
- `validators/<validatorName>.config.json` (optional): Configuration file for the validator - a `validtors/default.config.json` file is always created.

### Template configuration File

The template configuration file defines the template's metadata, placeholders, and dependencies. Here is an example configuration file:

```json
{
  "name": "Hono REST API",
  "description": "A REST API template using Hono framework with validation support",
  "validatorSupport": ["zod", "typebox"],
  "filename": "hono",
  "outputExtension": "ts",
  "typesFileOutputExtension": "ts",
  "placeholders": [
    {
      "entity": {
        "description": "The entity name",
        "required": true
      }
    },
    {
      "Entity": {
        "description": "The entity name PascalCase",
        "required": true
      }
    },
    {
      "entities": {
        "description": "The entity name as plural",
        "required": true
      }
    },
    {
      "types": {
        "description": "Defines where types will be placed if they are not defined in a separate file",
        "required": true
      }
    }
  ],
  "dependencies": {
    "hono": "^4.6.19"
  },
  "devDependencies": {}
}
```

The file should respect the following type definition, which will be parsed at runtime using `Zod`

```ts
type TemplateConfig = {
  name: string;
  filename: string;
  outputExtension: string;
  placeholders: Record<
    string,
    {
      required: boolean;
      description?: string | undefined;
    }
  >;
  validatorSupport: string[];
  typesFileOutputExtension?: string | undefined;
  description?: string | undefined;
  dependencies?: Record<string, string> | undefined;
  devDependencies?: Record<string, string> | undefined;
};
```

### Validator Configuration File

Validator configuration files are optional and stored in the `validators` directory. They define the metadata and rules for the validators used in the templates. Here is an example validator configuration file:

```json
{
  "name": "Zod Validator",
  "description": "A validator configuration using Zod",
  "placeholders": {
    "validationParams": {
      "description": "The validation middlweware for parameters",
      "value": "zValidator('param', {{entity}}Schema.pick({ id: true }))"
    },
    "schema": {
      "description": "The schema of the entity",
      "value": [
        "const {{entity}}Schema = z.object({",
        "id: z.string().uuid()",
        "});"
      ]
    }
  }
}
```

These files are generated inside the template's directory, inside the `validators` subdirectory and should respect the following type definition, which will be parsed at runtime using `Zod`

```ts
type ValidatorConfig = {
    placeholders: Record<string, {
        required: boolean;
        value?: string | string[] | undefined;
        description?: string | undefined;
    }>;
    name?: string | undefined;
    description?: string | undefined;
    dependencies?: Record<...> | undefined;
    devDependencies?: Record<...> | undefined;
}
```

These configuration files and the generated empty template can be modified freely.

Notice that if the structure of the config files are not correct and/or the template you are trying to use when using the `generate` command does't include all the required placeholders defined in the config files, the command will fail.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.

## Purpose of this project

This was a small project created out of curiosity just to try working with CLIs: many features could be added or improved but I will leave it as is for the near future and focus on other projects.\
This helped me understand how TypeScript builds work without using any bundler, and only use the `tsc` compiler with `"moduleResolution": "nodenext"`: for what I've understood, this `nodenext` option should mostly be used when developing libraries that will be reused by any other packages, whereas `"moduleResolution": "bundler"` should be used when working with external bundlers that automatically handle the transpiling process, mainly used when developing whole apps.
