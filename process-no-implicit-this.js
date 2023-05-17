const fs = require('fs');
const chalk = require('chalk');
const path = require('path');

module.exports = function (pathToProject, componentsMap, namedArgs, noImplicitThisLintResult) {
  try {
    const errors = noImplicitThisLintResult;
    const errorsArray = [];
    for (const filePath in errors) {
      const errorsForFile = errors[filePath];
      errorsArray.push({
        filePath: filePath,
        errors: errorsForFile.map((item) => {
          return {
            line: item.line,
            column: item.column,
            source: item.source,
          };
        }),
      });
    }
    errorsArray.forEach((errorHbs) => {
      const componentMapItem = componentsMap.find((item) => {
        return item.template.endsWith(errorHbs.filePath);
      });
      if (!componentMapItem) {
        return;
      }
      const jsProps = componentMapItem.js.reduce((acc, jsFile) => {
        return acc.concat(collectFileProps(jsFile));
      }, []);
      componentMapItem.jsProps = jsProps;
      const filePath = path.resolve(pathToProject, errorHbs.filePath);
      const hbsContents = fs.readFileSync(filePath, 'utf-8');
      let updatedHbsContent = hbsContents;
      errorHbs.lineShift = {};
      errorHbs.errors.forEach((error) => {
        if (componentMapItem.jsProps.indexOf(error.source.split('.')[0]) > -1) {
          updatedHbsContent = insertStringAtPosition(updatedHbsContent, error, 'this.', errorHbs.lineShift);
        } else if (namedArgs.indexOf(`@${error.source.split('.')[0]}`) > -1) {
          updatedHbsContent = insertStringAtPosition(updatedHbsContent, error, '@', errorHbs.lineShift);
        } else {
          // console.log(error.source.split('.')[0]);
        }
      });
      fs.writeFileSync(filePath, updatedHbsContent);
      console.log(chalk.green('Updated:'), errorHbs.filePath);
    });
  } catch (err) {
    console.log(err);
  }

  function collectFileProps(file) {
    const fileProps = [];
    const contents = fs.readFileSync(file, 'utf-8');
    const setMatches = contents.match(/this\.set\(\s*'(.*?)'/g);
    if (setMatches) {
      setMatches.forEach((result) => {
        fileProps.push(result.match(/this\.set\(\s*'(.*?)'/)[1]);
      });
    }
    const thisDotEqualsMatches = contents.match(/this\.(.*?)\s*=/g);
    if (thisDotEqualsMatches) {
      thisDotEqualsMatches.forEach((result) => {
        fileProps.push(result.match(/this\.(.*?)\s*=/)[1]);
      });
    }
    const main = contents.split('extend(')[1].trim();
    let lines = main
      .replace('layout,', '')
      .replace('layout', '')
      .replace(/computed.or/g, 'computed')
      .replace(/computed.reads/g, 'computed')
      .replace(/computed.equal/g, 'computed')
      .replace(/computed.filterBy/g, 'computed')
      .split('\n');
    lines.pop();
    lines.push('}');
    const functionDefs = `function computed() { return; }
    function service() { return; }
    function alias() { return; }
    function sort() { return; }
    const customValidators = {};
    const config = {gReCaptcha: {}};`;
    const objString = `${functionDefs}\nmodule.exports = ${lines.join('\n')}`;
    let obj;
    try {
      obj = eval(objString);
    } catch (err) {
      console.log(chalk.yellow(file));
      console.log(chalk.red(err));
      console.log(objString);
    }
    for (const key in obj) {
      fileProps.push(key);
    }
    return fileProps;
  }

  function insertStringAtPosition(multiLineString, error, stringToInsert, lineShift) {
    const lineNumber = error.line;
    const columnNumber = error.column + 1 + (lineShift[lineNumber] || 0);
    const lines = multiLineString.split('\n');

    if (lineNumber <= 0 || lineNumber > lines.length) {
      console.error('Invalid line number');
      return multiLineString;
    }

    const line = lines[lineNumber - 1];

    if (columnNumber <= 0 || columnNumber > line.length + 1) {
      console.error('Invalid column number');
      return multiLineString;
    }

    const prefix = line.substring(0, columnNumber - 1);
    const suffix = line.substring(columnNumber - 1);

    lines[lineNumber - 1] = prefix + stringToInsert + suffix;
    lineShift[lineNumber] = stringToInsert.length;
    return lines.join('\n');
  }
};