# CLI Templater Documentation

## Overview

The CLI Templater is an interactive command-line tool designed to help you set up repetitive files with a common structure. It allows you to generate boilerplate code by choosing from existing templates and customize the generated files based on your needs.

## Installation

To install the CLI Templater, you need to have [Bun](https://bun.sh/) installed. Once you have Bun, you can install the dependencies and build the project:

```sh
bun install
bun run build
```

## Usage

The CLI Templater provides two main commands: `generate` and `add-template`.

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
A default validator configuration will always be generated, copied for every specified custom validator during the command walkthrough.

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

## Template Structure

Templates are stored in the templates directory. Each template consists of the following files:

- `<templateName>.config.json`: Configuration file for the template.
- `<templateName>.js`: The main template file.
- `<templateName>.types.js` (optional): The types template file.
- `validators/<validatorName>.config.json` (optional): Configuration file for the validator.

### Configuration File

The configuration file defines the template's metadata, placeholders, and dependencies. Here is an example configuration file:

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

These files are generated inside the template's directory, inside the `validators` subdirectory

These configuration files and the generated empty template can be modified freely

Notice that if the structure of the config files are not correct and/or the template you are trying to use when using the `generate` command does't include all the required placeholders defined in the config files, the command will fail.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.
