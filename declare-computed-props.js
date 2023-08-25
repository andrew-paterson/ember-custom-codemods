const fs = require('fs');
const nodeSundries = require('node-sundries');
const filesWithComputed = [];
const chalk = require('chalk');
const findLastTracked = require('./lib/find-last-tracked-prop');

module.exports = function (pathToProject) {
  nodeSundries.getFiles(pathToProject, { exclude: ['node_modules', 'dummy', 'dist', 'node-utils', 'trash', 'templates', '.git'] }).forEach((file) => {
    const contents = fs.readFileSync(file, 'utf-8');
    if (contents.indexOf('@computed') > -1) {
      filesWithComputed.push({
        filePath: file,
        contents: contents,
      });
    }
  });

  filesWithComputed.forEach((file) => {
    const props = [];
    const alreadyTracked = [];
    let lines = file.contents.split('\n').map((line) => removeArrayModifiers(line));

    const computedLines = lines.filter((line) => line.trim().startsWith('@computed'));

    computedLines.forEach((computedLine) => {
      const dependentProps = computedLine
        .match(/@computed\((.*?)\)/)[1]
        .split(',')
        .map((string) => string.trim().replace(/'/g, ''));
      if (dependentProps.filter((dependentProp) => dependentProp.indexOf('.') > -1).length > 0) {
        console.log('nested props');
        return;
      }

      computedLine = dependentProps.join(', ');
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
    if (props.length > 0) {
      const trackedText = props.map((prop) => `  ${prop};`).join('\n');
      lines.splice(findLastTracked(lines) + 1, 0, `${trackedText}\n`);
      fs.writeFileSync(file.filePath, lines.join('\n'));
      console.log(chalk.green(`Added prop declarations for ${file.filePath}`));
    } else {
      fs.writeFileSync(file.filePath, lines.join('\n'));
      const suffix = alreadyTracked.length > 0 ? ` (already tracked: ${alreadyTracked.join(', ')})` : '';
      console.log(chalk.yellow(`No declarations added to ${file.filePath}${suffix}`));
    }
  });
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
    .map((string) => `'${string.trim().replace(/'/g, '').split('.@each')[0].split('[]')[0]}'`);
  console.log(`  @computed(${uniq(newProps).join(', ')})`);
  return `  @computed(${uniq(newProps).join(', ')})`;
}

function uniq(array) {
  // Return array of only unique values
  return array.filter((value, index, self) => self.indexOf(value) === index);
}
