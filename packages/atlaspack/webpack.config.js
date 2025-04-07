const path = require('path');
const fs = require('fs');

if (fs.existsSync(path.join(__dirname, 'lib'))) {
  fs.rmSync(path.join(__dirname, 'lib'), {recursive: true});
}

fs.cpSync(
  path.join(__dirname, '../configs/default/index.json'),
  path.join(__dirname, './lib/config-default.json'),
);

const patchedExternals = {
  '@parcel/source-map': "require('#parcel/source-map')",
  '@parcel/watcher': "require('#parcel/watcher')",
  '@atlaspack/rust': "require('#atlaspack/rust')",
  '@swc/core': "require('#swc/core')",
  lightningcss: "require('#lightningcss')",
  noop: "require('#noop')",
};

const baseConfig = {
  mode: 'production',
  devtool: 'source-map',
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'lib'),
  },
  target: 'node',
  node: {
    global: true,
    __dirname: false,
  },
  plugins: [],
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.node'],
    mainFields: ['module', 'main'],
  },
  optimization: {
    minimize: false,
    nodeEnv: false,
  },
  externals: patchedExternals,
};

const config = [
  {
    ...structuredClone(baseConfig),
    entry: './cmd/atlaspack.js',
    output: {
      filename: 'bin.js',
      path: path.join(__dirname, 'lib', 'bin'),
    },
  },
  {
    ...structuredClone(baseConfig),
    entry: './cmd/atlaspack-rust.js',
    output: {
      filename: 'index.js',
      path: path.join(__dirname, 'lib', 'vendor', 'atlaspack-rust'),
      library: 'atlaspack-rust',
      libraryTarget: 'umd',
    },
    module: {
      rules: [
        {
          test: /\.node$/,
          loader: 'node-loader',
          options: {
            name: (filename) => path.basename(filename),
          },
        },
      ],
    },
    externals: {},
  },
  {
    ...structuredClone(baseConfig),
    entry: './cmd/parcel-source-map.js',
    output: {
      filename: 'index.js',
      path: path.join(__dirname, 'lib', 'vendor', 'parcel-source-map'),
      library: 'parcel-source-map',
      libraryTarget: 'umd',
    },
    module: {
      rules: [
        {
          test: /\.node$/,
          loader: 'node-loader',
          options: {
            name: (filename) => path.basename(filename),
          },
        },
      ],
    },
    externals: {},
  },
  {
    ...structuredClone(baseConfig),
    entry: './cmd/parcel-watcher.js',
    output: {
      filename: 'index.js',
      path: path.join(__dirname, 'lib', 'vendor', 'parcel-watcher'),
      library: 'parcel-watcher',
      libraryTarget: 'umd',
    },
    module: {
      rules: [
        {
          test: /\.node$/,
          loader: 'node-loader',
          options: {
            name: (filename) => `${path.basename(path.dirname(filename))}.node`,
          },
        },
      ],
    },
    externals: {
      '@parcel/watcher-linux-arm64-glibc': '#noop',
      '@parcel/watcher-linux-arm64-musl': '#noop',
      '@parcel/watcher-darwin-arm64': '#noop',
      '@parcel/watcher-darwin-x64': '#noop',
    },
  },
  {
    ...structuredClone(baseConfig),
    entry: './cmd/swc-core.js',
    output: {
      filename: 'index.js',
      path: path.join(__dirname, 'lib', 'vendor', 'swc-core'),
      library: 'swc-core',
      libraryTarget: 'umd',
    },
    module: {
      rules: [
        {
          test: /\.node$/,
          loader: 'node-loader',
          options: {
            name: (filename) => path.basename(filename),
          },
        },
      ],
    },
    externals: {
      '@swc/wasm': 'require("noop")',
    },
  },
  {
    ...structuredClone(baseConfig),
    entry: './cmd/lightning-css.js',
    output: {
      filename: 'index.js',
      path: path.join(__dirname, 'lib', 'vendor', 'lightning-css'),
      library: 'lightning-css',
      libraryTarget: 'umd',
    },
    module: {
      rules: [
        {
          test: /\.node$/,
          loader: 'node-loader',
          options: {
            name: (filename) => path.basename(filename),
          },
        },
      ],
    },
    externals: {
      '@swc/wasm': 'require("noop")',
    },
  },
];

const plugins = {
  bundlers: [['default', '../bundlers/default/lib/DefaultBundler.js']],
  transfomers: [
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
  namer: [['default', '../namers/default/lib/DefaultNamer.js']],

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
  reporters: [['dev-server', '../reporters/dev-server/lib/ServerReporter.js']],
};

for (const [kind, pluginList] of Object.entries(plugins)) {
  for (const [pluginName, srcPath] of pluginList) {
    config.push({
      ...structuredClone(baseConfig),
      entry: srcPath,
      output: {
        filename: 'index.js',
        path: path.join(__dirname, 'lib', kind, pluginName),
        library: pluginName,
        libraryTarget: 'umd',
      },
    });
  }
}

module.exports = config;
