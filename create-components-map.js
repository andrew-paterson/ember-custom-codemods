const nodeSundries = require('node-sundries');
const path = require('path');
const findRelatedJsFiles = require('./lib/find-related-js-files');

module.exports = function (pathToProject) {
  const resolvedPathToProject = path.resolve(process.cwd(), pathToProject);
  const hbsFiles = nodeSundries.getFiles(resolvedPathToProject, { exclude: ['node_modules', 'dummy', 'dist', 'node-utils', 'trash'] }).filter((file) => path.extname(file) === '.hbs');
  const jsFiles = nodeSundries.getFiles(resolvedPathToProject.replace('templates/', ''), { exclude: ['node_modules', 'dummy', 'dist', 'node-utils', 'trash'] }).filter((file) => path.extname(file) === '.js');
  return hbsFiles
    .map((hbsFile) => {
      const projectNameSpace = hbsFile.indexOf('/addon/') > -1 ? 'addon ' : 'app';
      const relativeFilePath = hbsFile.split(`/${projectNameSpace}`)[1];
      const obj = {
        template: relativeFilePath,
        js: findRelatedJsFiles(hbsFile, jsFiles, pathToProject, { includeExtended: true }),
      };
      return obj;
    })
    .filter((item) => item.js.length);
};
