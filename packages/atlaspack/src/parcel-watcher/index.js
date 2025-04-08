/* eslint-disable import/no-extraneous-dependencies */

const path = require('path');
const micromatch = require('micromatch');
const isGlob = require('is-glob');

/*
'aix'
'darwin'
'freebsd'
'linux'
'openbsd'
'sunos'
'win32'

'arm'
'arm64'
'ia32'
'loong64'
'mips'
'mipsel'
'ppc'
'ppc64'
'riscv64'
's390'
's390x'
'x64'
*/

let libcFamily = undefined;
if (process.platform === 'linux') {
  const {MUSL, family} = require('detect-libc');
  if (family === MUSL) {
    libcFamily = 'musl';
  } else {
    libcFamily = 'glibc';
  }
}

let binding;
if (
  process.platform === 'linux' &&
  process.arch === 'x64' &&
  libcFamily === 'glibc'
) {
  binding = require('@parcel/watcher-linux-x64-glibc');
} else if (
  process.platform === 'linux' &&
  process.arch === 'x64' &&
  libcFamily === 'musl'
) {
  binding = require('@parcel/watcher-linux-x64-musl');
} else if (
  process.platform === 'linux' &&
  process.arch === 'arm64' &&
  libcFamily === 'glibc'
) {
  binding = require('@parcel/watcher-linux-arm64-glibc');
} else if (
  process.platform === 'linux' &&
  process.arch === 'arm64' &&
  libcFamily === 'musl'
) {
  binding = require('@parcel/watcher-linux-arm64-musl');
} else if (process.platform === 'darwin' && process.arch === 'arm64') {
  binding = require('@parcel/watcher-darwin-arm64');
} else if (process.platform === 'darwin' && process.arch === 'x64') {
  binding = require('@parcel/watcher-darwin-x64');
} else {
  throw new Error('Binary not found');
}

function normalizeOptions(dir, opts = {}) {
  const {ignore, ...rest} = opts;

  if (Array.isArray(ignore)) {
    opts = {...rest};

    for (const value of ignore) {
      if (isGlob(value)) {
        if (!opts.ignoreGlobs) {
          opts.ignoreGlobs = [];
        }

        const regex = micromatch.makeRe(value, {
          // We set `dot: true` to workaround an issue with the
          // regular expression on Linux where the resulting
          // negative lookahead `(?!(\\/|^)` was never matching
          // in some cases. See also https://bit.ly/3UZlQDm
          dot: true,
          // C++ does not support lookbehind regex patterns, they
          // were only added later to JavaScript engines
          // (https://bit.ly/3V7S6UL)
          lookbehinds: false,
        });
        opts.ignoreGlobs.push(regex.source);
      } else {
        if (!opts.ignorePaths) {
          opts.ignorePaths = [];
        }

        opts.ignorePaths.push(path.resolve(dir, value));
      }
    }
  }

  return opts;
}

exports.writeSnapshot = (dir, snapshot, opts) => {
  return binding.writeSnapshot(
    path.resolve(dir),
    path.resolve(snapshot),
    normalizeOptions(dir, opts),
  );
};

exports.getEventsSince = (dir, snapshot, opts) => {
  return binding.getEventsSince(
    path.resolve(dir),
    path.resolve(snapshot),
    normalizeOptions(dir, opts),
  );
};

exports.subscribe = async (dir, fn, opts) => {
  dir = path.resolve(dir);
  opts = normalizeOptions(dir, opts);
  await binding.subscribe(dir, fn, opts);

  return {
    unsubscribe() {
      return binding.unsubscribe(dir, fn, opts);
    },
  };
};

exports.unsubscribe = (dir, fn, opts) => {
  return binding.unsubscribe(
    path.resolve(dir),
    fn,
    normalizeOptions(dir, opts),
  );
};
