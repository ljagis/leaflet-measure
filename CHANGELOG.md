leaflet-measure Changelog
=========================

## 3.1.0 (2018-04-08)

* adds new languages cz, hu, ro, sk, and sl

## 3.0.3 (2018-02-19)

* fixes error caused by canvas renderer:w

## 3.0.0 (2018-02-14)

* Updated build from Grunt/Browserify to [Webpack](https://webpack.js.org/)
* Moves from jshint/jscs to [ESLint](https://eslint.org/)
* Reduced the number of external dependencies to get build down to under 40KB
* Now using better maintained [Turf.js](http://turfjs.org/) instead of [geocrunch](https://github.com/brandoncopeland/geocrunch) for distance and area calculations.
* Updates styles to better match the styles applied to `.leaflet-bar`. Previous styles were based on the Leaflet layer control.
