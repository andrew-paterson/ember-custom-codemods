const fs = require('fs');
const nodeSundries = require('node-sundries');
const path = require('path');

module.exports = function (projectPaths) {
  const finalLines = [];
  projectPaths.forEach((pathToProject) => {
    const resolvedPathToProject = path.resolve(process.cwd(), pathToProject);
    const files = nodeSundries.getFiles(resolvedPathToProject, { exclude: ['node_modules'] }).filter((file) => path.extname(file) === '.hbs');
    files.forEach((file) => {
      const contents = fs.readFileSync(file, 'utf-8');
      const lines = contents.split('\n');
      const hasEqual = lines.filter((line) => line.indexOf('=') > -1).map((line) => line.trim());
      hasEqual.forEach((line) => {
        const lineParts = line.split(' ').filter((linePart) => linePart.indexOf('=') > -1);
        lineParts.forEach((linePart) => {
          let prop = linePart.split('=')[0].trim();
          if (prop.indexOf(' ') > -1) {
            prop = prop.split(' ')[1];
          }
          if (finalLines.indexOf(prop) === -1) {
            finalLines.push(prop);
          }
        });
      });
    });
  });
  return finalLines.sort().filter((item) => item.startsWith('@'));
};
