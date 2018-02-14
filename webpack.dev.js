const resolve = require('path').resolve;

const CopyPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const I18nPlugin = require('i18n-webpack-plugin');

const BUILD_DIR = resolve(__dirname, 'dist');

const copyAssets = new CopyPlugin([{ from: './assets', to: 'assets', ignore: '*.svg' }]);
const copySite = new CopyPlugin([{ from: './example', to: './' }]);

const extractSass = new ExtractTextPlugin({ filename: 'leaflet-measure.css' });

const htmlLoader = {
  test: /\.html$/,
  use: { loader: 'html-loader?interpolate' }
};

const scssLoader = {
  test: /\.scss$/,
  use: extractSass.extract({
    use: [
      {
        loader: 'css-loader',
        options: { sourceMap: true, url: false }
      },
      {
        loader: 'sass-loader',
        options: { sourceMap: true }
      }
    ],
    fallback: 'style-loader'
  })
};

const devLanguage = require('./languages/en.json');

module.exports = {
  entry: ['./src/leaflet-measure.js'],
  output: {
    filename: 'leaflet-measure.js',
    path: BUILD_DIR
  },
  devServer: {
    contentBase: BUILD_DIR
  },
  module: {
    rules: [htmlLoader, scssLoader]
  },
  plugins: [copySite, copyAssets, extractSass, new I18nPlugin(devLanguage)],
  devtool: 'eval-source-map'
};
