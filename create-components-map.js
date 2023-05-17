const fs = require('fs');
const nodeSundries = require('node-sundries');
const path = require('path');

module.exports = function (pathToProject) {
  const resolvedPathToProject = path.resolve(process.cwd(), pathToProject);
  const hbsFiles = nodeSundries.getFiles(resolvedPathToProject, { exclude: ['node_modules', 'dummy', 'dist', 'node-utils', 'trash'] }).filter((file) => path.extname(file) === '.hbs');
  const jsFiles = nodeSundries.getFiles(resolvedPathToProject, { exclude: ['node_modules', 'dummy', 'dist', 'node-utils', 'trash'] }).filter((file) => path.extname(file) === '.js');
  return hbsFiles.map((file) => {
    const relativeFilePath = file.replace(pathToProject, '');
    const obj = {
      template: relativeFilePath,
      js: findJS(relativeFilePath.replace('.hbs', ''), jsFiles, pathToProject),
    };
    return obj;
  });
};

function findJS(filePath, jsFiles, pathToProject) {
  let jsFileMatches = [];
  jsFiles.forEach((file) => {
    const contents = fs.readFileSync(file, 'utf-8');
    const layoutLine = contents.split('\n').find((line) => line.indexOf('import layout') > -1);
    if (!layoutLine) {
      return;
    }
    const layoutPath = `${layoutLine.split(' from ')[1].replace(';', '').replace("'", '').replace("'", '').split('templates/')[1]}`;
    if (filePath.endsWith(layoutPath)) {
      jsFileMatches.push(file);
      const extendedFiles = findExtended(file, [], pathToProject);
      if (extendedFiles.length > 0) {
        jsFileMatches = jsFileMatches.concat(extendedFiles);
      }
    }
  });
  return jsFileMatches;
}

function findExtended(jsFile, extendedFiles, pathToProject) {
  const contents = fs.readFileSync(jsFile, 'utf-8');
  const extendedLine = contents.split('\n').find((line) => line.match(/export default (.*?).extend/));

  const extended = extendedLine.match(/export default (.*?).extend/)[1];
  if (extended === 'Component') {
    return extendedFiles;
  }
  const importLine = contents
    .split('\n')
    .find((line) => line.indexOf(`import ${extended}`) > -1)
    .replace(';', '')
    .replace(/'/g, '')
    .split(' from ')[1];

  const projectBaseName = path.basename(pathToProject);

  if (importLine.indexOf(projectBaseName) === -1) {
    return extendedFiles;
  }
  const extendedFile = `${pathToProject}/addon/${importLine.replace(projectBaseName, '')}.js`;
  extendedFiles.push(extendedFile);
  return findExtended(extendedFile, extendedFiles, pathToProject);
}
