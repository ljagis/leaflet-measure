# leaflet-measure

Coordinate, linear, and area measure control for [Leaflet](http://leafletjs.com) maps. Extends [L.Control](http://leafletjs.com/reference.html#control).

<hr>

[Demo](http://ljagis.github.io/leaflet-measure)

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

### activeColor

`{ activeColor: '#ABE67E' }`

Base color to use for map features rendered while actively performing a measurement. Value should be a color represented as a hexadecimal string.

### completedColor

`{ completedColor: #C8F2BE }`

Base color to use for features generated from a completed measurement. Value should be a color represented as a hexadecimal string.

### popupOptions

`popupOptions: { className: 'leaflet-measure-resultpopup', autoPanPadding: [10, 10] }`

Options applied to the popup of the resulting measure feature. Properties may be any standard Leaflet [popup options](http://leafletjs.com/reference.html#popup-options).

<hr>

## Customizing map feature styles

Map features may be styled using CSS SVG style attributes. Features generated from `leaflet-measure` measurements are given the following class names:

- **layer-measurecollector**: Transparent layer covering full map and catching click and drag events

- **layer-measurearea**: Feature displaying area of an active measurement

- **layer-measureboundary**: Feature displaying the linear path of an active measurement

- **layer-measurevertex**: Feature added at each vertex (measurement click) of an active measurement

- **layer-measuredrag**: Symbol following cursor while moving during an active measurement

- **layer-measure-resultarea**: Feature added to the map as a permanent layer resulting from an area (3+ points) measurement

- **layer-measure-resultline**: Feature added to the map as a permanent layer resulting from a linear (2 point) measurement

- **layer-measure-resultpoint**: Featured added to the map as a permanent layer resulting from a point (single click) measurement
