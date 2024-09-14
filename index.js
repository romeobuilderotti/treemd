#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const asciiTree = require('ascii-tree')
const { isText: isTextFile } = require('istextorbinary')
const simpleGit = require('simple-git')
const { encode } = require('gpt-3-encoder')
const { program } = require('commander')

const ALWAYS_EXCLUDED_FILES = Object.freeze(new Set([
  '.git',
  '.gitignore',
  '.dockerignore',
  'package-lock.json',
]))

async function getGitIgnoredFiles(dir) {
  try {
    const git = simpleGit(dir)
    await git.revparse(['--is-inside-work-tree'])
    const rootDir = await git.revparse(['--show-toplevel'])
    const relativePath = path.relative(rootDir, dir) || '.'
    const status = await git.status([
      '--ignored',
      '--untracked-files=all',
      '--',
      path.join(rootDir, relativePath)
    ])
    return new Set((status.ignored || []).map(file => path.relative(relativePath, file)))
  } catch (error) {
    return new Set()
  }
}

function shouldExclude(file, ignoredFiles, relativePath) {
  return ALWAYS_EXCLUDED_FILES.has(file) || ignoredFiles.has(relativePath)
}

async function scanDirectory(rootDir, currentDir, opts, ignoredFiles = null, depth = 0) {
  if (!ignoredFiles) {
    ignoredFiles = await getGitIgnoredFiles(rootDir)
  }

  const files = fs.readdirSync(currentDir)
  let fileTree = []
  let fileContents = []

  for (const file of files) {
    const filePath = path.join(currentDir, file)
    const relativeToRoot = path.relative(rootDir, filePath)

    if (shouldExclude(file, ignoredFiles, relativeToRoot)) {
      continue
    }

    const stats = fs.statSync(filePath)
    const prefix = '#'.repeat(depth + 2)

    if (stats.isDirectory()) {
      const [subTree, subContents] = await scanDirectory(rootDir, filePath, opts, ignoredFiles, depth + 1)
      if (subContents.length > 0) {
        fileTree.push(`${prefix}${file}`)
        fileTree = fileTree.concat(subTree)
        fileContents = fileContents.concat(subContents)
      }
    } else if ((opts.extensions.length === 0 || opts.extensions.includes(path.extname(file).slice(1))) && isTextFile(filePath)) {
      fileTree.push(`${prefix}${file}`)
      const content = fs.readFileSync(filePath, 'utf8')
      fileContents.push({name: file, content})
    }
  }

  return [fileTree, fileContents]
}

async function generateTreeMarkdown(directory, opts) {
  const dir = path.resolve(directory)
  
  const [fileTree, fileContents] = await scanDirectory(dir, dir, opts)
  
  const outputLines = []
  const treeString = `#${path.basename(dir)}\n${fileTree.join('\n')}`
  const tree = asciiTree.generate(treeString)
  outputLines.push('# File tree', '```', tree, '```', '')
  outputLines.push('# Files content')
  fileContents.forEach(({ name, content }) => {
    outputLines.push(`**${name}:**`, '```', content, '```', '')
  })
  const output = outputLines.join('\n')
  console.log(output)

  if (!opts.silent) {
    const tokenCount = encode(output).length
    process.stderr.write(`Token count: ${tokenCount}\n`)
  }
}

program
  .name('treemd')
  .description('Generate a markdown representation of a directory structure and file contents')
  .argument('[directory]', 'Directory to scan', '.')
  .option('-e, --extensions <extensions>', 'Comma-separated list of file extensions to include')
  .option('-s, --silent', 'Suppress token count output')
  .addHelpText('after', `
Usage examples:
  $ treemd
  $ treemd /path/to/directory
  $ treemd -e js,ts
  $ treemd /path/to/directory -e js,ts
  $ treemd -s
  $ treemd | pbcopy

Caveats:
  - This tool respects .gitignore files in the scanned directory.
  - It always excludes certain files/directories like .git, .gitignore, etc.
  - Only text files are included in the output.`)
  .action(async (directory, cmdOpts) => {
    try {
      const opts = {
        extensions: cmdOpts.extensions ? cmdOpts.extensions.split(',') : [],
        silent: cmdOpts.silent || false,
      }
      await generateTreeMarkdown(directory, opts)
    } catch (error) {
      process.stderr.write(`Error: ${error.message}\n`)
      process.exit(1)
    }
  })

program.parse()