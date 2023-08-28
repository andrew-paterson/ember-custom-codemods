const fs = require('fs');
const nodeSundries = require('node-sundries');
const filesWithThisDot = [];
const chalk = require('chalk');
const findHbsFromJs = require('./lib/find-hbs-from-js');
const findLastLineOfType = require('./lib/find-last-line-of-type');
const path = require('path');
const log = [];
let linesAdded = 0;
const moment = require('moment');

const findLastTracked = (lines) =>
  findLastLineOfType(lines, {
    startLineFunc: (line) => line.trim().startsWith('export default class'),
    lineMatchFunc: (line) => line.trim().startsWith('@tracked'),
  });

const findLastImport = (lines) =>
  findLastLineOfType(lines, {
    startLineFunc: (_line, index) => index === 0,
    lineMatchFunc: (line) => line.startsWith('import '),
  });

function fileFilter(file, contents, regex) {
  return contents.match(regex) && file.endsWith('.js');
}

function createRegex(ignoreProps) {
  const escapedProps = ignoreProps.map((prefix) => `${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).join('|');
  const regexPattern = `(\\b(?!${escapedProps})\\w+)\\.set\\((.*?),(.*)\\)`;
  return new RegExp(regexPattern);
}

module.exports = function (pathToProject, opts) {
  const regex = createRegex(opts.ignoreProps || []);
  if (fs.statSync(pathToProject).isDirectory()) {
    nodeSundries.getFiles(pathToProject, { exclude: ['node_modules', 'dummy', 'dist', 'node-utils', 'trash', 'templates', '.git', 'tests', 'addon-test-support'] }).forEach((file) => {
      const contents = fs.readFileSync(file, 'utf-8');
      if (fileFilter(file, contents, regex)) {
        filesWithThisDot.push({
          filePath: file,
          contents: contents,
        });
      }
    });
  } else {
    const contents = fs.readFileSync(pathToProject, 'utf-8');
    if (fileFilter(pathToProject, contents, regex)) {
      filesWithThisDot.push({
        filePath: pathToProject,
        contents: contents,
      });
    }
  }
  // return;

  filesWithThisDot.forEach((file) => {
    const additionalTrackedProps = [];
    const alreadyTracked = [];
    let lines = file.contents.split('\n');

    const linesAltered = [];
    lines.forEach((line, index) => {
      if (!line.match(regex)) {
        return;
      }
      const objectToSetOn = line.match(regex)[1];
      const padding = line.split(`${objectToSetOn}.set`)[0];
      const propToSet = line.match(regex)[2];
      const unQuotedProp = propToSet.replace(/'/g, '');
      const hbsPath = findHbsFromJs(pathToProject, file.filePath, file.contents);
      if (hbsPath) {
        const hbsContents = fs.readFileSync(hbsPath, 'utf-8');
        if (hbsContents.indexOf(`${objectToSetOn}.${unQuotedProp}`) > -1) {
          if (lines.find((line) => line.trim() === `@tracked ${unQuotedProp};`)) {
            if (alreadyTracked.indexOf(unQuotedProp) < 0) {
              alreadyTracked.push(unQuotedProp);
            }
          } else {
            additionalTrackedProps.push(unQuotedProp);
          }
        }
      }
      const old = line;
      if (propToSet.startsWith(`'`)) {
        lines[index] = `${padding}${objectToSetOn}.${unQuotedProp} = ${line.match(regex)[3].trim()};`;
      } else {
        lines[index] = `${padding}${objectToSetOn}[${unQuotedProp}] = ${line.match(regex)[3].trim()};`;
      }
      linesAltered.push({
        lineNumber: index + 1,
        from: old,
        to: lines[index],
      });
    });
    const logItem = { filepath: file.filePath, items: linesAltered };

    const suffix = alreadyTracked.length > 0 ? ` (already tracked: ${alreadyTracked.join(', ')})` : '';

    if (additionalTrackedProps.length > 0) {
      logItem.addedTracked = additionalTrackedProps;
      const trackedText = additionalTrackedProps.map((prop) => `  @tracked ${prop};`).join('\n');

      lines.splice(findLastTracked(lines) + 1, 0, `${trackedText}\n`);
      linesAdded = linesAdded + additionalTrackedProps.length + 1;

      if (file.contents.indexOf(`import { tracked } from '@glimmer/tracking';`) < 0) {
        lines.splice(findLastImport(lines) + 1, 0, `import { tracked } from '@glimmer/tracking';`);
        linesAdded += 1;
      }

      fs.writeFileSync(file.filePath, lines.join('\n'));
      console.log(chalk.green(`Removed *.set in ${file.filePath} and added tracked declarations for ${additionalTrackedProps.join(', ')}${suffix}`));
    } else {
      fs.writeFileSync(file.filePath, lines.join('\n'));
      console.log(chalk.green(`Removed *.set in ${file.filePath} and without adding any tracked props ${suffix}`));
    }
    logItem.items.forEach((item) => {
      item.lineNumber += linesAdded;
    });
    log.push(logItem);
  });
  if (log.length) {
    const logFileName = `${moment().format('YYYY-MM-DD-hhmm-')}no-this-dot-get-log.json`;
    fs.writeFileSync(path.join(pathToProject, logFileName), JSON.stringify(log, null, 2));
    console.log(chalk.magenta(`Log of changes written to ${path.join(pathToProject, logFileName)}`));
  } else {
    console.log(chalk.magenta(`No changes made`));
  }
};
