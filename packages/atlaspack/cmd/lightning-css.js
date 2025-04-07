/* eslint-disable import/no-extraneous-dependencies */

let libcFamily = undefined;
if (process.platform === 'linux') {
  const {MUSL, family} = require('detect-libc');
  if (family === MUSL) {
    libcFamily = 'musl';
  } else {
    libcFamily = 'glibc';
  }
}

if (
  process.platform === 'linux' &&
  process.arch === 'x64' &&
  libcFamily === 'glibc'
) {
  module.exports = require('lightningcss-linux-x64-gnu');
} else if (
  process.platform === 'linux' &&
  process.arch === 'x64' &&
  libcFamily === 'musl'
) {
  module.exports = require('lightningcss-linux-x64-musl');
} else if (
  process.platform === 'linux' &&
  process.arch === 'arm64' &&
  libcFamily === 'glibc'
) {
  // module.exports = require('lightningcss-linux-arm64-gnu');
} else if (
  process.platform === 'linux' &&
  process.arch === 'arm64' &&
  libcFamily === 'musl'
) {
  // module.exports = require('lightningcss-linux-arm64-musl');
} else if (process.platform === 'darwin' && process.arch === 'arm64') {
  // module.exports = require('lightningcss-darwin-arm64');
} else if (process.platform === 'darwin' && process.arch === 'x64') {
  // module.exports = require('lightningcss-darwin-x64');
} else {
  throw new Error('Binary not found');
}

// module.exports.browserslistToTargets = require('lightningcss/node/browserslistToTargets');
// module.exports.composeVisitors = require('lightningcss/node/composeVisitors');
// module.exports.Features = require('lightningcss/node/flags').Features;
