const path = require('node:path');
const fs = require('node:fs');
const nodeModule = require('node:module');

if (fs.existsSync(path.join(__dirname, 'lib'))) {
  fs.rmSync(path.join(__dirname, 'lib'), {recursive: true});
}

// 'darwin' 'linux' 'win32'
const PLATFORM = process.env.ATLASPACK_PLATFORM || process.platform;
// 'arm64' 'x64'
const ARCH = process.env.ATLASPACK_ARCH || process.arch;

const vendoredExternals = {
  '@parcel/source-map': '#parcel/source-map',
  '@parcel/watcher': '#parcel/watcher',
  '@atlaspack/rust': '#atlaspack/rust',
  '@swc/core': '#swc/core',
  lmdb: '#lmdb',
  lightningcss: '#lightningcss',
  noop: '#noop',
};

const atlaspackExternals = {
  '@atlaspack/build-cache': '#atlaspack/build-cache',
  '@atlaspack/cache': '#atlaspack/cache',
  '@atlaspack/cli': '#atlaspack/cli',
  '@atlaspack/codeframe': '#atlaspack/codeframe',
  '@atlaspack/conditional-import-types': '#atlaspack/conditional-import-types',
  '@atlaspack/core': '#atlaspack/core',
  '@atlaspack/diagnostic': '#atlaspack/diagnostic',
  '@atlaspack/e2e-tests': '#atlaspack/e2e-tests',
  '@atlaspack/feature-flags': '#atlaspack/feature-flags',
  '@atlaspack/fs': '#atlaspack/fs',
  '@atlaspack/graph': '#atlaspack/graph',
  '@atlaspack/logger': '#atlaspack/logger',
  '@atlaspack/markdown-ansi': '#atlaspack/markdown-ansi',
  '@atlaspack/package-manager': '#atlaspack/package-manager',
  '@atlaspack/plugin': '#atlaspack/plugin',
  '@atlaspack/profiler': '#atlaspack/profiler',
  '@atlaspack/register': '#atlaspack/register',
  '@atlaspack/rust': '#atlaspack/rust',
  '@atlaspack/types': '#atlaspack/types',
  '@atlaspack/types-internal': '#atlaspack/types-internal',
  '@atlaspack/utils': '#atlaspack/utils',
  '@atlaspack/workers': '#atlaspack/workers',
};

const Rules = {
  ['.node']: (name = (filename) => path.basename(filename)) => ({
    test: /\.node$/,
    loader: 'node-loader',
    options: {name},
  }),
};

const withBaseConfig = (config) => {
  const {output, node, resolve, optimization, ...rest} = config;
  return {
    mode: 'production',
    devtool: 'source-map',
    output: {
      filename: 'index.js',
      path: path.join(__dirname, 'lib'),
      ...(output || {}),
    },
    target: 'node',
    node: {
      global: true,
      __dirname: false,
      ...(node || {}),
    },
    plugins: [],
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.node'],
      mainFields: ['module', 'main'],
      ...(resolve || {}),
    },
    optimization: {
      minimize: false,
      nodeEnv: false,
      ...(optimization || {}),
    },
    ...rest,
  };
};

const config = [
  withBaseConfig({
    entry: './src/noop/index.js',
    output: {
      path: path.join(__dirname, 'lib', 'noop'),
    },
  }),
];

// Vendor
config.push(
  withBaseConfig({
    entry: './src/parcel-source-map/index.js',
    output: {
      path: path.join(__dirname, 'lib', 'vendor', 'parcel-source-map'),
      library: 'parcel-source-map',
      libraryTarget: 'umd',
    },
    module: {
      rules: [Rules['.node']()],
    },
    externals: [
      ({request}, callback) => {
        if (!request.endsWith('.node')) return callback();
        if (request.includes(PLATFORM) && request.includes(ARCH))
          return callback();
        return callback(null, '#noop', 'commonjs2');
      },
    ],
  }),
);

config.push(
  withBaseConfig({
    entry: './src/parcel-watcher/index.js',
    output: {
      path: path.join(__dirname, 'lib', 'vendor', 'parcel-watcher'),
      library: 'parcel-watcher',
      libraryTarget: 'umd',
    },
    module: {
      rules: [
        Rules['.node'](
          (filename) => `${path.basename(path.dirname(filename))}.node`,
        ),
      ],
    },
    externals: [
      ({request}, callback) => {
        if (!request.startsWith('@parcel/watcher-')) return callback();
        if (request.includes(PLATFORM) && request.includes(ARCH))
          return callback();
        return callback(null, '#noop', 'commonjs2');
      },
    ],
  }),
);

config.push(
  withBaseConfig({
    entry: './src/swc-core/index.js',
    output: {
      // path: require.resolve('@swc/core'),
      path: path.join(__dirname, 'lib', 'vendor', 'swc-core'),
      library: 'swc-core',
      libraryTarget: 'umd',
    },
    module: {
      rules: [Rules['.node']()],
    },
    externals: [
      {'@swc/wasm': '#noop'},
      ({request}, callback) => {
        const variants = [
          '@swc/core-android-arm64',
          '@swc/core-android-arm-eabi',
          '@swc/core-win32-x64-msvc',
          '@swc/core-win32-ia32-msvc',
          '@swc/core-win32-arm64-msvc',
          '@swc/core-darwin-universal',
          '@swc/core-darwin-x64',
          '@swc/core-darwin-arm64',
          '@swc/core-freebsd-x64',
          '@swc/core-freebsd-arm64',
          './swc.linux-x64-musl.node',
          './swc.linux-x64-gnu.node',
          '@swc/core-linux-arm64-musl',
          '@swc/core-linux-arm64-gnu',
          '@swc/core-linux-arm-gnueabihf',
          '@swc/core-linux-riscv64-musl',
          '@swc/core-linux-riscv64-gnu',
          '@swc/core-linux-s390x-gnu',
          './swc.wasi.cjs',
          '@swc/core-wasm32-wasi',
        ];
        if (
          request.endsWith('.node') &&
          (!request.includes(PLATFORM) || !request.includes(ARCH))
        )
          return callback(null, '#noop', 'commonjs2');
        if (!variants.includes(request)) return callback();
        if (request.includes(PLATFORM) && request.includes(ARCH))
          return callback();
        return callback(null, '#noop', 'commonjs2');
      },
    ],
  }),
);

config.push(
  withBaseConfig({
    entry: './src/lightningcss/index.js',
    output: {
      path: path.join(__dirname, 'lib', 'vendor', 'lightning-css'),
      library: 'lightning-css',
      libraryTarget: 'umd',
    },
    module: {
      rules: [Rules['.node']()],
    },
    externals: [
      ({request}, callback) => {
        if (!request.startsWith('lightningcss-')) return callback();
        if (request.includes(PLATFORM) && request.includes(ARCH))
          return callback();
        return callback(null, '#noop', 'commonjs2');
      },
      ({request}, callback) => {
        if (!request.startsWith('lightningcss/')) return callback();
        const rootPath = path.dirname(
          nodeModule.findPackageJSON('lightningcss', __dirname),
        );
        const newRequest = path.join(rootPath, request);
        return callback(null, newRequest, 'commonjs2');
      },
    ],
  }),
);

// Hack to get lmdb vendored
const lmbd = nodeModule.findPackageJSON('lmdb', __dirname);
fs.mkdirSync(path.join(__dirname, 'lib', 'vendor', 'lmdb', 'prebuilds'), {
  recursive: true,
});
fs.cpSync(
  path.join(path.dirname(lmbd), 'dict'),
  path.join(__dirname, 'lib', 'vendor', 'lmdb', 'dict'),
  {recursive: true},
);
for (const dir of fs.readdirSync(
  path.join(path.dirname(path.dirname(lmbd)), '@lmdb'),
)) {
  if (
    dir.toLowerCase().includes(PLATFORM) &&
    dir.toLowerCase().includes(ARCH)
  ) {
    fs.cpSync(
      path.join(path.dirname(path.dirname(lmbd)), '@lmdb', dir),
      path.join(
        __dirname,
        'lib',
        'vendor',
        'lmdb',
        'prebuilds',
        dir.replace('lmdb-', ''),
      ),
      {recursive: true},
    );
  }
}

config.push(
  withBaseConfig({
    entry: path.join(path.dirname(lmbd), 'dist', 'index.cjs'),
    output: {
      path: path.join(__dirname, 'lib', 'vendor', 'lmdb'),
      library: 'lmdb',
      libraryTarget: 'umd',
    },
    module: {
      rules: [Rules['.node']()],
    },
  }),
);

// Core
const packages = [
  // ['cli', '../core/cli/lib/cli.js'],
  // ['conditional-import-types', '../core/conditional-import-types'],
  // ['types', '../core/types'],
  // ['types-internal', '../core/types-internal'],
  ['build-cache', '../core/build-cache/lib/index.js'],
  ['cache', '../core/cache/lib/index.js'],
  ['codeframe', '../core/codeframe/lib/codeframe.js'],
  ['core', '../core/core/lib/index.js'],
  [
    'core-worker',
    '../core/core/lib/worker.js',
    path.join(__dirname, 'lib', 'core', 'core'),
    'worker.js',
  ],
  [
    'core-worker-v3',
    '../core/core/lib/atlaspack-v3/worker/worker.js',
    path.join(__dirname, 'lib', 'core', 'core', 'worker'),
  ],
  ['diagnostic', '../core/diagnostic/lib/diagnostic.js'],
  ['feature-flags', '../core/feature-flags/lib/index.js'],
  ['fs', '../core/fs/lib/index.js'],
  ['graph', '../core/graph/lib/index.js'],
  ['logger', '../core/logger/lib/Logger.js'],
  ['markdown-ansi', '../core/markdown-ansi/lib/markdown-ansi.js'],
  ['package-manager', '../core/package-manager/lib/index.js'],
  ['plugin', '../core/plugin/lib/PluginAPI.js'],
  ['profiler', '../core/profiler/lib/index.js'],

  ['utils', '../core/utils/lib/index.js'],
  ['workers', '../core/workers/lib/index.js'],
  [
    'workers-threads',
    '../core/workers/lib/threads/ThreadsChild.js',
    path.join(__dirname, 'lib', 'core', 'workers'),
    'ThreadsChild.js',
  ],
  [
    'workers-process',
    '../core/workers/lib/process/ProcessChild.js',
    path.join(__dirname, 'lib', 'core', 'workers'),
    'ProcessChild.js',
  ],
];

for (const [packageName, packageSrc, outputPath, filename] of packages) {
  config.push(
    withBaseConfig({
      entry: packageSrc,
      output: {
        ...(filename ? {filename} : {}),
        path: outputPath
          ? outputPath
          : path.join(__dirname, 'lib', 'core', packageName),
        library: `atlaspack-${packageName}`,
        libraryTarget: 'umd',
      },
      externals: {
        ...vendoredExternals,
        ...atlaspackExternals,
      },
    }),
  );
}

config.push(
  withBaseConfig({
    entry: '../core/cli/lib/cli.js',
    output: {
      path: path.join(__dirname, 'lib', 'core', 'cli'),
      library: `atlaspack-cli`,
      libraryTarget: 'umd',
    },
    plugins: [
      {
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap('AfterEmitPlugin', () => {
            let content = fs.readFileSync(
              path.join(__dirname, 'lib', 'core', 'cli', 'index.js'),
              'utf8',
            );
            content = content.replaceAll(
              '@atlaspack/reporter-cli',
              '#atlaspack/reporter/cli',
            );
            content = content.replaceAll('@atlaspack/', '#atlaspack/');
            fs.writeFileSync(
              path.join(__dirname, 'lib', 'core', 'cli', 'index.js'),
              content,
              'utf8',
            );
          });
        },
      },
    ],
    externals: {
      ...vendoredExternals,
      ...atlaspackExternals,
    },
  }),
);

config.push(
  withBaseConfig({
    entry: '../core/rust/index.js',
    output: {
      path: path.join(__dirname, 'lib', 'core', 'rust'),
      library: 'atlaspack-rust',
      libraryTarget: 'umd',
    },
    module: {
      rules: [Rules['.node']()],
    },
    // externals: [
    //   ({request}, callback) => {
    //     if (request.startsWith('@atlaspack/rust-'))
    //       return callback(null, '#noop', 'commonjs2');
    //     if (!request.endsWith('.node')) return callback();
    //     if (request.includes(PLATFORM) && request.includes(ARCH))
    //       return callback();
    //     return callback(null, '#noop', 'commonjs2');
    //   },
    // ],
  }),
);

// Plugiins
const plugins = {
  bundlers: [['default', '../bundlers/default/lib/DefaultBundler.js']],
  transformers: [
    [
      'typescript-types',
      '../transformers/typescript-types/lib/TSTypesTransformer.js',
    ],
    [
      'inline-string',
      '../transformers/inline-string/lib/InlineStringTransformer.js',
    ],
    ['worklet', '../transformers/worklet/lib/WorkletTransformer.js'],
    ['js', '../transformers/js/lib/JSTransformer.js'],
    [
      'react-refresh-wrap',
      '../transformers/react-refresh-wrap/lib/ReactRefreshWrapTransformer.js',
    ],
    ['json', '../transformers/json/lib/JSONTransformer.js'],
    ['jsonld', '../transformers/jsonld/lib/JSONLDTransformer.js'],
    ['toml', '../transformers/toml/lib/TOMLTransformer.js'],
    [
      'webmanifest',
      '../transformers/webmanifest/lib/WebManifestTransformer.js',
    ],
    ['yaml', '../transformers/yaml/lib/YAMLTransformer.js'],
    ['glsl', '../transformers/glsl/lib/GLSLTransformer.js'],
    ['graphql', '../transformers/graphql/lib/GraphQLTransformer.js'],
    ['sass', '../transformers/sass/lib/SassTransformer.js'],
    ['postcss', '../transformers/postcss/lib/PostCSSTransformer.js'],
    ['css', '../transformers/css/lib/CSSTransformer.js'],
    ['posthtml', '../transformers/posthtml/lib/PostHTMLTransformer.js'],
    ['html', '../transformers/html/lib/HTMLTransformer.js'],
    ['pug', '../transformers/pug/lib/PugTransformer.js'],
    ['mdx', '../transformers/mdx/lib/MDXTransformer.js'],
    ['image', '../transformers/image/lib/ImageTransformer.js'],
    ['svg', '../transformers/svg/lib/SVGTransformer.js'],
    ['xml', '../transformers/xml/lib/XMLTransformer.js'],
    ['raw', '../transformers/raw/lib/RawTransformer.js'],
  ],
  namers: [['default', '../namers/default/lib/DefaultNamer.js']],
  runtimes: [
    ['js', '../runtimes/js/lib/JSRuntime.js'],
    ['browser-hmr', '../runtimes/hmr/lib/HMRRuntime.js'],
    ['react-refresh', '../runtimes/react-refresh/lib/ReactRefreshRuntime.js'],
    [
      'service-worker',
      '../runtimes/service-worker/lib/ServiceWorkerRuntime.js',
    ],
  ],
  optimizers: [
    ['data-url', '../optimizers/data-url/lib/DataURLOptimizer.js'],
    ['css', '../optimizers/css/lib/CSSOptimizer.js'],
    ['htmlnano', '../optimizers/htmlnano/lib/HTMLNanoOptimizer.js'],
    ['swc', '../optimizers/swc/lib/SwcOptimizer.js'],
    ['svgo', '../optimizers/svgo/lib/SVGOOptimizer.js'],
    ['image', '../optimizers/image/lib/ImageOptimizer.js'],
  ],
  packagers: [
    ['html', '../packagers/html/lib/HTMLPackager.js'],
    ['css', '../packagers/css/lib/CSSPackager.js'],
    ['js', '../packagers/js/lib/index.js'],
    ['svg', '../packagers/svg/lib/SVGPackager.js'],
    ['xml', '../packagers/xml/lib/XMLPackager.js'],
    ['ts', '../packagers/ts/lib/TSPackager.js'],
    ['wasm', '../packagers/wasm/lib/WasmPackager.js'],
    ['raw-url', '../packagers/raw-url/lib/RawUrlPackager.js'],
    ['raw', '../packagers/raw/lib/RawPackager.js'],
  ],
  compressors: [['raw', '../compressors/raw/lib/RawCompressor.js']],
  resolvers: [['default', '../resolvers/default/lib/DefaultResolver.js']],
  reporters: [
    ['dev-server', '../reporters/dev-server/lib/ServerReporter.js'],
    ['cli', '../reporters/cli/lib/CLIReporter.js'],
  ],
};

for (const [kind, pluginList] of Object.entries(plugins)) {
  for (const [pluginName, srcPath] of pluginList) {
    config.push(
      withBaseConfig({
        entry: srcPath,
        output: {
          path: path.join(__dirname, 'lib', kind, pluginName),
          library: pluginName,
          libraryTarget: 'umd',
        },
        externals: {
          ...vendoredExternals,
          ...atlaspackExternals,
        },
      }),
    );
  }
}
fs.cpSync(
  path.join(__dirname, '../reporters/dev-server/src/templates'),
  path.join(__dirname, 'lib', 'reporters', 'src', 'templates'),
  {
    recursive: true,
  },
);
fs.cpSync(
  path.join(__dirname, '../packagers/js/lib/dev-prelude.js'),
  path.join(__dirname, './lib/packagers/js/dev-prelude.js'),
  {
    recursive: true,
  },
);
fs.cpSync(
  path.join(__dirname, '../runtimes/hmr/lib/loaders'),
  path.join(__dirname, './lib/runtimes/browser-hmr/loaders'),
  {
    recursive: true,
  },
);

// Configs
fs.mkdirSync(path.join(__dirname, 'lib', 'configs', 'default'), {
  recursive: true,
});
fs.cpSync(
  path.join(__dirname, 'src', 'config-default', 'index.json'),
  path.join(__dirname, 'lib', 'configs', 'default', 'index.json'),
);

module.exports = config;
