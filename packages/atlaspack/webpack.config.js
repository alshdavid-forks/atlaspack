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
      path: path.join(__dirname, 'lib'),
    },
  },
  {
    ...structuredClone(baseConfig),
    entry: './cmd/atlaspack-rust.js',
    output: {
      filename: 'index.js',
      path: path.join(__dirname, 'lib', 'atlaspack-rust'),
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
  },
  {
    ...structuredClone(baseConfig),
    entry: './cmd/parcel-source-map.js',
    output: {
      filename: 'index.js',
      path: path.join(__dirname, 'lib', 'parcel-source-map'),
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
  },
  {
    ...structuredClone(baseConfig),
    entry: './cmd/parcel-watcher.js',
    output: {
      filename: 'index.js',
      path: path.join(__dirname, 'lib', 'parcel-watcher'),
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
      path: path.join(__dirname, 'lib', 'swc-core'),
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
      path: path.join(__dirname, 'lib', 'lightning-css'),
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

const plugins = [
  ['bundler-default', '../bundlers/default/lib/DefaultBundler.js'],
  [
    'transformer-typescript-types',
    '../transformers/typescript-types/lib/TSTypesTransformer.js',
  ],
  [
    'transformer-inline-string',
    '../transformers/inline-string/lib/InlineStringTransformer.js',
  ],
  ['transformer-worklet', '../transformers/worklet/lib/WorkletTransformer.js'],
  ['transformer-js', '../transformers/js/lib/JSTransformer.js'],
  [
    'transformer-react-refresh-wrap',
    '../transformers/react-refresh-wrap/lib/ReactRefreshWrapTransformer.js',
  ],
  ['transformer-json', '../transformers/json/lib/JSONTransformer.js'],
  ['transformer-jsonld', '../transformers/jsonld/lib/JSONLDTransformer.js'],
  ['transformer-toml', '../transformers/toml/lib/TOMLTransformer.js'],
  [
    'transformer-webmanifest',
    '../transformers/webmanifest/lib/WebManifestTransformer.js',
  ],
  ['transformer-yaml', '../transformers/yaml/lib/YAMLTransformer.js'],
  ['transformer-glsl', '../transformers/glsl/lib/GLSLTransformer.js'],
  ['transformer-graphql', '../transformers/graphql/lib/GraphQLTransformer.js'],
  ['transformer-sass', '../transformers/sass/lib/SassTransformer.js'],
  ['transformer-postcss', '../transformers/postcss/lib/PostCSSTransformer.js'],
  ['transformer-css', '../transformers/css/lib/CSSTransformer.js'],
  [
    'transformer-posthtml',
    '../transformers/posthtml/lib/PostHTMLTransformer.js',
  ],
  ['transformer-html', '../transformers/html/lib/HTMLTransformer.js'],
  ['transformer-pug', '../transformers/pug/lib/PugTransformer.js'],
  ['transformer-mdx', '../transformers/mdx/lib/MDXTransformer.js'],
  ['transformer-image', '../transformers/image/lib/ImageTransformer.js'],
  ['transformer-svg', '../transformers/svg/lib/SVGTransformer.js'],
  ['transformer-xml', '../transformers/xml/lib/XMLTransformer.js'],
  ['transformer-raw', '../transformers/raw/lib/RawTransformer.js'],
  ['namer-postcss', '../namers/default/lib/DefaultNamer.js'],
  ['runtime-js', '../runtimes/js/lib/JSRuntime.js'],
  ['runtime-browser-hmr', '../runtimes/hmr/lib/HMRRuntime.js'],
  [
    'runtime-react-refresh',
    '../runtimes/react-refresh/lib/ReactRefreshRuntime.js',
  ],
  [
    'runtime-service-worker',
    '../runtimes/service-worker/lib/ServiceWorkerRuntime.js',
  ],
  ['optimizer-data-url', '../optimizers/data-url/lib/DataURLOptimizer.js'],
  ['optimizer-css', '../optimizers/css/lib/CSSOptimizer.js'],
  ['optimizer-htmlnano', '../optimizers/htmlnano/lib/HTMLNanoOptimizer.js'],
  ['optimizer-swc', '../optimizers/swc/lib/SwcOptimizer.js'],
  ['optimizer-svgo', '../optimizers/svgo/lib/SVGOOptimizer.js'],
  ['optimizer-image', '../optimizers/image/lib/ImageOptimizer.js'],
  ['packager-html', '../packagers/html/lib/HTMLPackager.js'],
  ['packager-css', '../packagers/css/lib/CSSPackager.js'],
  ['packager-js', '../packagers/js/lib/index.js'],
  ['packager-svg', '../packagers/svg/lib/SVGPackager.js'],
  ['packager-xml', '../packagers/xml/lib/XMLPackager.js'],
  ['packager-ts', '../packagers/ts/lib/TSPackager.js'],
  ['packager-wasm', '../packagers/wasm/lib/WasmPackager.js'],
  ['packager-raw-url', '../packagers/raw-url/lib/RawUrlPackager.js'],
  ['packager-raw', '../packagers/raw/lib/RawPackager.js'],
  ['compressor-raw', '../compressors/raw/lib/RawCompressor.js'],
  ['resolver-default', '../resolvers/default/lib/DefaultResolver.js'],
  ['reporter-dev-server', '../reporters/dev-server/lib/ServerReporter.js'],
];

// for (const [pluginName, srcPath] of plugins) {
//   config.push({
//     ...structuredClone(baseConfig),
//     entry: srcPath,
//     output: {
//       filename: 'index.js',
//       path:  path.join(__dirname, 'lib', pluginName),
//       library: pluginName,
//       libraryTarget: 'umd',
//     },
//   })
// }

module.exports = config;
