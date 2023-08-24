const fs = require('fs');
const nodeSundries = require('node-sundries');
const path = require('path');
const findHbsFromJs = require('./lib/find-hbs-from-js');
const filesWithComputed = [];

module.exports = function (pathToProject) {
  nodeSundries
    .getFiles(pathToProject, { exclude: ['node_modules', 'dummy', 'dist', 'node-utils', 'trash', 'templates', '.git'] })
    .filter((file) => file.indexOf('/components/') > -1)
    .forEach((file) => {
      const contents = fs.readFileSync(file, 'utf-8');
      if (contents.indexOf('@computed') > -1) {
        filesWithComputed.push({
          filePath: file,
          contents: contents,
        });
      }
    });

  filesWithComputed.forEach((file) => {
    let lines = file.contents.split('\n');

    const computedLines = lines.filter((line) => line.trim().startsWith('@computed'));

    console.log(computedLines);
  });
};
