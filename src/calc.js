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


// Correction of the polygon vertices to allow the correct calculation of the area of polygons that have intersections in the segments.
var fixPolygonCrossingEdges = function (latlngs) {
  // Checks whether the pointC is to the right, to the left, or aligned with the vector defined by pointA_pointB.
  var checkPointSide = function(pointA, pointB, pointC){
  var pointSide = ((pointA.lng * pointC.lat) - (pointA.lat * pointC.lng)
    + (pointA.lat * pointB.lng) - (pointA.lng * pointB.lat)
    + (pointC.lng * pointB.lat) - (pointC.lat * pointB.lng));
  return Math.sign(pointSide);
  };
  // Checks whether the segments pointA_pointB and pointC_pointD intersect.
  var checkSegmentsIntersection = function(pointA, pointB, pointC, pointD){
  // Checks whether the rectangles defined by the pointA_pointB and pointC_pointD segments intersect.
  var checkIntersectionOfRectangles = (
    (Math.max(pointA.lng, pointB.lng) >= Math.min(pointC.lng, pointD.lng)) &&
    (Math.max(pointC.lng, pointD.lng) >= Math.min(pointA.lng, pointB.lng)) &&
    (Math.max(pointA.lat, pointB.lat) >= Math.min(pointC.lat, pointD.lat)) &&
    (Math.max(pointC.lat, pointD.lat) >= Math.min(pointA.lat, pointB.lat))
  );

  if (checkIntersectionOfRectangles) {
    var directionFactorToAB = checkPointSide(pointA, pointB, pointC) * checkPointSide(pointA, pointB, pointD);
    var directionFactorToCD = checkPointSide(pointC, pointD, pointA) * checkPointSide(pointC, pointD, pointB);
    return ((directionFactorToAB < 0) && (directionFactorToCD < 0));
  }
  return false;
  };
  // Returns the point of intersection between segments pointA_pointB and pointC_pointD.
  var getSegmentsIntersection = function(pointA, pointB, pointC, pointD){
  var x, y, a1, a2, b1, b2, intersectionPoint;
  if ((pointB.lng === pointA.lng) && (pointD.lng === pointC.lng)){
    // Segments pointA_pointB and pointC_pointD are vertical (parallel or coincident).
    return [];
  }

  if ((pointB.lng === pointA.lng)){
    // Segment pointA_pointB is vertical
    a2 = (pointD.lat - pointC.lat)/(pointD.lng - pointC.lng);
    b2 = pointC.lat - a2 * pointC.lng;
    x = pointA.lng;
    y = a2 * x + b2;
    return [x, y];
  }

  if ((pointD.lng === pointC.lng)){
    // Segment pointC_pointD is vertical
    a1 = (pointB.lat - pointA.lat)/(pointB.lng - pointA.lng);
    b1 = pointA.lat - a1 * pointA.lng;
    x = pointC.lng;
    y = a1 * x + b1;
    return [x, y];
  }

  // Segments pointA_pointB and pointC_pointD are non-vertical.
  a1 = (pointB.lat - pointA.lat)/(pointB.lng - pointA.lng);
  b1 = pointA.lat - a1 * pointA.lng;
  a2 = (pointD.lat - pointC.lat)/(pointD.lng - pointC.lng);
  b2 = pointC.lat - a2 * pointC.lng;
  if (a1 === a2){
    return [];
  }

  x = (b2-b1)/(a1-a2);
  y = a1 * x + b1;
  return [x, y];
  };

  var pointsCount = latlngs.length;
  // It only searches for crosses if the polygon has more than 3 vertices.
  if (pointsCount > 3){
  // The search always involves 4 points, so it is scanned for points with indices less than (pointsCount - 3).
  for (var i = 0; i <= (pointsCount-3); i++) {
    // The second segment is searched from the i-th point plus 2, to the last point.
    for (var j = i + 2; j < pointsCount; j++) {
    // It verifies that the segment defined by the points with i and i + 1, intersects the segment defined 
    // by the points with j and j + 1.
    // Note: The last segment is defined by the points with indices equal to (pointsCount - 1) and 0. 
    // For this reason the expression "(j + 1) % pointsCount" was defined, so if (j + 1 == pointsCount), 
    // then The returned value will be 0.
    if (checkSegmentsIntersection(latlngs[i], latlngs[i+1], latlngs[j], latlngs[(j+1) % pointsCount])){
      // Gets the point of intersection between the current segments.
      var xy = getSegmentsIntersection(latlngs[i], latlngs[i+1], latlngs[j], latlngs[(j+1) % pointsCount]);
      // Invert the sequence of points from the closed interval [i + 1] to [j], inclusive, in the new array.
      // Copy the initial portion.
      var trecho0LatLngs = latlngs.slice(0, i + 1);
      // Copy the portion of the array to be reverted.
      var trecho1LatLngs = latlngs.slice(i + 1, j + 1); 
      // Copy the final portion.
      var trecho2LatLngs = latlngs.slice(j + 1);
      trecho1LatLngs.reverse(); 
      // Replaces the old portion with the reversed portion.
      var latlngs = trecho0LatLngs.concat(trecho1LatLngs, trecho2LatLngs);
      // Creates the two points of intersection of the segments (which are equal !!!).
      var point1 = latlngs.slice(0, 1);
      var point2 = latlngs.slice(0, 1);
      point1 = point1[0].clone();
      point2 = point2[0].clone();
      point1.lat = xy[1];
      point2.lat = xy[1];
      point1.lng = xy[0];
      point2.lng = xy[0];
      // Add points point1 and point2 to segment pointA_pointB and pointC_pointD, respectively.
      latlngs.splice(i+1, 0, point1);
      if (j === pointsCount - 1){
      latlngs.splice(0, 0, point2);
      } else {
      latlngs.splice(((j+1) % pointsCount)+1, 0, point2);
      }
      // Since the 4 sub-segments created can still contain crosses with other segments, one must 
      // redo the search from the same segment started in [i].
      i--;
      // Updates the counter, which now has two more vertices.
      pointsCount = latlngs.length;
      // Exits of the second loop.
      j = pointsCount;
    }
    }
  }
  } 
  return latlngs;
};



var measure = function (latlngs) {
  var latlngsfixed = fixPolygonCrossingEdges(latlngs);
  var last = _.last(latlngsfixed);
  var path = geocrunch.path(_.map(latlngsfixed, function (latlng) {
    return [latlng.lng, latlng.lat];
  }));

  var meters = path.distance({
    units: 'meters'
  });
  var sqMeters = path.area({
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
};

module.exports = {
  measure: measure // `measure(latLngArray)` - returns object with calced measurements for passed points
};