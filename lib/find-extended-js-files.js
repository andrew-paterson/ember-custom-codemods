const fs = require('fs');
const path = require('path');

// DOCS - limitation- only find files that are extended from within the same project.
// Docs pathToProject must be the base of the Ember project (One level above either app or addon)

function findExtended(jsFile, extendedFiles, pathToProject) {
  const projectNameSpace = jsFile.indexOf('/addon/') > -1 ? 'addon' : 'app';
  const contents = fs.readFileSync(jsFile, 'utf-8');
  const extendedLine = contents.split('\n').find((line) => line.match(/export default (.*?).extend/));
  if (!extendedLine) {
    return extendedFiles;
  }
  const extended = extendedLine.match(/export default (.*?).extend/)[1];
  if (extended === 'Component' || extended === 'Controller') {
    return extendedFiles;
  }

  const importLine = contents.split('\n').find((line) => line.indexOf(`import ${extended}`) > -1 || line.indexOf(`import { ${extended} }`) > -1);
  if (!importLine) {
    return extendedFiles;
  }
  const parsedImportLine = importLine.replace(';', '').replace(/'/g, '').split(' from ')[1];

  const projectBaseName = path.basename(pathToProject);
  console.log(parsedImportLine);
  const depsMap = {
    'hyrax-ember-assets': '/home/paddy/hyraxbio/hyrax-ember-assets/addon',
  };

  if (parsedImportLine.indexOf(projectBaseName) === -1) {
    return extendedFiles;
  }
  const extendedFile = path.join(pathToProject, projectNameSpace, `${parsedImportLine.replace(projectBaseName, '')}.js`);
  extendedFiles.push(extendedFile);
  return findExtended(extendedFile, extendedFiles, pathToProject);
}

module.exports = findExtended;
