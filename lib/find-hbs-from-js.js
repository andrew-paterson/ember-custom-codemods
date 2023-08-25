const fs = require('fs');
const path = require('path');
module.exports = function (pathToProject, file, contents) {
  contents = contents || fs.readFileSync(file, 'utf-8');
  const appNameSpace = file.indexOf('/addon/') > -1 ? 'addon' : 'app';
  let hbsFilePath = '';
  const layoutLine = contents.split('\n').find((line) => line.indexOf('import layout') > -1);
  if (layoutLine) {
    hbsFilePath = path.join(file.split(`/${appNameSpace}/`)[0], appNameSpace, 'templates', layoutLine.split('/templates/')[1].replace(`';`, '.hbs'));
  } else {
    hbsFilePath = file.replace('/components/', '/templates/components/').replace('/controllers/', '/templates/').replace('/routes/', '/templates/').replace('.js', '.hbs');
  }
  if (fs.existsSync(hbsFilePath)) {
    return hbsFilePath;
  } else {
    return false;
  }
};
