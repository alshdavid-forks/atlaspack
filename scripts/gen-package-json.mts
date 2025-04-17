// @ts-check

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';
import * as process from 'node:process';
import glob from 'glob';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const __root = path.dirname(__dirname);
const { workspaces } = JSON.parse(fs.readFileSync(path.join(__root, 'package.json'), 'utf8'))

const ignore = [
  "caniuse-database",
  "lmdb-js-lite",
  "fuzzer",
  "@atlaspack/benchmarks",
  "@atlaspack/benchmark-three-js",
  "@atlaspack/repl",
  "@atlaspack/conditional-bundling-example",
  "@atlaspack/eslint-example",
  "@atlaspack/html-example",
  "@atlaspack/kitchen-sink-example",
  "@atlaspack/react-hmr-example",
  "@atlaspack/react-refresh-example",
  "@atlaspack/simple-example",
  "@atlaspack/typechecking-example",
  "@atlaspack/typescript-example",
  "atlaspack-for-vscode"
]

const newPackageJson = {
  name: `atlaspack-${process.platform}-${process.arch}`,
  bin: {
    atlaspack: './packages/core/cli/lib/cli.js'
  },
  exports: {
    ['.']: './packages/core/core/lib/index.js'
  }
}

for (const workspace of workspaces) {
  for (const packageJson of glob.sync(path.join(workspace, 'package.json'), { cwd: __root })) {
    const packageJsonPath = path.join(__root, packageJson);
    const { name, main, types } = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    if (ignore.includes(name)) continue
    const packageDirname = path.dirname(packageJsonPath)
    const mainPath = path.join(packageDirname, main || 'index.js')
    const mainPathRel = path.relative(__root, mainPath)

    const [_, namespace, packageName] = mainPathRel.split(path.sep)

    newPackageJson.exports[`./${namespace}/${packageName}`] = {
      default: `./${mainPathRel}`,
      ...(types ? { types } : {})
    }
  }
}

process.stdout.write(JSON.stringify(newPackageJson, null, 2))
