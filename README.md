# leaflet-measure

Coordinate, linear, and area measure control for [Leaflet](http://leafletjs.com) maps. Extends [L.Control](http://leafletjs.com/reference.html#control).

<hr>

## [Demo](http://ljagis.github.io/leaflet-measure)

[![Demo](https://raw.githubusercontent.com/ljagis/leaflet-measure/master/example/leaflet-measure-demo.jpg)](http://ljagis.github.io/leaflet-measure)

<hr>

## Install Options

- Clone.. `git clone https://github.com/ljagis/leaflet-measure.git`

- Install with [Bower](http://bower.io/).. `bower install leaflet-measure`

- Install with [npm](https://www.npmjs.com/).. `npm install leaflet-measure`

## Use bundled `leaflet-measure.min.js` or `leaflet-measure.js`

Include the [Leaflet Source](http://cdn.leafletjs.com/leaflet-0.7.3/leaflet.js), `leaflet-measure.min.js`, and associated CSS stylesheets in your HTML page

```html
<!doctype HTML>
<html>
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet-0.7.3/leaflet.css">
  <link rel="stylesheet" href="leaflet-measure.css">
</head>
<body>
  <script src="http://cdn.leafletjs.com/leaflet-0.7.3/leaflet.js"></script>
  <script src="leaflet-measure.min.js"></script>
  <script>
    // Start creating maps
  </script>
</body>
</html>
```

## Use with [npm](https://www.npmjs.com/)

```javascript
var L = require('leaflet');
require('leaflet-measure');

// Start creating maps
```

<hr>

## Add control to a Leaflet map

`leaflet-measure` adds `L.Control.Measure`. This control may be used with the standard Leaflet control workflows [described in the Leaflet docs](http://leafletjs.com/reference.html#control).

The measure control can be instantiated directly and added to a map:
```javascript
var myMap = L.map('mapElementId', options);
var measureControl = new L.Control.Measure(options);
measureControl.addTo(myMap);
```

or instantiated via the factory:
```javascript
var myMap = L.map('mapElementId', options);
var measureControl = L.control.measure(options);
measureControl.addTo(myMap);
```

or added to a map using map options:
```javascript
var myMap = L.map('mapElementId', {
  measureControl: true
});
```

<hr>

## Control options

### position

`{ position: 'topright' }`

Standard Leaflet control [position options](http://leafletjs.com/reference.html#control-positions)

### primaryLengthUnit | secondaryLengthUnit

`{ primaryLengthUnit: 'feet', secondaryLengthUnit: 'miles' }`

Units used to display length results. `secondaryLengthUnit` is optional.

Valid values are `feet`, `meters`, `miles`, and `kilometers`

### primaryAreaUnit | secondaryAreaUnit

`{ primaryAreaUnit: 'acres', secondaryAreaUnit: undefined }`

Units used to display area results. `secondaryAreaUnit` is optional.

Valid values are `acres`, `hectares`, `sqfeet`, `sqmeters`, and `sqmiles`

### activeColor

`{ activeColor: '#ABE67E' }`

Base color to use for map features rendered while actively performing a measurement. Value should be a color represented as a hexadecimal string.

### completedColor

`{ completedColor: '#C8F2BE' }`

Base color to use for features generated from a completed measurement. Value should be a color represented as a hexadecimal string.

### popupOptions

`popupOptions: { className: 'leaflet-measure-resultpopup', autoPanPadding: [10, 10] }`

Options applied to the popup of the resulting measure feature. Properties may be any standard Leaflet [popup options](http://leafletjs.com/reference.html#popup-options).

### units

Custom units to make available to the measurement calculator. Packaged units are `feet`, `meters`, `miles`, and `kilometers` for length and `acres`, `hectares`, `sqfeet`, `sqmeters`, and `sqmiles` for areas. Additional unit definitions can be added to the packaged units using this option.

Define units as

```javascript
{
  someNewUnit: {
    factor: 0.001, // Required. Factor to apply when converting to this unit. Length in meters or area in sq meters will be multiplied by this factor.
    display: 'My New Unit', // Required. How to display in results, like.. "300 Meters (0.3 My New Unit)".
    decimals: 2 // Number of decimals to round results when using this unit. `0` is the default value if not specified.
  },
  myOtherNewUnit: {
    factor: 1234,
    display: 'My Other Unit',
    decimals: 0
  }
}
```

### captureZIndex

`{ captureZIndex: 10000 }`

Z-index of the marker used to capture measure clicks. Set this value higher than the z-index of all other map layers to disable click events on other layers while a measurement is active.

### localization

`{ localization: 'en' }`

Locale to translate displayed text.

Available locales include `en` (default), `ca`, `cn`, `da`, `de`, `de_CH`, `en_UK`, `es`, `fa`, `fil_PH`, `fr`, `it`, `nl`, `pl`, `pt_BR`, `pt_PT`, `ru` and `tr`.

### decPoint | thousandsSep

`{ decPoint: '.', thousandsSep: ',' }`

Decimal point and thousands separator used when displaying measurements. If not specified, values are defined by the localization.

<hr>

## Events

You can subscribe to the following events on the [Map](http://leafletjs.com/reference.html#map-class) using [these methods](http://leafletjs.com/reference.html#events)

### measurestart

Fired when measurement starts

### measurefinish

Fired when measurement finishes with results of the measurement. Results data includes:

- `area`: Area of a polygon measurement in sq meters. 0 for measurements with less than 3 points.

- `areaDisplay`: Area formatted as displayed in the popup.

- `lastCoord`: Last point clicked in both decimal degrees and degress/min/seconds.

- `length`: Length of the measurement in meters. 0 for measurements with less than 2 points.

- `lengthDisplay`: Length formatted as displayed in the popup.

- `pointCount`: Number of points directly added by the user.

- `points`: Array of points as [`LatLng`](http://leafletjs.com/reference.html#latlng) used to calculate the measurement. Number of items in the array may differ from `pointCoint` because an additional point is added to close polygons during polygon measurements.

<hr>

## Customizing map feature styles

Map features may be styled using CSS SVG style attributes. Features generated from `leaflet-measure` measurements are given the following class names:

- **layer-measurearea**: Feature displaying area of an active measurement

- **layer-measureboundary**: Feature displaying the linear path of an active measurement

- **layer-measurevertex**: Feature added at each vertex (measurement click) of an active measurement

- **layer-measuredrag**: Symbol following cursor while moving during an active measurement

- **layer-measure-resultarea**: Feature added to the map as a permanent layer resulting from an area (3+ points) measurement

- **layer-measure-resultline**: Feature added to the map as a permanent layer resulting from a linear (2 point) measurement

- **layer-measure-resultpoint**: Featured added to the map as a permanent layer resulting from a point (single click) measurement
