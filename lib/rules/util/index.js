'use strict';

module.exports = {
  plural,
  uniques,
  user,
  users
};


function plural(arr) {
  return arr.length > 1 ? 's' : '';
}

function uniques(arr) {
  return arr.sort().filter((item, i) => !(i && item == arr[i-1]));
}

function user(cmt, userType) {
  return cmt[userType] && cmt[userType].login
          ? '@' + cmt[userType].login
          : cmt.commit[userType].name;
}

function users(cmt) {
  const a = user(cmt, 'author');
  const c = user(cmt, 'committer');
  if (a && c && a != c) return `${a} and ${c}`;
  return a || c;
}
