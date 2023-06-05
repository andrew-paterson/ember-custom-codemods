const fs = require('fs');
const chalk = require('chalk');
const nodeSundries = require('node-sundries');
const path = require('path');
const findHbsFromJs = require('./lib/find-hbs-from-js');
const filesWithDidInsert = [];

module.exports = function (pathToProject) {
  nodeSundries
    .getFiles(pathToProject, { exclude: ['node_modules', 'dummy', 'dist', 'node-utils', 'trash', 'templates', '.git'] })
    .filter((file) => file.indexOf('/components/') > -1)
    .forEach((file) => {
      const contents = fs.readFileSync(file, 'utf-8');
      if (contents.indexOf('didInsertElement') > -1 && contents.indexOf('// didInsertElement') === -1) {
        filesWithDidInsert.push({
          filePath: file,
          contents: contents,
        });
      }
    });
  // const projectNameSpace =

  console.log(filesWithDidInsert.length);
  filesWithDidInsert.forEach((file) => {
    const didInsertElementLines = [];
    let isInDidInsertFunction = false;
    let lines = file.contents.split('\n');

    lines.forEach((line) => {
      if (isInDidInsertFunction) {
        didInsertElementLines.push(line);
      }
      if (line.indexOf('didInsertElement') > -1) {
        isInDidInsertFunction = true;
        didInsertElementLines.push(line);
      } else if (line === '  },') {
        isInDidInsertFunction = false;
      }
    });
    const didInsertParsed = [...didInsertElementLines]
      .filter((line) => line.indexOf('this._super') === -1)
      .map((line) => {
        if (line.indexOf('didInsertElement') > -1) {
          line = '  didInsert() {';
        }
        return `  ${line}`;
      });
    if (file.contents.indexOf('actions:') === -1) {
      const lastLineIndex = lines.indexOf('});');
      const actionsLines = ['\n', '  actions: {', '  },'];
      lines = insertArrayAt(lines, lastLineIndex, actionsLines);
      console.log(chalk.blue(`Actions hash added to ${file.filePath}`));
    } else {
      didInsertParsed.push('\n');
    }
    const actionsLineIndex = lines.indexOf('  actions: {');
    lines = insertArrayAt(lines, actionsLineIndex + 1, didInsertParsed);

    console.log(chalk.magenta(file.filePath));
    const jsFinal = lines
      .join('\n')
      .replace(didInsertElementLines.join('\n'), '')
      .replace(/\n\s*\n/g, '\n\n');
    fs.writeFileSync(file.filePath, jsFinal);
    console.log(chalk.green(`JS updated for ${file.filePath}`));
    const hbsPath = findHbsFromJs(pathToProject, file.filePath, file.contents);
    if (fs.existsSync(hbsPath)) {
      let hbsContents = fs.readFileSync(hbsPath, 'utf-8');
      const hbsLines = hbsContents.split('\n');
      if (!hbsLines[0].match(/<\w+[ >]*/)) {
        console.log(chalk.red(`Skipping HBS update for ${file.filePath} as it may start with a helper. Search HBS files for {{! manual did insert }}.`));
        hbsLines.push('{{! manual did insert }}');
        hbsContents = hbsLines.join('\n');
      } else {
        if (hbsContents.indexOf('...attributes') > -1) {
          hbsContents = hbsContents.replace('...attributes', ' {{did-insert (action "didInsert")}} ...attributes');
        } else {
          hbsContents = hbsContents.replace('>', ' {{did-insert (action "didInsert")}}>');
        }
      }
      fs.writeFileSync(hbsPath, hbsContents);
      console.log(chalk.green(`HBS updated for ${hbsPath}`));
    } else {
      console.log(chalk.red(`No corresponding HBS file for ${file.filePath}`));
    }
  });
};

function insertArrayAt(array, index, arrayToInsert) {
  return [].concat(...array.slice(0, index), ...arrayToInsert, ...array.slice(index));
}
