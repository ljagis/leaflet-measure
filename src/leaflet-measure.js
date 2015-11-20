// leaflet-measure.js

var _ = require('underscore');
var L = require('leaflet');
var humanize = require('humanize');

var units = require('./units');
var calc = require('./calc');
var dom = require('./dom');
var $ = dom.$;

var Symbology = require('./mapsymbology');

var fs = require('fs');
var controlTemplate = _.template(fs.readFileSync(__dirname + '/leaflet-measure-template.html', 'utf8'));
var resultsTemplate = _.template(fs.readFileSync(__dirname + '/leaflet-measure-template-results.html', 'utf8'));
var pointPopupTemplate = _.template(fs.readFileSync(__dirname + '/popuptemplates/point-popuptemplate.html', 'utf8'));
var linePopupTemplate = _.template(fs.readFileSync(__dirname + '/popuptemplates/line-popuptemplate.html', 'utf8'));
var areaPopupTemplate = _.template(fs.readFileSync(__dirname + '/popuptemplates/area-popuptemplate.html', 'utf8'));

L.Control.Measure = L.Control.extend({
  _className: 'leaflet-control-measure',
  options: {
    units: {},
    position: 'topright',
    primaryLengthUnit: 'feet',
    secondaryLengthUnit: 'miles',
    primaryAreaUnit: 'acres',
    activeColor: '#ABE67E',     // base color for map features while actively measuring
    completedColor: '#C8F2BE',  // base color for permenant features generated from completed measure
    popupOptions: {             // standard leaflet popup options http://leafletjs.com/reference.html#popup-options
      className: 'leaflet-measure-resultpopup',
      autoPanPadding: [10, 10]
    }
  },
  initialize: function (options) {
    L.setOptions(this, options);
    this.options.units = L.extend({}, units, this.options.units);
    this._symbols = new Symbology(_.pick(this.options, 'activeColor', 'completedColor'));
  },
  onAdd: function (map) {
    this._map = map;
    this._latlngs = [];
    this._initLayout();
    map.on('click', this._collapse, this);
    this._layer = L.layerGroup().addTo(map);
    return this._container;
  },
  onRemove: function (map) {
    map.off('click', this._collapse, this);
    map.removeLayer(this._layer);
  },
  _initLayout: function () {
    var className = this._className, container = this._container = L.DomUtil.create('div', className);
    var $toggle, $start, $cancel, $finish;

    container.innerHTML = controlTemplate({
      model: {
        className: className
      }
    });

    // copied from leaflet
    // https://bitbucket.org/ljagis/js-mapbootstrap/src/4ab1e9e896c08bdbc8164d4053b2f945143f4f3a/app/components/measure/leaflet-measure-control.js?at=master#cl-30
    container.setAttribute('aria-haspopup', true);
    if (!L.Browser.touch) {
      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
    } else {
      L.DomEvent.on(container, 'click', L.DomEvent.stopPropagation);
    }

    $toggle = this.$toggle = $('.js-toggle', container);         // collapsed content
    this.$interaction = $('.js-interaction', container);         // expanded content
    $start = $('.js-start', container);                          // start button
    $cancel = $('.js-cancel', container);                        // cancel button
    $finish = $('.js-finish', container);                        // finish button
    this.$startPrompt = $('.js-startprompt', container);         // full area with button to start measurment
    this.$measuringPrompt = $('.js-measuringprompt', container); // full area with all stuff for active measurement
    this.$startHelp = $('.js-starthelp', container);             // "Start creating a measurement by adding points"
    this.$results = $('.js-results', container);                 // div with coordinate, linear, area results
    this.$measureTasks = $('.js-measuretasks', container);       // active measure buttons container

    this._collapse();
    this._updateMeasureNotStarted();

    if (!L.Browser.android) {
      L.DomEvent.on(container, 'mouseenter', this._expand, this);
      L.DomEvent.on(container, 'mouseleave', this._collapse, this);
    }
    L.DomEvent.on($toggle, 'click', L.DomEvent.stop);
    if (L.Browser.touch) {
      L.DomEvent.on($toggle, 'click', this._expand, this);
    } else {
      L.DomEvent.on($toggle, 'focus', this._expand, this);
    }
    L.DomEvent.on($start, 'click', L.DomEvent.stop);
    L.DomEvent.on($start, 'click', this._startMeasure, this);
    L.DomEvent.on($cancel, 'click', L.DomEvent.stop);
    L.DomEvent.on($cancel, 'click', this._finishMeasure, this);
    L.DomEvent.on($finish, 'click', L.DomEvent.stop);
    L.DomEvent.on($finish, 'click', this._handleMeasureDoubleClick, this);
  },
  _expand: function () {
    dom.hide(this.$toggle);
    dom.show(this.$interaction);
  },
  _collapse: function () {
    if (!this._locked) {
      dom.hide(this.$interaction);
      dom.show(this.$toggle);
    }
  },
  // move between basic states:
  // measure not started, started/in progress but no points added, in progress and with points
  _updateMeasureNotStarted: function () {
    dom.hide(this.$startHelp);
    dom.hide(this.$results);
    dom.hide(this.$measureTasks);
    dom.hide(this.$measuringPrompt);
    dom.show(this.$startPrompt);
  },
  _updateMeasureStartedNoPoints: function () {
    dom.hide(this.$results);
    dom.show(this.$startHelp);
    dom.show(this.$measureTasks);
    dom.hide(this.$startPrompt);
    dom.show(this.$measuringPrompt);
  },
  _updateMeasureStartedWithPoints: function () {
    dom.hide(this.$startHelp);
    dom.show(this.$results);
    dom.show(this.$measureTasks);
    dom.hide(this.$startPrompt);
    dom.show(this.$measuringPrompt);
  },
  // get state vars and interface ready for measure
  _startMeasure: function () {
    this._locked = true;

    this._map.doubleClickZoom.disable(); // double click now finishes measure
    this._map.on('mouseout', this._handleMapMouseOut, this);

    L.DomEvent.on(this._container, 'mouseenter', this._handleMapMouseOut, this);

    this._map.on('mousemove', this._handleMeasureMove, this);
    this._map.on('dblclick', this._handleMeasureDoubleClick, this);
    this._map.on('click', this._handleMeasureClick, this);

    this._measureVertexes = L.featureGroup().addTo(this._layer);

    this._updateMeasureStartedNoPoints();
  },
  // return to state with no measure in progress, undo `this._startMeasure`
  _finishMeasure: function () {
    this._locked = false;

    this._map.doubleClickZoom.enable();
    this._map.off('mouseout', this._handleMapMouseOut, this);

    L.DomEvent.off(this._container, 'mouseover', this._handleMapMouseOut, this);

    this._clearMeasure();

    this._map.off('mousemove', this._handleMeasureMove, this);
    this._map.off('dblclick', this._handleMeasureDoubleClick, this);
    this._map.off('click', this._handleMeasureClick, this);

    this._layer.removeLayer(this._measureVertexes);
    this._measureVertexes = null;

    this._updateMeasureNotStarted();
    this._collapse();
  },
  // clear all running measure data
  _clearMeasure: function () {
    this._latlngs = [];
    this._measureVertexes.clearLayers();
    if (this._measureDrag) {
      this._layer.removeLayer(this._measureDrag);
    }
    if (this._measureArea) {
      this._layer.removeLayer(this._measureArea);
    }
    if (this._measureBoundary) {
      this._layer.removeLayer(this._measureBoundary);
    }
    this._measureDrag = null;
    this._measureArea = null;
    this._measureBoundary = null;
  },
  // format measurements to nice display string based on units in options. `{ lengthDisplay: '100 Feet (0.02 Miles)', areaDisplay: ... }`
  _getMeasurementDisplayStrings: function (measurement) {
    var unitDefinitions = this.options.units;

    return {
      lengthDisplay: buildDisplay(measurement.length, this.options.primaryLengthUnit, this.options.secondaryLengthUnit),
      areaDisplay: buildDisplay(measurement.area, this.options.primaryAreaUnit, this.options.secondaryAreaUnit)
    };

    function buildDisplay (val, primaryUnit, secondaryUnit) {
      var display;
      if (primaryUnit && unitDefinitions[primaryUnit]) {
        display = formatMeasure(val, unitDefinitions[primaryUnit]);
        if (secondaryUnit && unitDefinitions[secondaryUnit]) {
          display = display + ' (' +  formatMeasure(val, unitDefinitions[secondaryUnit]) + ')';
        }
      } else {
        display = formatMeasure(val);
      }
      return display;
    }

    function formatMeasure (val, unit) {
      return unit && unit.factor && unit.display ?
        humanize.numberFormat(val * unit.factor, unit.decimals || 0) + ' ' + unit.display :
        humanize.numberFormat(val, 0);
    }
  },
  // update results area of dom with calced measure from `this._latlngs`
  _updateResults: function () {
    var calced = calc.measure(this._latlngs);
    this.$results.innerHTML = resultsTemplate({
      model: _.extend({}, calced, this._getMeasurementDisplayStrings(calced), {
        pointCount: this._latlngs.length
      }),
      humanize: humanize
    });
  },
  // mouse move handler while measure in progress
  // adds floating measure marker under cursor
  _handleMeasureMove: function (evt) {
    if (!this._measureDrag) {
      this._measureDrag = L.circleMarker(evt.latlng, this._symbols.getSymbol('measureDrag')).addTo(this._layer);
    } else {
      this._measureDrag.setLatLng(evt.latlng);
    }
    this._measureDrag.bringToFront();
  },
  // handler for both double click and clicking finish button
  // do final calc and finish out current measure, clear dom and internal state, add permanent map features
  _handleMeasureDoubleClick: function () {
    var latlngs = this._latlngs, calced, resultFeature, popupContainer, popupContent, zoomLink, deleteLink;

    this._finishMeasure();

    if (!latlngs.length) {
      return;
    }

    if (latlngs.length > 2) {
      latlngs.push(_.first(latlngs)); // close path to get full perimeter measurement for areas
    }

    calced = calc.measure(latlngs);

    if (latlngs.length === 1) {
      resultFeature = L.circleMarker(latlngs[0], this._symbols.getSymbol('resultPoint'));
      popupContent = pointPopupTemplate({
        model: calced,
        humanize: humanize
      });
    } else if (latlngs.length === 2) {
      resultFeature = L.polyline(latlngs, this._symbols.getSymbol('resultLine')).addTo(this._map);
      popupContent = linePopupTemplate({
        model: _.extend({}, calced, this._getMeasurementDisplayStrings(calced)),
        humanize: humanize
      });
    } else {
      resultFeature = L.polygon(latlngs, this._symbols.getSymbol('resultArea'));
      popupContent = areaPopupTemplate({
        model: _.extend({}, calced, this._getMeasurementDisplayStrings(calced)),
        humanize: humanize,
        units: this._units
      });
    }

    popupContainer = L.DomUtil.create('div', '');
    popupContainer.innerHTML = popupContent;

    zoomLink = $('.js-zoomto', popupContainer);
    if (zoomLink) {
      L.DomEvent.on(zoomLink, 'click', L.DomEvent.stop);
      L.DomEvent.on(zoomLink, 'click', function () {
        this._map.fitBounds(resultFeature.getBounds(), {
          padding: [20, 20],
          maxZoom: 17
        });
      }, this);
    }

    deleteLink = $('.js-deletemarkup', popupContainer);
    if (deleteLink) {
      L.DomEvent.on(deleteLink, 'click', L.DomEvent.stop);
      L.DomEvent.on(deleteLink, 'click', function () {
        // TODO. maybe remove any event handlers on zoom and delete buttons?
        this._map.removeLayer(resultFeature);
      }, this);
    }

    resultFeature.addTo(this._map);
    resultFeature.bindPopup(popupContainer, this.options.popupOptions);
    resultFeature.openPopup(resultFeature.getBounds().getCenter());
  },
  // handle map click during ongoing measurement
  // add new clicked point, update measure layers and results ui
  _handleMeasureClick: function (evt) {
    var latlng = evt.latlng, lastClick = _.last(this._latlngs), vertexSymbol = this._symbols.getSymbol('measureVertex');

    if (!lastClick || !latlng.equals(lastClick)) { // skip if same point as last click, happens on `dblclick`
      this._latlngs.push(latlng);
      this._addMeasureArea(this._latlngs);
      this._addMeasureBoundary(this._latlngs);

      this._measureVertexes.eachLayer(function (layer) {
        layer.setStyle(vertexSymbol);
        // reset all vertexes to non-active class - only last vertex is active
        // `layer.setStyle({ className: 'layer-measurevertex'})` doesn't work. https://github.com/leaflet/leaflet/issues/2662
        // set attribute on path directly
        layer._path.setAttribute('class', vertexSymbol.className);
      });

      this._addNewVertex(latlng);

      if (this._measureBoundary) {
        this._measureBoundary.bringToFront();
      }
      this._measureVertexes.bringToFront();
    }

    this._updateResults();
    this._updateMeasureStartedWithPoints();
  },
  // handle map mouse out during ongoing measure
  // remove floating cursor vertex from map
  _handleMapMouseOut: function () {
    if (this._measureDrag) {
      this._layer.removeLayer(this._measureDrag);
      this._measureDrag = null;
    }
  },
  // add various measure graphics to map - vertex, area, boundary
  _addNewVertex: function (latlng) {
    L.circleMarker(latlng, this._symbols.getSymbol('measureVertexActive')).addTo(this._measureVertexes);
  },
  _addMeasureArea: function (latlngs) {
    if (latlngs.length < 3) {
      if (this._measureArea) {
        this._layer.removeLayer(this._measureArea);
        this._measureArea = null;
      }
      return;
    }
    if (!this._measureArea) {
      this._measureArea = L.polygon(latlngs, this._symbols.getSymbol('measureArea')).addTo(this._layer);
    } else {
      this._measureArea.setLatLngs(latlngs);
    }
  },
  _addMeasureBoundary: function (latlngs) {
    if (latlngs.length < 2) {
      if (this._measureBoundary) {
        this._layer.removeLayer(this._measureBoundary);
        this._measureBoundary = null;
      }
      return;
    }
    if (!this._measureBoundary) {
      this._measureBoundary = L.polyline(latlngs, this._symbols.getSymbol('measureBoundary')).addTo(this._layer);
    } else {
      this._measureBoundary.setLatLngs(latlngs);
    }
  }
});

L.Map.mergeOptions({
  measureControl: false
});

L.Map.addInitHook(function () {
  if (this.options.measureControl) {
    this.measureControl = (new L.Control.Measure()).addTo(this);
  }
});

L.control.measure = function (options) {
  return new L.Control.Measure(options);
};
