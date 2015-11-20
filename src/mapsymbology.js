// mapsymbology.js

var _ = require('underscore');

var color = require('color');

var Symbology = function (options) {
  this.setOptions(options);
};

Symbology.DEFAULTS = {
  activeColor: '#ABE67E',    // base color for map features while actively measuring
  completedColor: '#C8F2BE'  // base color for permenant features generated from completed measure
};

_.extend(Symbology.prototype, {
  setOptions: function (options) {
    this._options = _.extend({}, Symbology.DEFAULTS, this._options, options);
    return this;
  },
  getSymbol: function (name) {
    var symbols = {
      measureDrag: {
        clickable: false,
        radius: 4,
        color: this._options.activeColor,
        weight: 2,
        opacity: 0.7,
        fillColor: this._options.activeColor,
        fillOpacity: 0.5,
        className: 'layer-measuredrag'
      },
      measureArea: {
        clickable: false,
        stroke: false,
        fillColor: this._options.activeColor,
        fillOpacity: 0.2,
        className: 'layer-measurearea'
      },
      measureBoundary: {
        clickable: false,
        color: this._options.activeColor,
        weight: 2,
        opacity: 0.9,
        fill: false,
        className: 'layer-measureboundary'
      },
      measureVertex: {
        clickable: false,
        radius: 4,
        color: this._options.activeColor,
        weight: 2,
        opacity: 1,
        fillColor: this._options.activeColor,
        fillOpacity: 0.7,
        className: 'layer-measurevertex'
      },
      measureVertexActive: {
        clickable: false,
        radius: 4,
        color: this._options.activeColor,
        weight: 2,
        opacity: 1,
        fillColor: color(this._options.activeColor).darken(0.15),
        fillOpacity: 0.7,
        className: 'layer-measurevertex active'
      },
      resultArea: {
        clickable: true,
        color: this._options.completedColor,
        weight: 2,
        opacity: 0.9,
        fillColor: this._options.completedColor,
        fillOpacity: 0.2,
        className: 'layer-measure-resultarea'
      },
      resultLine: {
        clickable: true,
        color: this._options.completedColor,
        weight: 3,
        opacity: 0.9,
        fill: false,
        className: 'layer-measure-resultline'
      },
      resultPoint: {
        clickable: true,
        radius: 4,
        color: this._options.completedColor,
        weight: 2,
        opacity: 1,
        fillColor: this._options.completedColor,
        fillOpacity: 0.7,
        className: 'layer-measure-resultpoint'
      }
    };
    return symbols[name];
  }
});

module.exports = Symbology;