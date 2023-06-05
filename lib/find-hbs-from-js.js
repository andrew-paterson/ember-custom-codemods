const fs = require('fs');
const path = require('path');
module.exports = function (pathToProject, file, contents) {
  contents = contents || fs.readFileSync(file, 'utf-8');
  const appNameSpace = file.indexOf('/addon/') > -1 ? 'addon' : 'app';
  let hbsFilePath = '';
  const layoutLine = contents.split('\n').find((line) => line.indexOf('import layout') > -1);
  if (layoutLine) {
    hbsFilePath = path.join(pathToProject, appNameSpace, 'templates', layoutLine.split('/templates/')[1].replace(`';`, '.hbs'));
  } else {
    hbsFilePath = file.replace('/components/', '/templates/components/').replace('.js', '.hbs');
  }
  return hbsFilePath;
};
