// calc.js
// measure calculations

import length from '@turf/length';
import area from '@turf/area';

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

/* calc measurements for an array of points */
export default function calc(latlngs) {
  const last = latlngs[latlngs.length - 1];
  const path = latlngs.map(latlng => [latlng.lat, latlng.lng]);

  const polyline = L.polyline(path),
    polygon = L.polygon(path);
  const meters = length(polyline.toGeoJSON(), { units: 'kilometers' }) * 1000;
  const sqMeters = area(polygon.toGeoJSON());

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
