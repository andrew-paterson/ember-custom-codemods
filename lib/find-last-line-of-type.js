module.exports = function (lines, opts) {
  const startLine = lines.find((line, index) => opts.startLineFunc(line, index));
  const startLineIndex = lines.indexOf(startLine);
  const checkNextLine = function (index) {
    if (opts.lineMatchFunc(lines[index], index)) {
      return checkNextLine(index + 1);
    } else {
      return index - 1;
    }
  };
  return checkNextLine(startLineIndex + 1);
};
