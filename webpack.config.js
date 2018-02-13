const resolve = require('path').resolve;

const CopyPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const I18nPlugin = require('i18n-webpack-plugin');

const BUILD_DIR = resolve(__dirname, 'dist');

const copyAssets = new CopyPlugin([{ from: './assets', to: 'assets', ignore: '*.svg' }]);

const extractSass = new ExtractTextPlugin({
  filename: 'leaflet-measure.css'
});

const languages = { en: require('./languages/en.json'), es: require('./languages/es.json') }; // TODO. loop all files instead

module.exports = Object.keys(languages).map(language => {
  return {
    entry: ['./src/leaflet-measure.js', './scss/leaflet-measure.scss'],
    output: {
      filename: `${language}.leaflet-measure.js`, // TODO. add default en `leaflet-measure.js`
      path: BUILD_DIR,
      publicPath: '/dist/'
    },
    module: {
      rules: [
        {
          test: /\.html$/,
          use: { loader: 'html-loader' }
        },
        {
          test: /\.scss$/,
          use: extractSass.extract({
            use: [
              {
                loader: 'css-loader',
                options: { url: false }
              },
              {
                loader: 'sass-loader'
              }
            ],
            fallback: 'style-loader'
          })
        }
      ]
    },
    plugins: [copyAssets, extractSass, new I18nPlugin(languages[language])],
    devtool: 'eval-source-map'
  };
});
