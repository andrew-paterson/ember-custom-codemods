const fs = require('fs');
const chalk = require('chalk');
const nodeSundries = require('node-sundries');
const findRelatedJsFiles = require('./lib/find-related-js-files');
const arrayItemIndex = require('./lib/array-item-index');

module.exports = function (pathToProject, services) {
  const files = nodeSundries.getFiles(pathToProject, { exclude: ['node_modules', 'dummy', 'dist', 'node-utils', 'trash'] });
  const hbsFiles = files.filter((file) => file.endsWith('.hbs'));
  const jsFiles = files.filter((file) => file.endsWith('.js') && (file.indexOf('/addon/') > -1 || file.indexOf('/app/') > -1));

  for (const targetName of services) {
    const jsFilesWithService = jsFiles.filter((file) => {
      const contents = fs.readFileSync(file, 'utf-8');
      const regex = new RegExp(`.${targetName}[.;\n]`);
      return contents.match(regex);
    });

    const hbsWithTargetService = hbsFiles.filter((file) => {
      const contents = fs.readFileSync(file, 'utf-8');
      const regex = new RegExp(`[{.(]${targetName}.`);
      return contents.match(regex);
    });

    hbsWithTargetService.forEach((hbsFile) => {
      jsFilesWithService.push(findRelatedJsFiles(hbsFile, jsFiles, pathToProject)[0]);
    });
    jsFilesWithService.forEach((file) => {
      let contents = fs.readFileSync(file, 'utf-8');
      let lines = contents.split('\n');
      let additionsMade;
      if (!lines.find((line) => line.indexOf('import { inject as service }') > -1)) {
        const exportLineIndex = arrayItemIndex(lines, 'export default');
        lines.splice(exportLineIndex - 1, 0, "import { inject as service } from '@ember/service';");
        additionsMade = true;
      }
      if (!lines.find((line) => line.trim().startsWith(`${targetName}: service()`))) {
        const serviceLineIndex = arrayItemIndex(lines, 'service(),', 'end');
        const layoutLineIndex = arrayItemIndex(lines, 'layout', 'start');
        const tagNameIndex = arrayItemIndex(lines, 'tagName', 'start');
        const exportIndex = arrayItemIndex(lines, 'export', 'start');
        if (file.endsWith('/exatype/jobs/show/all-products/full-results-container.js')) {
          console.log(serviceLineIndex);
          console.log(layoutLineIndex);
          console.log(tagNameIndex);
          console.log(exportIndex);
        }
        const insertIndex = serviceLineIndex || layoutLineIndex || tagNameIndex || exportIndex;
        lines.splice(insertIndex + 1, 0, `  ${targetName}: service(),`);
        additionsMade = true;
      }
      if (additionsMade) {
        fs.writeFileSync(file, lines.join('\n'));
        console.log(chalk.green(`Added ${targetName} service to ${file}`));
      }
      // console.log(lines.join('\n'));
    });
  }
};
