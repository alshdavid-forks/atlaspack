/* eslint-disable no-console */
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as crypto from 'node:crypto';
import fsExtra from 'fs-extra';
import * as process from 'node:process';
import * as module from 'node:module';
import * as child_process from 'node:child_process';
import * as url from 'node:url';
import glob from 'glob';
import tmpDir from 'temp-dir';
import semver from 'semver';

const __tmp = path.join(
  tmpDir,
  `atlaspack-${(Math.random() * 100000000000).toFixed()}`,
);
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const __root = path.dirname(__dirname);
const require = module.createRequire(path.join(__root, 'index.js'));

// For package name
const platform = {
  linux: 'linux',
  darwin: 'macos',
  win32: 'windows',
}[process.platform];

const arch = {
  x64: 'amd64',
  arm64: 'arm64',
}[process.arch];

// For optional dependencies
const nodeArch = {
  amd64: 'x64',
  arm64: 'arm64',
}[arch];

const nodePlatform = {
  linux: 'linux',
  macos: 'darwin',
  windows: 'win32',
}[platform];

const release = `atlaspack-${platform}-${arch}`;

// Version must be semver compliant
const version = process.env.ATLASPACK_VERSION || '0.0.0-local';
if (!semver.valid(version)) {
  console.error('Invalid semver specified');
  process.exit(1);
}

console.table({
  platform,
  arch,
  version,
});

// Main package.json
const packageJson = {
  name: release,
  version: version,
  bin: {
    atlaspack: './lib/packages/core/cli/bin/atlaspack.js',
  },
  exports: {
    '.': './lib/packages/core/core/lib/index.js',
    './*': './lib/packages/core/*/lib/index.js',
    './package.json': './package.json',
  },
  dependencies: {},
  devDependencies: {},
  os: [nodePlatform],
  cpu: [nodeArch],
};

// Exclude these packages
const excludeList = [
  'contextual-imports-swc-plugin',
  'apvm',
  'test',
  'node_modules',
  'bundler-experimental',
  'parcel-to-atlaspack',
];

const tarInclude = [];

// Find public packages, mark them as included and construct the
// package.json exports key to create a public API that represents
// the folder structure of the repo
main: for (const pkgPath of glob.sync('./packages/**/*/package.json', {
  cwd: __root,
  ignore: [
    '**/node_modules/**',
    '**/integration-tests/**',
    '**/test/**',
    '**/examples/**',
    '**/apvm/**/*',
  ],
})) {
  // The ignore patterns don't work 🤷
  for (const exclude of excludeList) {
    if (pkgPath.includes(exclude)) continue main;
  }

  const pkgDir = path.dirname(pkgPath);
  const pkg = readJson(path.join(__root, pkgPath));
  if (!pkg.publishConfig || pkg.publishConfig.access !== 'public') {
    continue;
  }

  tarInclude.push(path.dirname(pkgPath));
  const entry = require.resolve(pkg.name).replace(__root + '/', '');
  const specifier = path.dirname(pkgPath).replace('./packages/', '');
  const parsedEntry = path.parse(entry);

  // Find types
  let types = undefined;
  if (pkg.types) {
    types = `./lib/${pkgDir.replace('./', '')}/${pkg.types}`;
  } else if (
    fs.existsSync(path.join(parsedEntry.dir, `${parsedEntry.name}.d.ts`))
  ) {
    types = `./lib/${parsedEntry.dir.replace('./', '')}/${
      parsedEntry.name
    }.d.ts`;
  } else if (fs.existsSync(path.join(pkgDir, 'index.d.ts'))) {
    types = `./lib/${pkgDir.replace('./', '')}/index.d.ts`;
  }

  // Reexport /packages/core on the top level
  if (path.dirname(pkgDir).endsWith('core')) {
    const basename = path.basename(specifier);
    if (basename !== 'utils') {
      packageJson.exports[
        `./${path.basename(specifier)}/*`
      ] = `./lib/${pkgDir}/*`;
    }
    packageJson.exports[`./${path.basename(specifier)}`] = {
      types,
      default: `./lib/${entry}`,
    };
  }

  // package.json exports
  packageJson.exports[`./${specifier}`] = {
    types,
    default: `./lib/${entry}`,
  };
  if (specifier !== 'core/utils') {
    packageJson.exports[`./${specifier}/*`] = `./lib/${pkgDir}/*`;
  }

  // Add target to package.json as a symlink package
  packageJson.dependencies[pkg.name] = `file:./lib/${path
    .dirname(pkgPath)
    .replace('./', '')}`;

  // Merge dependencies
  for (const [key] of Object.entries(pkg.dependencies || {})) {
    if (key.startsWith('@atlaspack/')) continue;
    const dep = readJson(
      module.findPackageJSON(key, new URL(url.pathToFileURL(pkgDir))),
    );
    console.log(dep.name, dep.version);
    if (key === '@parcel/watcher') {
      packageJson.dependencies[key] = '2.5.1';
    } else if (!packageJson.dependencies[key]) {
      packageJson.dependencies[key] = dep.version;
    } else if (semver.gt(dep.version, packageJson.dependencies[key])) {
      packageJson.dependencies[key] = dep.version;
    }
  }

  if (pkg.name === '@atlaspack/node-resolver-core') {
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      ...pkg.devDependencies,
    };
  }
}

packageJson.exports['./*'] = './lib/packages/core/*/lib/index.js';
packageJson.dependencies = sortObject(packageJson.dependencies);
packageJson.devDependencies = sortObject(packageJson.devDependencies);

// Create release dir
createOrReplaceDir(path.join(__root, 'release', release));
createOrReplaceDir(path.join(__root, 'release', release, 'lib'));

// Copy files, excluding specific files
for (const include of tarInclude) {
  await fsExtra.copy(
    path.join(__root, include),
    path.join(__root, 'release', release, 'lib', include),
    {
      filter: (path) => {
        if (path.includes('fixture')) return false;
        if (path.endsWith('.gitignore')) return false;
        if (path.endsWith('.map')) return false;
        if (path.endsWith('.test.')) return false;
        if (fs.lstatSync(path).isFile()) return true;
        return !(path.indexOf('node_modules') > -1);
      },
    },
  );
}

writeJson(path.join(__root, 'release', release, 'lib', 'package.json'), {
  name: '@atlaspack/monorepo',
  private: true,
  workspaces: ['packages/*/*'],
});

writeJson(path.join(__root, 'release', release, 'package.json'), packageJson);
writeFile(path.join(__root, 'release', release, '.npmignore'), '!*\n');

// Modify release package.json files
for (const pkgPath of glob.sync(
  `./release/${release}/lib/packages/**/package.json`,
  {cwd: __root},
)) {
  const pkg = readJson(path.join(__root, pkgPath));
  if (!pkg.publishConfig || pkg.publishConfig.access !== 'public') {
    continue;
  }

  const original = pkg.dependencies;
  pkg.dependencies = {};

  for (const [key, version] of Object.entries(original || {})) {
    if (key.startsWith('@atlaspack/')) continue;
    pkg.dependencies[key] = version;
  }

  pkg.version = version;
  pkg.dependencies = sortObject(pkg.dependencies);
  pkg.peerDependencies = undefined;

  if (pkg.name !== '@atlaspack/node-resolver-core') {
    pkg.devDependencies = undefined;
  }
  pkg.scripts = undefined;
  pkg.exports = undefined;
  pkg.engines = undefined;
  pkg.source = undefined;

  writeJson(path.join(__root, pkgPath), pkg);
}

// Generate tarball of dependencies
try {
  if (fs.existsSync(__tmp)) {
    fs.rmSync(__tmp, {
      recursive: true,
      force: true,
    });
  }
  fs.cpSync(path.join(__root, 'release', release), __tmp, {recursive: true});

  child_process.execFileSync(
    'npm',
    ['install', '--legacy-peer-deps', '--package-lock-only'],
    {
      stdio: 'inherit',
      shell: true,
      cwd: __tmp,
    },
  );

  child_process.execFileSync('yarn', ['install'], {
    stdio: 'inherit',
    shell: true,
    cwd: __tmp,
  });

  // Create a tarball of the whole repo with node_modules
  const tarComplete = `${release}-${version}.tar.gz`;
  child_process.execFileSync(
    'tar',
    ['-czf', path.join(__root, 'release', tarComplete), '.'],
    {
      stdio: 'inherit',
      shell: true,
      cwd: __tmp,
    },
  );

  // Create a tarball of just node_modules and the lock files
  const tarDependencies = `${release}-${version}-dependencies.tar.gz`;
  fs.rmSync(path.join(__tmp, 'node_modules', '@atlaspack'), {recursive: true});
  child_process.execFileSync(
    'tar',
    [
      '-czf',
      path.join(__root, 'release', tarDependencies),
      'node_modules',
      'yarn.lock',
      'package-lock.json',
    ],
    {
      stdio: 'inherit',
      shell: true,
      cwd: __tmp,
    },
  );
} finally {
  fs.rmSync(__tmp, {
    recursive: true,
    force: true,
  });
}

// Create tarball
child_process.execFileSync('npm', ['pack'], {
  stdio: 'inherit',
  shell: true,
  cwd: path.join(__root, 'release', release),
});

fs.renameSync(
  path.join(__root, 'release', release, `${release}-${version}.tgz`),
  path.join(__root, 'release', `${release}-${version}-npm.tar.gz`),
);

for (const item of fs.readdirSync(path.join(__root, 'release'))) {
  if (!item.endsWith('.tar.gz')) continue;
  const result = await new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(path.join(__root, 'release', item));
    stream.on('error', (err) => reject(err));
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
  console.log(result);
  writeFile(path.join(__root, 'release', `${item}.sha256`), result);
}

// -----
// Utils
// -----
function createOrReplaceDir(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, {
      recursive: true,
      force: true,
    });
  }
  fs.mkdirSync(target, {recursive: true});
}

function writeFile(target, data) {
  fs.writeFileSync(target, data, 'utf8');
}

function writeJson(target, obj) {
  writeFile(target, JSON.stringify(obj, null, 2));
}

function readFile(target) {
  return fs.readFileSync(target, 'utf8');
}

function readJson(target) {
  return JSON.parse(readFile(target));
}

function sortObject(input) {
  return Object.keys(input)
    .sort()
    .reduce((obj, key) => {
      obj[key] = input[key];
      return obj;
    }, {});
}
