// calc.js
// measure calculations

import * as _ from 'lodash';
import * as geocrunch from 'geocrunch';

function pad(num) {
  return num < 10 ? '0' + num.toString() : num.toString();
}

function ddToDms(coordinate, posSymbol, negSymbol) {
  const dd = Math.abs(coordinate),
    d = Math.floor(dd),
    m = Math.floor((dd - d) * 60),
    s = Math.round((dd - d - m / 60) * 3600 * 100) / 100,
    directionSymbol = dd === coordinate ? posSymbol : negSymbol;
  return pad(d) + '&deg; ' + pad(m) + "' " + pad(s) + '" ' + directionSymbol;
}

// `calc(latLngArray)` - returns object with calced measurements for passed points
export default function calc(latlngs) {
  const last = _.last(latlngs);
  const path = geocrunch.path(
    _.map(latlngs, function(latlng) {
      return [latlng.lng, latlng.lat];
    })
  );

  const meters = path.distance({
    units: 'meters'
  });
  const sqMeters = path.area({
    units: 'sqmeters'
  });

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
    length: meters,
    area: sqMeters
  };
}
