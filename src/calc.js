// calc.js
// measure calculations

var _ = require('underscore');
var geocrunch = require('geocrunch');

var pad = function (num) {
  return num < 10 ? '0' + num.toString() : num.toString();
};

var ddToDms = function (coordinate, posSymbol, negSymbol) {
  var dd = Math.abs(coordinate),
      d = Math.floor(dd),
      m = Math.floor((dd - d) * 60),
      s = Math.round((dd - d - (m/60)) * 3600 * 100)/100,
      directionSymbol = dd === coordinate ? posSymbol : negSymbol;
  return pad(d) + '&deg; ' + pad(m) + '\' ' + pad(s) + '" ' + directionSymbol;
};

var measure = function (latlngs) {
  var last = _.last(latlngs), feet, meters, miles, kilometers, sqMeters, acres, hectares, sqMiles;
  var path = geocrunch.path(_.map(latlngs, function (latlng) {
    return [latlng.lng, latlng.lat];
  }));

  feet = path.distance({
    units: 'feet'
  });
  meters = feet / 3.2808;
  miles = feet / 5280;
  kilometers = meters / 1000;
  sqMeters = path.area({
    units: 'sqmeters'
  });
  acres = sqMeters * 0.00024711;
  hectares = sqMeters / 10000;
  sqMiles = acres * 0.0015625;

  return {
    lastCoord: {
      dd: {
        x: last.lng,
        y: last.lat
      },
      dms: {
        x: ddToDms(last.lng, 'E', 'W'),
        y: ddToDms(last.lat, 'N', 'S')
      }
    },
    length: {
      feet: feet,
      meters: meters,
      miles: miles,
      kilometers: kilometers
    },
    area: {
      acres: acres,
      hectares: hectares,
      sqmeters: sqMeters,
      sqmiles: sqMiles
    }
  };
};

module.exports = {
  measure: measure // `measure(latLngArray)` - returns object with calced measurements for passed points
};