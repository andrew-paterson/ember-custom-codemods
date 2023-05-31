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
      if (contents.indexOf('didInsertElement') > -1) {
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
      const actionsLines = ['  actions: {', '  },'];
      lines = insertArrayAt(lines, lastLineIndex, actionsLines);
      console.log(chalk.blue(`Actions hash added to ${file.filePath}`));
    } else {
      didInsertParsed.push('\n');
    }
    const actionsLineIndex = lines.indexOf('  actions: {');
    lines = insertArrayAt(lines, actionsLineIndex + 1, didInsertParsed);

    console.log(chalk.magenta(file.filePath));
    let string = lines
      .join('\n')
      .replace(didInsertElementLines.join('\n'), '')
      .replace(/\n\s*\n/g, '\n\n');
    // console.log(string);
    // console.log('-----------------');
    console.log(findHbsFromJs(file.filePath, file.contents));
  });
};

function insertArrayAt(array, index, arrayToInsert) {
  return [].concat(...array.slice(0, index), ...arrayToInsert, ...array.slice(index));
}
