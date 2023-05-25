const fs = require('fs');
const findExtended = require('./find-extended-js-files');

// Docs pathToProject must be the base of the Ember project (One level above either app or addon)

module.exports = function (hbsFilePath, jsFiles, pathToProject, options = {}) {
  if (hbsFilePath.endsWith('.hbs')) {
    hbsFilePath = hbsFilePath.replace('.hbs', '');
  }
  let jsFileMatches = [];
  jsFiles.forEach((file) => {
    const filepathParts = file.split('/');
    const contents = fs.readFileSync(file, 'utf-8');
    const layoutLine = contents.split('\n').find((line) => line.indexOf('import layout') > -1);
    if (layoutLine) {
      const layoutPath = `${layoutLine.split(' from ')[1].replace(';', '').replace("'", '').replace("'", '').split('templates/')[1]}`;
      if (hbsFilePath.endsWith(layoutPath)) {
        jsFileMatches.push(file);
        if (options.includeExtended) {
          const extendedFiles = findExtended(file, [], pathToProject);
          if (extendedFiles.length > 0) {
            jsFileMatches = jsFileMatches.concat(extendedFiles);
          }
        }
      }
    } else if (filepathParts.indexOf('controllers') > -1) {
      const genericFilePathFromJsFile = file.split('/controllers/')[1].replace('.js', '');
      const genericFilePathFromHbsFile = hbsFilePath.split('/templates/')[1];
      if (genericFilePathFromJsFile === genericFilePathFromHbsFile) {
        jsFileMatches.push(file);
        if (options.includeExtended) {
          const extendedFiles = findExtended(file, [], pathToProject);
          if (extendedFiles.length > 0) {
            jsFileMatches = jsFileMatches.concat(extendedFiles);
          }
        }
      }
    }
  });
  return jsFileMatches;
};
