# treemd-js

`treemd` is a command-line tool that assembles multiple files from your project into a single context, primarily designed for use with Large Language Models (LLMs). It generates a markdown representation of your directory structure and file contents, making it easy to provide comprehensive project context to AI models.

## Features

- Generate an ASCII tree representation of directory structure
- Includes file contents in the output
- Respects `.gitignore` rules
- Filters files by extension
- Estimates token count for LLM context sizing

## Installation

To install `treemd` globally, run:

```bash
npm install -g treemd-js
```

Or use `npx` to run it without installing:

```bash
npx treemd-js
```

## Usage

Basic usage:

```bash
treemd [directory] [options]
```

If no directory is specified, `treemd` will use the current directory.

### Options

- `-e, --extensions <extensions>`: Comma-separated list of file extensions to include
- `-s, --silent`: Suppress token count output

### Examples

1. Generate markdown for the current directory:
   ```bash
   treemd
   ```

2. Generate markdown for a specific directory, including only JavaScript and TypeScript files:
   ```bash
   treemd /path/to/your/project -e js,ts
   ```

3. Copy the output directly to clipboard (macOS) for pasting into an LLM interface:
   ```bash
   treemd | pbcopy
   ```

## Output

The output is in Markdown format and includes:

1. An ASCII tree representation of the directory structure
2. File contents for text files

Example output:

````markdown
# File tree
```
project/
├── src/
│   ├── index.js
│   └── utils.js
├── tests/
│   └── test_utils.js
└── README.md
```

# Files content
**index.js:**
```
console.log("Hello, world!");
```

**utils.js:**
```
function add(a, b) {
  return a + b;
}
```

**test_utils.js:**
```
assert.equal(add(2, 2), 4);
```

**README.md:**
```
# My Project
This is a sample project.
```
````

## Caveats

- `treemd` respects `.gitignore` files in the scanned directory.
- It always excludes certain files/directories like `.git`, `.gitignore`, etc.
- Only text files are included in the output.
- The tool estimates token count, which may vary slightly from the actual count used by specific LLM implementations.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.