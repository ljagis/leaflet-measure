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

var i18n = new (require('i18n-2'))({
  devMode: false,
  locales: {
    'ca': require('./i18n/ca'),
    'cn': require('./i18n/cn'),
    'da': require('./i18n/da'),
    'de': require('./i18n/de'),
    'de_CH': require('./i18n/de_CH'),
    'en': require('./i18n/en'),
    'en_UK': require('./i18n/en_UK'),
    'es': require('./i18n/es'),
    'fa': require('./i18n/fa'),
    'fil_PH': require('./i18n/fil_PH'),
    'fr': require('./i18n/fr'),
    'it': require('./i18n/it'),
    'nl': require('./i18n/nl'),
    'pl': require('./i18n/pl'),
    'pt_BR': require('./i18n/pt_BR'),
    'pt_PT': require('./i18n/pt_PT'),
    'ru': require('./i18n/ru'),
    'sv': require('./i18n/sv'),
    'tr': require('./i18n/tr')
  }
});

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
    captureZIndex: 10000,       // z-index of the marker used to capture measure events
    popupOptions: {             // standard leaflet popup options http://leafletjs.com/reference.html#popup-options
      className: 'leaflet-measure-resultpopup',
      autoPanPadding: [10, 10]
    }
  },
  initialize: function (options) {
    L.setOptions(this, options);
    this.options.units = L.extend({}, units, this.options.units);
    this._symbols = new Symbology(_.pick(this.options, 'activeColor', 'completedColor'));
    i18n.setLocale(this.options.localization);
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
      },
      i18n: i18n
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
    this._measureVertexes = L.featureGroup().addTo(this._layer);
    this._captureMarker = L.marker(this._map.getCenter(), {
      clickable: true,
      zIndexOffset: this.options.captureZIndex,
      opacity: 0
    }).addTo(this._layer);
    this._setCaptureMarkerIcon();

    this._captureMarker
      .on('mouseout', this._handleMapMouseOut, this)
      .on('dblclick', this._handleMeasureDoubleClick, this)
      .on('click', this._handleMeasureClick, this);

    this._map
      .on('mousemove', this._handleMeasureMove, this)
      .on('mouseout', this._handleMapMouseOut, this)
      .on('move', this._centerCaptureMarker, this)
      .on('resize', this._setCaptureMarkerIcon, this);

    L.DomEvent.on(this._container, 'mouseenter', this._handleMapMouseOut, this);

    this._updateMeasureStartedNoPoints();

    this._map.fire('measurestart', null, false);
  },
  // return to state with no measure in progress, undo `this._startMeasure`
  _finishMeasure: function () {
    var model = _.extend({}, this._resultsModel, {
      points: this._latlngs
    });

    this._locked = false;

    L.DomEvent.off(this._container, 'mouseover', this._handleMapMouseOut, this);

    this._clearMeasure();

    this._captureMarker
      .off('mouseout', this._handleMapMouseOut, this)
      .off('dblclick', this._handleMeasureDoubleClick, this)
      .off('click', this._handleMeasureClick, this);

    this._map
      .off('mousemove', this._handleMeasureMove, this)
      .off('mouseout', this._handleMapMouseOut, this)
      .off('move', this._centerCaptureMarker, this)
      .off('resize', this._setCaptureMarkerIcon, this);

    this._layer
      .removeLayer(this._measureVertexes)
      .removeLayer(this._captureMarker);
    this._measureVertexes = null;

    this._updateMeasureNotStarted();
    this._collapse();

    this._map.fire('measurefinish', model, false);
  },
  // clear all running measure data
  _clearMeasure: function () {
    this._latlngs = [];
    this._resultsModel = null;
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
  // centers the event capture marker
  _centerCaptureMarker: function () {
    this._captureMarker.setLatLng(this._map.getCenter());
  },
  // set icon on the capture marker
  _setCaptureMarkerIcon: function () {
    this._captureMarker.setIcon(L.divIcon({
      iconSize: this._map.getSize().multiplyBy(2)
    }));
  },
  // format measurements to nice display string based on units in options
  // `{ lengthDisplay: '100 Feet (0.02 Miles)', areaDisplay: ... }`
  _getMeasurementDisplayStrings: function (measurement) {
    var unitDefinitions = this.options.units;

    return {
      lengthDisplay: buildDisplay(measurement.length, this.options.primaryLengthUnit, this.options.secondaryLengthUnit, this.options.decPoint, this.options.thousandsSep),
      areaDisplay: buildDisplay(measurement.area, this.options.primaryAreaUnit, this.options.secondaryAreaUnit, this.options.decPoint, this.options.thousandsSep)
    };

    function buildDisplay (val, primaryUnit, secondaryUnit, decPoint, thousandsSep) {
      var display;
      if (primaryUnit && unitDefinitions[primaryUnit]) {
        display = formatMeasure(val, unitDefinitions[primaryUnit], decPoint, thousandsSep);
        if (secondaryUnit && unitDefinitions[secondaryUnit]) {
          display = display + ' (' +  formatMeasure(val, unitDefinitions[secondaryUnit], decPoint, thousandsSep) + ')';
        }
      } else {
        display = formatMeasure(val, null, decPoint, thousandsSep);
      }
      return display;
    }

    function formatMeasure (val, unit, decPoint, thousandsSep) {
      return unit && unit.factor && unit.display ?
        humanize.numberFormat(val * unit.factor, unit.decimals || 0, decPoint || i18n.__('decPoint'), thousandsSep || i18n.__('thousandsSep')) + ' ' + i18n.__([unit.display]) || unit.display :
        humanize.numberFormat(val, 0, decPoint || i18n.__('decPoint'), thousandsSep || i18n.__('thousandsSep'));
    }
  },
  // update results area of dom with calced measure from `this._latlngs`
  _updateResults: function () {
    var calced = calc.measure(this._latlngs);
    var resultsModel = this._resultsModel = _.extend({}, calced, this._getMeasurementDisplayStrings(calced), {
      pointCount: this._latlngs.length
    });
    this.$results.innerHTML = resultsTemplate({
      model: resultsModel,
      humanize: humanize,
      i18n: i18n
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
        humanize: humanize,
        i18n: i18n
      });
    } else if (latlngs.length === 2) {
      resultFeature = L.polyline(latlngs, this._symbols.getSymbol('resultLine'));
      popupContent = linePopupTemplate({
        model: _.extend({}, calced, this._getMeasurementDisplayStrings(calced)),
        humanize: humanize,
        i18n: i18n
      });
    } else {
      resultFeature = L.polygon(latlngs, this._symbols.getSymbol('resultArea'));
      popupContent = areaPopupTemplate({
        model: _.extend({}, calced, this._getMeasurementDisplayStrings(calced)),
        humanize: humanize,
        i18n: i18n
      });
    }

    popupContainer = L.DomUtil.create('div', '');
    popupContainer.innerHTML = popupContent;

    zoomLink = $('.js-zoomto', popupContainer);
    if (zoomLink) {
      L.DomEvent.on(zoomLink, 'click', L.DomEvent.stop);
      L.DomEvent.on(zoomLink, 'click', function () {
        if (resultFeature.getBounds) {
          this._map.fitBounds(resultFeature.getBounds(), {
            padding: [20, 20],
            maxZoom: 17
          });
        } else if (resultFeature.getLatLng) {
          this._map.panTo(resultFeature.getLatLng());
        }
      }, this);
    }

    deleteLink = $('.js-deletemarkup', popupContainer);
    if (deleteLink) {
      L.DomEvent.on(deleteLink, 'click', L.DomEvent.stop);
      L.DomEvent.on(deleteLink, 'click', function () {
        // TODO. maybe remove any event handlers on zoom and delete buttons?
        this._layer.removeLayer(resultFeature);
      }, this);
    }

    resultFeature.addTo(this._layer);
    resultFeature.bindPopup(popupContainer, this.options.popupOptions);
    if (resultFeature.getBounds) {
      resultFeature.openPopup(resultFeature.getBounds().getCenter());
    } else if (resultFeature.getLatLng) {
      resultFeature.openPopup(resultFeature.getLatLng());
    }
  },
  // handle map click during ongoing measurement
  // add new clicked point, update measure layers and results ui
  _handleMeasureClick: function (evt) {
    var latlng = this._map.mouseEventToLatLng(evt.originalEvent), // get actual latlng instead of the marker's latlng from originalEvent
      lastClick = _.last(this._latlngs),
      vertexSymbol = this._symbols.getSymbol('measureVertex');

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
