const fs = require('fs');
const chalk = require('chalk');
const nodeSundries = require('node-sundries');
const arrayItemIndex = require('./lib/array-item-index');

module.exports = function (pathToProject, computedMethods) {
  const files = nodeSundries.getFiles(pathToProject, { exclude: ['node_modules', 'dummy', 'dist', 'node-utils', 'trash'] });
  const jsFiles = files.filter((file) => file.endsWith('.js') && (file.indexOf('/addon/') > -1 || file.indexOf('/app/') > -1));

  for (const targetName of computedMethods) {
    const regex = new RegExp(`\\: computed\\.(${targetName})\\(`, 'g');

    const jsFilesWithComputedMethod = jsFiles.filter((file) => {
      const contents = fs.readFileSync(file, 'utf-8');
      return contents.match(regex);
    });

    jsFilesWithComputedMethod.forEach((file) => {
      let contents = fs.readFileSync(file, 'utf-8');
      let lines = contents.split('\n');
      const computedLineIndex = arrayItemIndex(lines, 'import { computed }', 'start');
      lines.splice(computedLineIndex + 1, 0, `import { ${targetName} } from '@ember/object/computed';`);
      const importAdded = lines.join('\n');
      const final = importAdded.replace(regex, ': $1(');
      fs.writeFileSync(file, final);
      console.log(chalk.green(`Added ${targetName} computed method to ${file}`));
    });
  }
};
