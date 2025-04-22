const child_process = require('node:child_process');
const process = require('node:process');

const PROFILE = process.env.CARGO_PROFILE;
const TARGET = process.env.RUSTUP_TARGET;
const command = [];

const defaultTarget = {
  'linux-x64': 'x86_64-unknown-linux-gnu',
  'linux-arm64': 'aarch64-unknown-linux-gnu',
  'darwin-x64': 'x86_64-apple-darwin',
  'darwin-arm64': 'aarch64-apple-darwin',
  'win32-x64': 'x86_64-pc-windows-msvc',
  'win32-arm64': 'aarch64-pc-windows-msvc',
}[`${process.platform}-${process.arch}`];

const rustTarget = TARGET || defaultTarget;

if (TARGET === 'wasm32-unknown-unknown') {
  // Not supported
} else {
  command.push('npx', 'napi', 'build', '--target', rustTarget);
}

if (PROFILE && PROFILE !== 'debug') {
  command.push('--profile', PROFILE);
}

command.push('--cargo-cwd', '../../../crates/node-bindings')

// eslint-disable-next-line no-console
console.log(command.join(' '))
child_process.execSync(command.join(' '), {stdio: 'inherit', cwd: __dirname});
