'use strict';

const author = commitUserFunc('author');
const committer = commitUserFunc('committer');

module.exports = {
  allUsers,
  author,
  committer,
  plural,
  uniques,
  users
};


function allUsers(commits) {
  return uniques(commits.map(users)).join(', ');
}

function plural(arr) {
  return arr.length > 1 ? 's' : '';
}

function uniques(arr) {
  return arr.sort().filter((item, i) => !(i && item == arr[i-1]));
}

function users(cmt) {
  const a = author(cmt);
  const c = committer(cmt);
  if (a && c && a != c) return `${a} and ${c}`;
  return a || c;
}

function commitUserFunc(userType) {
  return function (cmt) {
    const u = cmt[userType];
    return u && u.login
            ? '@' + u.login
            : cmt.commit[userType].name;
  };
}
