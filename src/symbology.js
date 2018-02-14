const DEFAULT_OPTIONS = {
  activeColor: '#ABE67E',
  completedColor: '#C8F2BE'
};

export default class Symbology {
  constructor(options) {
    this._options = L.extend({}, DEFAULT_OPTIONS, this._options, options);
  }

  getSymbol(name) {
    const symbols = {
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
        fillColor: this._options.activeColor,
        fillOpacity: 1,
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
}
