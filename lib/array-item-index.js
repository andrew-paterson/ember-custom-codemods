module.exports = function arrayItemIndex(array, string, pos = 'start') {
  let index;
  if (pos === 'start') {
    index = array.findIndex((item) => item.trim().startsWith(string));
  } else if (pos === 'end') {
    index = array.findIndex((item) => item.trim().endsWith(string));
  } else {
    index = array.findIndex((item) => item.indexOf(string) > -1);
  }
  return index > -1 ? index : null;
};
