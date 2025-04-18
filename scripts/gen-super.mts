// @ts-check

// Must be run in Node 23

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as url from 'node:url';
import * as process from 'node:process';
import * as nodeModule from 'node:module';
import { execSync } from 'node:child_process';
import glob from 'glob';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const __root = path.dirname(__dirname);
const __cwd = process.cwd()
const __output = path.join(__cwd, `atlaspack-${process.platform}-${process.arch}`)
const tarball = `atlaspack-${process.platform}-${process.arch}.tar.xz`

const toCopy = [
  'node_modules',
  'packages',
]

const newPackageJson = {
  name: `atlaspack-${process.platform}-${process.arch}`,
  version: "2.13.1",
  type: "commonjs",
  bin: {
    atlaspack: './core/cli/lib/cli.js',
  },
  main: "./core/core/lib/index.js",
}

void async function main() {
  // Create directory and copy Atlaspack there
  if (fs.existsSync(__output)) {
    fs.rmSync(__output, { recursive: true, force: true })
  }
  if (fs.existsSync(path.join(__cwd, tarball))) {
    fs.rmSync(path.join(__cwd, tarball), { recursive: true, force: true })
  }
  fs.mkdirSync(__output)

  // Copy over node_modules
  fs.cpSync(path.join(__root, "node_modules"), path.join(__output, "node_modules"), { recursive: true })
  fs.rmSync(path.join(__root, "node_modules", ".bin"), { recursive: true, force: true })

  // Yarn creates symlinks in node_modules to the absolute paths of workspace packages
  // Copy the real packages from workspace and replace symlinks in node_modules
  for (const packageJson of glob.sync(path.join(__output, "node_modules", "**", "*", 'package.json'), { cwd: __root })) {
    try {
      let node_module = path.dirname(packageJson)
      let link = fs.readlinkSync(node_module)
      fs.rmSync(node_module)
      fs.cpSync(link, node_module, {recursive: true})
    } catch {}
  }

  // Create new package.json
  fs.writeFileSync( path.join(__output, "package.json"), JSON.stringify(newPackageJson, null, 2), 'utf8')

  // Recreate directory structure of atlaspack by creating symlinks to the underlying projects in node_modules
  for (const namespace of fs.readdirSync(path.join(__root, "packages"))) {
    if (namespace === "utils") continue
    if (fs.existsSync(path.join(__output, namespace))) fs.rmSync(path.join(__output, namespace), { recursive: true, force: true })
    fs.mkdirSync(path.join(__output, namespace))
    for (const packageName of fs.readdirSync(path.join(__root, "packages", namespace))) {

        let packageJson = path.join(__root, "packages", namespace, packageName, "package.json")
        if (!fs.existsSync(packageJson)) continue
        const { name } = JSON.parse(fs.readFileSync(packageJson, 'utf8'))
        // @ts-expect-error
        let nmPackageJson = nodeModule.findPackageJSON(name, path.join(__output, 'package.json'))
        if (!nmPackageJson) continue

        // Find relative path to node_module
        let nmPath = path.dirname(nmPackageJson)
        let nmPathRel = path.relative(path.join(__output, namespace), nmPath)

        // Create a relative symlink
        fs.symlinkSync(nmPathRel, path.join(__output, namespace, packageName))
    }
  }

  // Export core on the top level
  for (const packageName of fs.readdirSync(path.join(__output, "core"))) {
    if (packageName === "core") continue
    fs.symlinkSync(path.join(".", "core", packageName), path.join(__output, packageName))
  }
  fs.symlinkSync(path.join(".", "utils", "events"), path.join(__output, "events"))

  // Generate tarball of project
  execSync(`tar -cJvf ./${tarball} ./atlaspack-${process.platform}-${process.arch}`, {
    stdio: 'inherit'
  })
}()

