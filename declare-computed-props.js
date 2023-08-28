const fs = require('fs');
const nodeSundries = require('node-sundries');
const filesWithComputed = [];
const chalk = require('chalk');
const findLastLineOfType = require('./lib/find-last-line-of-type');
const log = [];
let linesAdded = 0;
const moment = require('moment');
const path = require('path');

const findLastTracked = (lines) =>
  findLastLineOfType(lines, {
    startLineFunc: (line) => line.trim().startsWith('export default class'),
    lineMatchFunc: (line) => line.trim().startsWith('@tracked'),
  });

function fileFilter(file, contents) {
  return contents.indexOf('@computed') > -1 && file.endsWith('.js');
}

module.exports = function (pathToProject, logPathPrefix) {
  if (fs.statSync(pathToProject).isDirectory()) {
    nodeSundries.getFiles(pathToProject, { exclude: ['node_modules', 'dummy', 'dist', 'node-utils', 'trash', 'templates', '.git', 'tests', 'addon-test-support'] }).forEach((file) => {
      const contents = fs.readFileSync(file, 'utf-8');
      if (fileFilter(file, contents)) {
        filesWithComputed.push({
          filePath: file,
          contents: contents,
        });
      }
    });
  } else {
    const contents = fs.readFileSync(pathToProject, 'utf-8');
    if (fileFilter(pathToProject, contents)) {
      filesWithComputed.push({
        filePath: pathToProject,
        contents: contents,
      });
    }
  }

  filesWithComputed.forEach((file) => {
    const props = [];
    const alreadyTracked = [];
    let lines = file.contents.split('\n');

    // const lines = lines.filter((line) => line.trim().startsWith('@computed'));
    const linesAltered = [];
    const linesIgnored = [];
    lines.forEach((line, index) => {
      const computedLineMatch = line.trim().match(/^@computed\((.*?)\)/);
      if (!computedLineMatch) {
        return;
      }
      const lineCopy = removeArrayModifiers(line);
      let dependentProps = lineCopy
        .match(/@computed\((.*?)\)/)[1]
        .split(',')
        .map((string) => string.trim().replace(/'/g, '').split('.@each')[0].split('.[]')[0]);

      dependentProps = uniq(dependentProps);
      if (dependentProps.filter((dependentProp) => dependentProp.indexOf('.') > -1 || dependentProp.indexOf('{') > -1).length > 0) {
        linesIgnored.push({
          lineNumber: index + 1,
          text: line,
        });
        return;
      }
      if (lines[index] !== lineCopy) {
        lines[index] = lineCopy;
        linesAltered.push({
          lineNumber: index + 1,
          from: line,
          to: lines[index],
        });
      }
      dependentProps.forEach((dependentProp) => {
        if (props.indexOf(dependentProp) > -1) {
          return;
        }
        if (getterExists(lines, dependentProp)) {
          return;
        }
        if (lines.find((line) => line.trim() === `@tracked ${dependentProp};`)) {
          if (alreadyTracked.indexOf(dependentProp) < 0) {
            alreadyTracked.push(dependentProp);
          }
          return;
        }
        props.push(dependentProp);
      });
    });
    const logItem = { filepath: file.filePath, linesUpdated: linesAltered, linesIgnored: linesIgnored };
    if (props.length > 0) {
      const trackedText = props.map((prop) => `  ${prop};`).join('\n');
      lines.splice(findLastTracked(lines) + 1, 0, `${trackedText}\n`);
      logItem.declarationsAdded = props;
      linesAdded += props.length + 1;
      logItem.linesUpdated.forEach((item) => {
        item.lineNumber += linesAdded;
      });
      logItem.linesIgnored.forEach((item) => {
        item.lineNumber += linesAdded;
      });
      log.push(logItem);
      fs.writeFileSync(file.filePath, lines.join('\n'));
    }
  });
  if (log.length) {
    const logFileName = `${moment().format('YYYY-MM-DD-hhmm-')}no-this-dot-get-log.json`;
    fs.writeFileSync(path.join(logPathPrefix, logFileName), JSON.stringify(log, null, 2));
    console.log(chalk.magenta(`Log of changes written to ${path.join(logPathPrefix, logFileName)}`));
  } else {
    console.log(chalk.magenta(`No changes made`));
  }
};

function getterExists(lines, prop) {
  return lines.find((line) => line.trim().startsWith(`get ${prop}(`));
}

function removeArrayModifiers(line) {
  if (!line.trim().startsWith('@computed')) {
    return line;
  }
  const newProps = line
    .match(/@computed\((.*?)\)/)[1]
    .split(',')
    .map((string) => `'${string.trim().replace(/'/g, '').split('.@each')[0].split('.[]')[0]}'`);
  return `  @computed(${uniq(newProps).join(', ')})`;
}

function uniq(array) {
  // Return array of only unique values
  return array.filter((value, index, self) => self.indexOf(value) === index);
}
