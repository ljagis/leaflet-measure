(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./lib/geocrunch');
},{"./lib/geocrunch":6}],2:[function(require,module,exports){
// distance.js - Distance mixins for Paths

var _ = require('underscore');

var R = require('./constants').EARTHRADIUS;
var units = require('./units');
var flipCoords = require('./flipcoords');

// Area conversions (from sqmeters)
var convertFuncs = {
  sqmeters: function (a) {
    return a;
  },
  sqmiles: function (a) {
    return units.sqMeters.toSqMiles(a);
  },
  acres: function (a) {
    return units.sqMeters.toAcres(a);
  }
};

// Calculates area in square meters
// Method taken from OpenLayers API, https://github.com/openlayers/openlayers/blob/master/lib/OpenLayers/Geometry/LinearRing.js#L270
var calcArea = function (coordArray) {
  var area = 0, i, l, c1, c2;
  for (i = 0, l = coordArray.length; i < l; i += 1) {
    c1 = coordArray[i];
    c2 = coordArray[(i + 1) % coordArray.length]; // Access next item in array until last item is i, then accesses first (0)
    area = area + units.degrees.toRadians(c2[0] - c1[0]) * (2 + Math.sin(units.degrees.toRadians(c1[1])) + Math.sin(units.degrees.toRadians(c2[1])));
  }
  return Math.abs(area * R * R / 2);
};

var calcCenter = function (coordArray) {
  var offset = coordArray[0], twiceArea = 0, x = 0, y = 0, i, l, c1, c2, f;
  if (coordArray.length === 1) {
    return coordArray[0];
  }
  for (i = 0, l = coordArray.length; i < l; i += 1) {
    c1 = coordArray[i];
    c2 = coordArray[(i + 1) % coordArray.length]; // Access next item in array until last item is i, then accesses first (0)
    f = (c1[1] - offset[1]) * (c2[0] - offset[0]) - (c2[1] - offset[1]) * (c1[0] - offset[0]);
    twiceArea = twiceArea + f;
    x = x + ((c1[0] + c2[0] - 2 * offset[0]) * f);
    y = y + ((c1[1] + c2[1] - 2 * offset[1]) * f);
  }
  f = twiceArea * 3;
  return [x / f + offset[0], y / f + offset[1]];
};

module.exports = {
  _internalAreaCalc: function () {
    // If not set, set this._calcedArea to total area in UNITS
    // Checks for cache to prevent additional unnecessary calcs
    if (!this._calcedArea) {
      if (this._coords.length < 3) {
        this._calcedArea = 0;
      } else {
        this._calcedArea = calcArea(this._coords);
      }
    }
  },
  _internalCenterCalc: function () {
    if (!this._calcedCenter && this._coords.length) {
      this._calcedCenter = calcCenter(this._coords);
    }
  },
  area: function (options) {
    var opts = _.extend({
      units: 'sqmeters'
    }, options);
    this._internalAreaCalc();
    if (_.isFunction(convertFuncs[opts.units])) {
      return convertFuncs[opts.units](this._calcedArea);
    }
    // TODO. Handle non-matching units
  },
  center: function () {
    this._internalCenterCalc();
    return this._options.imBackwards === true ? flipCoords(this._calcedCenter) : this._calcedCenter;
  }
};
},{"./constants":3,"./flipcoords":5,"./units":8,"underscore":9}],3:[function(require,module,exports){
// utils/constants.js

module.exports = {
  EARTHRADIUS: 6371000 // R in meters
};
},{}],4:[function(require,module,exports){
// distance.js - Distance mixins for Paths

var _ = require('underscore');

var R = require('./constants').EARTHRADIUS;
var units = require('./units');

// Distance conversions (from meters)
var convertFuncs = {
  meters: function (d) {
    return d;
  },
  kilometers: function (d) {
    return units.meters.toKilometers(d);
  },
  feet: function (d) {
    return units.meters.toFeet(d);
  },
  miles: function (d) {
    return units.meters.toMiles(d);
  }
};

// Distance in meters
// Always positive regardless of direction
// Calculation based on Haversine Formula http://en.wikipedia.org/wiki/Haversine_formula
// Another method is @ http://www.movable-type.co.uk/scripts/latlong-vincenty.html but seems way overcomplicated
var calcDistance = function (coord1, coord2) {
  var deltaLng = units.degrees.toRadians(coord1[0] - coord2[0]),
      deltaLat = units.degrees.toRadians(coord1[1] - coord2[1]),
      lat1 = units.degrees.toRadians(coord1[1]),
      lat2 = units.degrees.toRadians(coord2[1]),
      hvsLng = Math.sin(deltaLng / 2),
      hvsLat = Math.sin(deltaLat / 2);

  var a = hvsLat * hvsLat + hvsLng * hvsLng * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

module.exports = {
  _internalDistanceCalc: function () {
    // If not set, set this._calcedDistance to total distance in meters
    // Checks for cache to prevent additional unnecessary calcs
    var distance = 0, i, l;
    if (!this._calcedDistance) {
      for (i = 0, l = this._coords.length; i < l; i += 1) {
        if (i > 0) {
          distance = distance + calcDistance(this._coords[i - 1], this._coords[i]);
        }
      }
      this._calcedDistance = distance;
    }
  },
  distance: function (options) {
    var opts = _.extend({
      units: 'meters'
    }, options);
    this._internalDistanceCalc();
    if (_.isFunction(convertFuncs[opts.units])) {
      return convertFuncs[opts.units](this._calcedDistance);
    }
    // TODO. Handle non-matching units
  }
};
},{"./constants":3,"./units":8,"underscore":9}],5:[function(require,module,exports){
// utils/flipcoords.js - Util functions for working with backwards coordinates [lat, lng]

var _ = require('underscore');

module.exports = function (backwardsCoordArray) {
  return _.map(backwardsCoordArray, function (backwardsCoord) {
    return [backwardsCoord[1], backwardsCoord[0]];
  });
};
},{"underscore":9}],6:[function(require,module,exports){
// geocrunch.js

var _ = require('underscore');

var Path = require('./path');
var distanceMixins = require('./distance'),
    areaMixins = require('./area');

_.extend(Path.prototype, distanceMixins, areaMixins);

exports.path = function (coords, options) {
  return new Path(coords, options);
};
},{"./area":2,"./distance":4,"./path":7,"underscore":9}],7:[function(require,module,exports){
// path.js - Object for working with a linear path of coordinates

var flipCoords = require('./flipcoords');

var Path = function (coords, options) {
  this._options = options || {};

  // Set this._coords... Think about flipping at time of calcs for less iterations/better perf. May risk code clarity and mixin ease.
  coords = coords || [];
  this._coords = this._options.imBackwards === true ? flipCoords(coords) : coords;
};

module.exports = Path;

},{"./flipcoords":5}],8:[function(require,module,exports){
// units.js - Standard unit conversions

exports.meters = {
  toFeet: function (m) {
    return m * 3.28084;
  },
  toKilometers: function (m) {
    return m * 0.001;
  },
  toMiles: function (m) {
    return m * 0.000621371;
  }
};

exports.sqMeters = {
  toSqMiles: function (m) {
    return m * 0.000000386102;
  },
  toAcres: function (m) {
    return m * 0.000247105;
  }
};

exports.degrees = {
  toRadians: function (d) {
    return d * Math.PI / 180;
  }
};
},{}],9:[function(require,module,exports){
//     Underscore.js 1.5.2
//     http://underscorejs.org
//     (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.5.2';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    return _.filter(obj, function(value, index, list) {
      return !iterator.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs, first) {
    if (_.isEmpty(attrs)) return first ? void 0 : [];
    return _[first ? 'find' : 'filter'](obj, function(value) {
      for (var key in attrs) {
        if (attrs[key] !== value[key]) return false;
      }
      return true;
    });
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.where(obj, attrs, true);
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity, value: -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed > result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity, value: Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array, using the modern version of the 
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from an array.
  // If **n** is not specified, returns a single random element from the array.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (arguments.length < 2 || guard) {
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    return _.isFunction(value) ? value : function(obj){ return obj[value]; };
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, value, context) {
    var iterator = lookupIterator(value);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, value, context) {
      var result = {};
      var iterator = value == null ? _.identity : lookupIterator(value);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    (_.has(result, key) ? result[key] : (result[key] = [])).push(value);
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = iterator == null ? _.identity : lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    return (n == null) || guard ? array[0] : slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) {
      return array[array.length - 1];
    } else {
      return slice.call(array, Math.max(array.length - n, 0));
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, "length").concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context.
  _.partial = function(func) {
    var args = slice.call(arguments, 1);
    return function() {
      return func.apply(this, args.concat(slice.call(arguments)));
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error("bindAll must be passed function names");
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : new Date;
      timeout = null;
      result = func.apply(context, args);
    };
    return function() {
      var now = new Date;
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;
    return function() {
      context = this;
      args = arguments;
      timestamp = new Date();
      var later = function() {
        var last = (new Date()) - timestamp;
        if (last < wait) {
          timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) result = func.apply(context, args);
        }
      };
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) result = func.apply(context, args);
      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func];
      push.apply(args, arguments);
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

}).call(this);

},{}],10:[function(require,module,exports){

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `humanize` variable.
  var previousHumanize = root.humanize;

  var humanize = {};

  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = humanize;
    }
    exports.humanize = humanize;
  } else {
    if (typeof define === 'function' && define.amd) {
      define('humanize', function() {
        return humanize;
      });
    }
    root.humanize = humanize;
  }

  humanize.noConflict = function() {
    root.humanize = previousHumanize;
    return this;
  };

  humanize.pad = function(str, count, padChar, type) {
    str += '';
    if (!padChar) {
      padChar = ' ';
    } else if (padChar.length > 1) {
      padChar = padChar.charAt(0);
    }
    type = (type === undefined) ? 'left' : 'right';

    if (type === 'right') {
      while (str.length < count) {
        str = str + padChar;
      }
    } else {
      // default to left
      while (str.length < count) {
        str = padChar + str;
      }
    }

    return str;
  };

  // gets current unix time
  humanize.time = function() {
    return new Date().getTime() / 1000;
  };

  /**
   * PHP-inspired date
   */

                        /*  jan  feb  mar  apr  may  jun  jul  aug  sep  oct  nov  dec */
  var dayTableCommon = [ 0,   0,  31,  59,  90, 120, 151, 181, 212, 243, 273, 304, 334 ];
  var dayTableLeap   = [ 0,   0,  31,  60,  91, 121, 152, 182, 213, 244, 274, 305, 335 ];
  // var mtable_common[13] = {  0,  31,  28,  31,  30,  31,  30,  31,  31,  30,  31,  30,  31 };
  // static int ml_table_leap[13]   = {  0,  31,  29,  31,  30,  31,  30,  31,  31,  30,  31,  30,  31 };


  humanize.date = function(format, timestamp) {
    var jsdate = ((timestamp === undefined) ? new Date() : // Not provided
                  (timestamp instanceof Date) ? new Date(timestamp) : // JS Date()
                  new Date(timestamp * 1000) // UNIX timestamp (auto-convert to int)
                 );

    var formatChr = /\\?([a-z])/gi;
    var formatChrCb = function (t, s) {
      return f[t] ? f[t]() : s;
    };

    var shortDayTxt = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var monthTxt = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    var f = {
      /* Day */
      // Day of month w/leading 0; 01..31
      d: function () { return humanize.pad(f.j(), 2, '0'); },

      // Shorthand day name; Mon..Sun
      D: function () { return f.l().slice(0, 3); },

      // Day of month; 1..31
      j: function () { return jsdate.getDate(); },

      // Full day name; Monday..Sunday
      l: function () { return shortDayTxt[f.w()]; },

      // ISO-8601 day of week; 1[Mon]..7[Sun]
      N: function () { return f.w() || 7; },

      // Ordinal suffix for day of month; st, nd, rd, th
      S: function () {
        var j = f.j();
        return j > 4 && j < 21 ? 'th' : {1: 'st', 2: 'nd', 3: 'rd'}[j % 10] || 'th';
      },

      // Day of week; 0[Sun]..6[Sat]
      w: function () { return jsdate.getDay(); },

      // Day of year; 0..365
      z: function () {
        return (f.L() ? dayTableLeap[f.n()] : dayTableCommon[f.n()]) + f.j() - 1;
      },

      /* Week */
      // ISO-8601 week number
      W: function () {
        // days between midweek of this week and jan 4
        // (f.z() - f.N() + 1 + 3.5) - 3
        var midWeekDaysFromJan4 = f.z() - f.N() + 1.5;
        // 1 + number of weeks + rounded week
        return humanize.pad(1 + Math.floor(Math.abs(midWeekDaysFromJan4) / 7) + (midWeekDaysFromJan4 % 7 > 3.5 ? 1 : 0), 2, '0');
      },

      /* Month */
      // Full month name; January..December
      F: function () { return monthTxt[jsdate.getMonth()]; },

      // Month w/leading 0; 01..12
      m: function () { return humanize.pad(f.n(), 2, '0'); },

      // Shorthand month name; Jan..Dec
      M: function () { return f.F().slice(0, 3); },

      // Month; 1..12
      n: function () { return jsdate.getMonth() + 1; },

      // Days in month; 28..31
      t: function () { return (new Date(f.Y(), f.n(), 0)).getDate(); },

      /* Year */
      // Is leap year?; 0 or 1
      L: function () { return new Date(f.Y(), 1, 29).getMonth() === 1 ? 1 : 0; },

      // ISO-8601 year
      o: function () {
        var n = f.n();
        var W = f.W();
        return f.Y() + (n === 12 && W < 9 ? -1 : n === 1 && W > 9);
      },

      // Full year; e.g. 1980..2010
      Y: function () { return jsdate.getFullYear(); },

      // Last two digits of year; 00..99
      y: function () { return (String(f.Y())).slice(-2); },

      /* Time */
      // am or pm
      a: function () { return jsdate.getHours() > 11 ? 'pm' : 'am'; },

      // AM or PM
      A: function () { return f.a().toUpperCase(); },

      // Swatch Internet time; 000..999
      B: function () {
        var unixTime = jsdate.getTime() / 1000;
        var secondsPassedToday = unixTime % 86400 + 3600; // since it's based off of UTC+1
        if (secondsPassedToday < 0) { secondsPassedToday += 86400; }
        var beats = ((secondsPassedToday) / 86.4) % 1000;
        if (unixTime < 0) {
          return Math.ceil(beats);
        }
        return Math.floor(beats);
      },

      // 12-Hours; 1..12
      g: function () { return f.G() % 12 || 12; },

      // 24-Hours; 0..23
      G: function () { return jsdate.getHours(); },

      // 12-Hours w/leading 0; 01..12
      h: function () { return humanize.pad(f.g(), 2, '0'); },

      // 24-Hours w/leading 0; 00..23
      H: function () { return humanize.pad(f.G(), 2, '0'); },

      // Minutes w/leading 0; 00..59
      i: function () { return humanize.pad(jsdate.getMinutes(), 2, '0'); },

      // Seconds w/leading 0; 00..59
      s: function () { return humanize.pad(jsdate.getSeconds(), 2, '0'); },

      // Microseconds; 000000-999000
      u: function () { return humanize.pad(jsdate.getMilliseconds() * 1000, 6, '0'); },

      // Whether or not the date is in daylight savings time
      /*
      I: function () {
        // Compares Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC.
        // If they are not equal, then DST is observed.
        var Y = f.Y();
        return 0 + ((new Date(Y, 0) - Date.UTC(Y, 0)) !== (new Date(Y, 6) - Date.UTC(Y, 6)));
      },
      */

      // Difference to GMT in hour format; e.g. +0200
      O: function () {
        var tzo = jsdate.getTimezoneOffset();
        var tzoNum = Math.abs(tzo);
        return (tzo > 0 ? '-' : '+') + humanize.pad(Math.floor(tzoNum / 60) * 100 + tzoNum % 60, 4, '0');
      },

      // Difference to GMT w/colon; e.g. +02:00
      P: function () {
        var O = f.O();
        return (O.substr(0, 3) + ':' + O.substr(3, 2));
      },

      // Timezone offset in seconds (-43200..50400)
      Z: function () { return -jsdate.getTimezoneOffset() * 60; },

      // Full Date/Time, ISO-8601 date
      c: function () { return 'Y-m-d\\TH:i:sP'.replace(formatChr, formatChrCb); },

      // RFC 2822
      r: function () { return 'D, d M Y H:i:s O'.replace(formatChr, formatChrCb); },

      // Seconds since UNIX epoch
      U: function () { return jsdate.getTime() / 1000 || 0; }
    };    

    return format.replace(formatChr, formatChrCb);
  };


  /**
   * format number by adding thousands separaters and significant digits while rounding
   */
  humanize.numberFormat = function(number, decimals, decPoint, thousandsSep) {
    decimals = isNaN(decimals) ? 2 : Math.abs(decimals);
    decPoint = (decPoint === undefined) ? '.' : decPoint;
    thousandsSep = (thousandsSep === undefined) ? ',' : thousandsSep;

    var sign = number < 0 ? '-' : '';
    number = Math.abs(+number || 0);

    var intPart = parseInt(number.toFixed(decimals), 10) + '';
    var j = intPart.length > 3 ? intPart.length % 3 : 0;

    return sign + (j ? intPart.substr(0, j) + thousandsSep : '') + intPart.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + thousandsSep) + (decimals ? decPoint + Math.abs(number - intPart).toFixed(decimals).slice(2) : '');
  };


  /**
   * For dates that are the current day or within one day, return 'today', 'tomorrow' or 'yesterday', as appropriate.
   * Otherwise, format the date using the passed in format string.
   *
   * Examples (when 'today' is 17 Feb 2007):
   * 16 Feb 2007 becomes yesterday.
   * 17 Feb 2007 becomes today.
   * 18 Feb 2007 becomes tomorrow.
   * Any other day is formatted according to given argument or the DATE_FORMAT setting if no argument is given.
   */
  humanize.naturalDay = function(timestamp, format) {
    timestamp = (timestamp === undefined) ? humanize.time() : timestamp;
    format = (format === undefined) ? 'Y-m-d' : format;

    var oneDay = 86400;
    var d = new Date();
    var today = (new Date(d.getFullYear(), d.getMonth(), d.getDate())).getTime() / 1000;

    if (timestamp < today && timestamp >= today - oneDay) {
      return 'yesterday';
    } else if (timestamp >= today && timestamp < today + oneDay) {
      return 'today';
    } else if (timestamp >= today + oneDay && timestamp < today + 2 * oneDay) {
      return 'tomorrow';
    }

    return humanize.date(format, timestamp);
  };

  /**
   * returns a string representing how many seconds, minutes or hours ago it was or will be in the future
   * Will always return a relative time, most granular of seconds to least granular of years. See unit tests for more details
   */
  humanize.relativeTime = function(timestamp) {
    timestamp = (timestamp === undefined) ? humanize.time() : timestamp;

    var currTime = humanize.time();
    var timeDiff = currTime - timestamp;

    // within 2 seconds
    if (timeDiff < 2 && timeDiff > -2) {
      return (timeDiff >= 0 ? 'just ' : '') + 'now';
    }

    // within a minute
    if (timeDiff < 60 && timeDiff > -60) {
      return (timeDiff >= 0 ? Math.floor(timeDiff) + ' seconds ago' : 'in ' + Math.floor(-timeDiff) + ' seconds');
    }

    // within 2 minutes
    if (timeDiff < 120 && timeDiff > -120) {
      return (timeDiff >= 0 ? 'about a minute ago' : 'in about a minute');
    }

    // within an hour
    if (timeDiff < 3600 && timeDiff > -3600) {
      return (timeDiff >= 0 ? Math.floor(timeDiff / 60) + ' minutes ago' : 'in ' + Math.floor(-timeDiff / 60) + ' minutes');
    }

    // within 2 hours
    if (timeDiff < 7200 && timeDiff > -7200) {
      return (timeDiff >= 0 ? 'about an hour ago' : 'in about an hour');
    }

    // within 24 hours
    if (timeDiff < 86400 && timeDiff > -86400) {
      return (timeDiff >= 0 ? Math.floor(timeDiff / 3600) + ' hours ago' : 'in ' + Math.floor(-timeDiff / 3600) + ' hours');
    }

    // within 2 days
    var days2 = 2 * 86400;
    if (timeDiff < days2 && timeDiff > -days2) {
      return (timeDiff >= 0 ? '1 day ago' : 'in 1 day');
    }

    // within 29 days
    var days29 = 29 * 86400;
    if (timeDiff < days29 && timeDiff > -days29) {
      return (timeDiff >= 0 ? Math.floor(timeDiff / 86400) + ' days ago' : 'in ' + Math.floor(-timeDiff / 86400) + ' days');
    }

    // within 60 days
    var days60 = 60 * 86400;
    if (timeDiff < days60 && timeDiff > -days60) {
      return (timeDiff >= 0 ? 'about a month ago' : 'in about a month');
    }

    var currTimeYears = parseInt(humanize.date('Y', currTime), 10);
    var timestampYears = parseInt(humanize.date('Y', timestamp), 10);
    var currTimeMonths = currTimeYears * 12 + parseInt(humanize.date('n', currTime), 10);
    var timestampMonths = timestampYears * 12 + parseInt(humanize.date('n', timestamp), 10);

    // within a year
    var monthDiff = currTimeMonths - timestampMonths;
    if (monthDiff < 12 && monthDiff > -12) {
      return (monthDiff >= 0 ? monthDiff + ' months ago' : 'in ' + (-monthDiff) + ' months');
    }

    var yearDiff = currTimeYears - timestampYears;
    if (yearDiff < 2 && yearDiff > -2) {
      return (yearDiff >= 0 ? 'a year ago' : 'in a year');
    }

    return (yearDiff >= 0 ? yearDiff + ' years ago' : 'in ' + (-yearDiff) + ' years');
  };

  /**
   * Converts an integer to its ordinal as a string.
   *
   * 1 becomes 1st
   * 2 becomes 2nd
   * 3 becomes 3rd etc
   */
  humanize.ordinal = function(number) {
    number = parseInt(number, 10);
    number = isNaN(number) ? 0 : number;
    var sign = number < 0 ? '-' : '';
    number = Math.abs(number);
    var tens = number % 100;

    return sign + number + (tens > 4 && tens < 21 ? 'th' : {1: 'st', 2: 'nd', 3: 'rd'}[number % 10] || 'th');
  };

  /**
   * Formats the value like a 'human-readable' file size (i.e. '13 KB', '4.1 MB', '102 bytes', etc).
   *
   * For example:
   * If value is 123456789, the output would be 117.7 MB.
   */
  humanize.filesize = function(filesize, kilo, decimals, decPoint, thousandsSep, suffixSep) {
    kilo = (kilo === undefined) ? 1024 : kilo;
    if (filesize <= 0) { return '0 bytes'; }
    if (filesize < kilo && decimals === undefined) { decimals = 0; }
    if (suffixSep === undefined) { suffixSep = ' '; }
    return humanize.intword(filesize, ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'], kilo, decimals, decPoint, thousandsSep, suffixSep);
  };

  /**
   * Formats the value like a 'human-readable' number (i.e. '13 K', '4.1 M', '102', etc).
   *
   * For example:
   * If value is 123456789, the output would be 117.7 M.
   */
  humanize.intword = function(number, units, kilo, decimals, decPoint, thousandsSep, suffixSep) {
    var humanized, unit;

    units = units || ['', 'K', 'M', 'B', 'T'],
    unit = units.length - 1,
    kilo = kilo || 1000,
    decimals = isNaN(decimals) ? 2 : Math.abs(decimals),
    decPoint = decPoint || '.',
    thousandsSep = thousandsSep || ',',
    suffixSep = suffixSep || '';

    for (var i=0; i < units.length; i++) {
      if (number < Math.pow(kilo, i+1)) {
        unit = i;
        break;
      }
    }
    humanized = number / Math.pow(kilo, unit);

    var suffix = units[unit] ? suffixSep + units[unit] : '';
    return humanize.numberFormat(humanized, decimals, decPoint, thousandsSep) + suffix;
  };

  /**
   * Replaces line breaks in plain text with appropriate HTML
   * A single newline becomes an HTML line break (<br />) and a new line followed by a blank line becomes a paragraph break (</p>).
   * 
   * For example:
   * If value is Joel\nis a\n\nslug, the output will be <p>Joel<br />is a</p><p>slug</p>
   */
  humanize.linebreaks = function(str) {
    // remove beginning and ending newlines
    str = str.replace(/^([\n|\r]*)/, '');
    str = str.replace(/([\n|\r]*)$/, '');

    // normalize all to \n
    str = str.replace(/(\r\n|\n|\r)/g, "\n");

    // any consecutive new lines more than 2 gets turned into p tags
    str = str.replace(/(\n{2,})/g, '</p><p>');

    // any that are singletons get turned into br
    str = str.replace(/\n/g, '<br />');
    return '<p>' + str + '</p>';
  };

  /**
   * Converts all newlines in a piece of plain text to HTML line breaks (<br />).
   */
  humanize.nl2br = function(str) {
    return str.replace(/(\r\n|\n|\r)/g, '<br />');
  };

  /**
   * Truncates a string if it is longer than the specified number of characters.
   * Truncated strings will end with a translatable ellipsis sequence ('…').
   */
  humanize.truncatechars = function(string, length) {
    if (string.length <= length) { return string; }
    return string.substr(0, length) + '…';
  };

  /**
   * Truncates a string after a certain number of words.
   * Newlines within the string will be removed.
   */
  humanize.truncatewords = function(string, numWords) {
    var words = string.split(' ');
    if (words.length < numWords) { return string; }
    return words.slice(0, numWords).join(' ') + '…';
  };

}).call(this);

},{}],11:[function(require,module,exports){
//     Underscore.js 1.7.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.7.0';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var createCallback = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  _.iteratee = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return createCallback(value, context, argCount);
    if (_.isObject(value)) return _.matches(value);
    return _.property(value);
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    if (obj == null) return obj;
    iteratee = createCallback(iteratee, context);
    var i, length = obj.length;
    if (length === +length) {
      for (i = 0; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    if (obj == null) return [];
    iteratee = _.iteratee(iteratee, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length),
        currentKey;
    for (var index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = function(obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    iteratee = createCallback(iteratee, context, 4);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index = 0, currentKey;
    if (arguments.length < 3) {
      if (!length) throw new TypeError(reduceError);
      memo = obj[keys ? keys[index++] : index++];
    }
    for (; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = function(obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    iteratee = createCallback(iteratee, context, 4);
    var keys = obj.length !== + obj.length && _.keys(obj),
        index = (keys || obj).length,
        currentKey;
    if (arguments.length < 3) {
      if (!index) throw new TypeError(reduceError);
      memo = obj[keys ? keys[--index] : --index];
    }
    while (index--) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    predicate = _.iteratee(predicate, context);
    _.some(obj, function(value, index, list) {
      if (predicate(value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    predicate = _.iteratee(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(_.iteratee(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    if (obj == null) return true;
    predicate = _.iteratee(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    if (obj == null) return false;
    predicate = _.iteratee(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (obj.length !== +obj.length) obj = _.values(obj);
    return _.indexOf(obj, target) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = obj && obj.length === +obj.length ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = _.iteratee(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = _.iteratee(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = low + high >>> 1;
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return obj.length === +obj.length ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = _.iteratee(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    for (var i = 0, length = input.length; i < length; i++) {
      var value = input[i];
      if (!_.isArray(value) && !_.isArguments(value)) {
        if (!strict) output.push(value);
      } else if (shallow) {
        push.apply(output, value);
      } else {
        flatten(value, shallow, strict, output);
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (array == null) return [];
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = _.iteratee(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = array.length; i < length; i++) {
      var value = array[i];
      if (isSorted) {
        if (!i || seen !== value) result.push(value);
        seen = value;
      } else if (iteratee) {
        var computed = iteratee(value, i, array);
        if (_.indexOf(seen, computed) < 0) {
          seen.push(computed);
          result.push(value);
        }
      } else if (_.indexOf(result, value) < 0) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true, []));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    if (array == null) return [];
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = array.length; i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(slice.call(arguments, 1), true, true, []);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function(array) {
    if (array == null) return [];
    var length = _.max(arguments, 'length').length;
    var results = Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var idx = array.length;
    if (typeof from == 'number') {
      idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);
    }
    while (--idx >= 0) if (array[idx] === item) return idx;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var Ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    args = slice.call(arguments, 2);
    bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      Ctor.prototype = func.prototype;
      var self = new Ctor;
      Ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (_.isObject(result)) return result;
      return self;
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = hasher ? hasher.apply(this, arguments) : key;
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last > 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed before being called N times.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      } else {
        func = null;
      }
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    if (!_.isObject(obj)) return obj;
    var source, prop;
    for (var i = 1, length = arguments.length; i < length; i++) {
      source = arguments[i];
      for (prop in source) {
        if (hasOwnProperty.call(source, prop)) {
            obj[prop] = source[prop];
        }
      }
    }
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj, iteratee, context) {
    var result = {}, key;
    if (obj == null) return result;
    if (_.isFunction(iteratee)) {
      iteratee = createCallback(iteratee, context);
      for (key in obj) {
        var value = obj[key];
        if (iteratee(value, key, obj)) result[key] = value;
      }
    } else {
      var keys = concat.apply([], slice.call(arguments, 1));
      obj = new Object(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        key = keys[i];
        if (key in obj) result[key] = obj[key];
      }
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(concat.apply([], slice.call(arguments, 1)), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    if (!_.isObject(obj)) return obj;
    for (var i = 1, length = arguments.length; i < length; i++) {
      var source = arguments[i];
      for (var prop in source) {
        if (obj[prop] === void 0) obj[prop] = source[prop];
      }
    }
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (
      aCtor !== bCtor &&
      // Handle Object.create(x) cases
      'constructor' in a && 'constructor' in b &&
      !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
        _.isFunction(bCtor) && bCtor instanceof bCtor)
    ) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size, result;
    // Recursively compare objects and arrays.
    if (className === '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size === b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      size = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      result = _.keys(b).length === size;
      if (result) {
        while (size--) {
          // Deep compare each member
          key = keys[size];
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj) || _.isArguments(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around an IE 11 bug.
  if (typeof /./ !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    var pairs = _.pairs(attrs), length = pairs.length;
    return function(obj) {
      if (obj == null) return !length;
      obj = new Object(obj);
      for (var i = 0; i < length; i++) {
        var pair = pairs[i], key = pair[0];
        if (pair[1] !== obj[key] || !(key in obj)) return false;
      }
      return true;
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = createCallback(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? object[property]() : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],12:[function(require,module,exports){
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
  var last = _.last(latlngs);
  var path = geocrunch.path(_.map(latlngs, function (latlng) {
    return [latlng.lng, latlng.lat];
  }));
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
      feet: path.distance({
        units: 'feet'
      }),
      miles: path.distance({
        units: 'miles'
      })
    },
    area: {
      acres: path.area({
        units: 'acres'
      })
    }
  };
};

module.exports = {
  measure: measure // `measure(latLngArray)` - returns object with calced measurements for passed points
};
},{"geocrunch":1,"underscore":11}],13:[function(require,module,exports){
// dom.js
// utility functions for managing DOM elements

var selectOne = function (selector, el) {
  if (!el) {
    el = document;
  }
  return el.querySelector(selector);
};

var selectAll = function (selector, el) {
  if (!el) {
    el = document;
  }
  return Array.prototype.slice.call(el.querySelectorAll(selector));
};

var hide = function (el) {
  if (el) {
    el.setAttribute('style', 'display:none;');
    return el;
  }
};

var show = function (el) {
  if (el) {
    el.removeAttribute('style');
    return el;
  }
};

module.exports = {
  $: selectOne,  // `$('.myclass', baseElement)` - returns selected element or undefined
  $$: selectAll, // `$$('.myclass', baseElement)` - returns array of selected elements
  hide: hide,    // `hide(someElement)` - hide passed dom element
  show: show     // `show(someElement)` - show passed dom element
};
},{}],14:[function(require,module,exports){
(function (global){
// leaflet-measure.js

var _ = require('underscore');
var L = (typeof window !== "undefined" ? window.L : typeof global !== "undefined" ? global.L : null);
var humanize = require('humanize');

var calc = require('./calc');
var dom = require('./dom');
var $ = dom.$;


var controlTemplate = _.template("<a class=\"<%= model.className %>-toggle js-toggle\" href=\"#\" title=\"Measure distances and areas\">Measure</a>\n<div class=\"<%= model.className %>-interaction js-interaction\">\n  <div class=\"js-startprompt startprompt\">\n    <h3>Measure Distances and Areas</h3>\n    <ul class=\"tasks\">\n      <a href=\"#\" class=\"js-start start\">Create a new measurement</a>\n    </ul>\n  </div>\n  <div class=\"js-measuringprompt\">\n    <h3>Measure Distances and Areas</h3>\n    <p class=\"js-starthelp\">Start creating a measurement by adding points to the map</h3>\n    <div class=\"js-results results\"></div>\n    <ul class=\"js-measuretasks tasks\">\n      <li><a href=\"#\" class=\"js-cancel cancel\">Cancel</a></li>\n      <li><a href=\"#\" class=\"js-finish finish\">Finish Measurement</a></li>\n    </ul>\n  </div>\n</div>");
var resultsTemplate = _.template("<div class=\"group\">\n<p class=\"lastpoint heading\">Last Point</p>\n<p><%= model.lastCoord.dms.y %> <span class=\"coorddivider\">/</span> <%= model.lastCoord.dms.x %></p>\n<p><%= humanize.numberFormat(model.lastCoord.dd.y, 6) %> <span class=\"coorddivider\">/</span> <%= humanize.numberFormat(model.lastCoord.dd.x, 6) %></p>\n</div>\n<% if (model.pointCount > 1) { %>\n<div class=\"group\">\n<p><span class=\"heading\">Path Distance</span> <%= humanize.numberFormat(model.length.feet, 0) %> Feet (<%= humanize.numberFormat(model.length.miles, 2) %> Miles)</p>\n</div>\n<% } %>\n<% if (model.pointCount > 2) { %>\n<div class=\"group\">\n<p><span class=\"heading\">Area</span> <%= humanize.numberFormat(model.area.acres, 2) %> Acres</p>\n</div>\n<% } %>");
var pointPopupTemplate = _.template("<h3>Point Location</h3>\n<p><%= model.lastCoord.dms.y %> <span class=\"coorddivider\">/</span> <%= model.lastCoord.dms.x %></p>\n<p><%= humanize.numberFormat(model.lastCoord.dd.y, 6) %> <span class=\"coorddivider\">/</span> <%= humanize.numberFormat(model.lastCoord.dd.x, 6) %></p>\n<ul class=\"tasks\">\n  <li><a href=\"#\" class=\"js-zoomto zoomto\">Center on this Location</a></li>\n  <li><a href=\"#\" class=\"js-deletemarkup deletemarkup\">Delete</a></li>\n</ul>");
var linePopupTemplate = _.template("<h3>Linear Measurement</h3>\n<p><%= humanize.numberFormat(model.length.feet, 0) %> Feet</p>\n<p><%= humanize.numberFormat(model.length.miles, 2) %> Miles</p>\n<ul class=\"tasks\">\n  <li><a href=\"#\" class=\"js-zoomto zoomto\">Center on this Line</a></li>\n  <li><a href=\"#\" class=\"js-deletemarkup deletemarkup\">Delete</a></li>\n</ul>");
var areaPopupTemplate = _.template("<h3>Area Measurement</h3>\n<p><%= humanize.numberFormat(model.area.acres, 2) %> Acres</p>\n<p><%= humanize.numberFormat(model.length.feet, 0) %> Feet (<%= humanize.numberFormat(model.length.miles, 2) %> Miles) Perimeter</p>\n<ul class=\"tasks\">\n  <li><a href=\"#\" class=\"js-zoomto zoomto\">Center on this Area</a></li>\n  <li><a href=\"#\" class=\"js-deletemarkup deletemarkup\">Delete</a></li>\n</ul>");

L.Control.Measure = L.Control.extend({
  _className: 'leaflet-control-measure',
  options: {
    position: 'topright',
    markerSize: 4,    // size of point placed at each vertex - not reachable via css like other styles
    popupOptions: {   // standard leaflet popup options http://leafletjs.com/reference.html#popup-options
      className: 'leaflet-measure-resultpopup',
      autoPanPadding: [10, 10]
    }
  },
  initialize: function (options) {
    L.setOptions(this, options);
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

    if (!this._measureCollector) {
      // polygon to cover all other layers and collection measure move and click events
      this._measureCollector = L.polygon([[90, -180], [90, 180], [-90, 180], [-90, -180]], {
        clickable: true,
        stroke: false,
        fillOpacity: 0.0,
        className: 'layer-measurecollector'
      }).addTo(this._layer);
      this._measureCollector.on('mousemove', this._handleMeasureMove, this);
      this._measureCollector.on('dblclick', this._handleMeasureDoubleClick, this);
      this._measureCollector.on('click', this._handleMeasureClick, this);
    }
    this._measureCollector.bringToFront();

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

    this._measureCollector.off();
    this._layer.removeLayer(this._measureCollector);
    this._measureCollector = null;

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
  // update results area of dom with calced measure from `this._latlngs`
  _updateResults: function () {
    var calced = calc.measure(this._latlngs);
    this.$results.innerHTML = resultsTemplate({
      model: _.extend({}, calced, {
        pointCount: this._latlngs.length
      }),
      humanize: humanize
    });
  },
  // mouse move handler while measure in progress
  // adds floating measure marker under cursor
  _handleMeasureMove: function (evt) {
    if (!this._measureDrag) {
      this._measureDrag = L.circleMarker(evt.latlng, {
        clickable: false,
        radius: this.options.markerSize,
        className: 'layer-measuredrag'
      }).addTo(this._layer);
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
      resultFeature = L.circleMarker(latlngs[0], {
        clickable: true,
        radius: this.options.markerSize,
        className: 'layer-measure-resultpoint'
      });
      popupContent = pointPopupTemplate({
        model: calced,
        humanize: humanize
      });
    } else if (latlngs.length === 2) {
      resultFeature = L.polyline(latlngs, {
        clickable: true,
        fill: false,
        className: 'layer-measure-resultline'
      }).addTo(this._map);
      popupContent = linePopupTemplate({
        model: calced,
        humanize: humanize
      });
    } else {
      resultFeature = L.polygon(latlngs, {
        clickable: true,
        className: 'layer-measure-resultarea'
      });
      popupContent = areaPopupTemplate({
        model: calced,
        humanize: humanize
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
    var latlng = evt.latlng, lastClick = _.last(this._latlngs);

    this._map.closePopup(); // open popups aren't closed on click. may be bug. close popup manually just in case.

    if (!lastClick || !latlng.equals(lastClick)) { // skip if same point as last click, happens on `dblclick`
      this._latlngs.push(latlng);
      this._addMeasureArea(this._latlngs);
      this._addMeasureBoundary(this._latlngs);

      this._measureVertexes.eachLayer(function (layer) {
        // reset all vertexes to non-active class - only last vertex is active
        // `layer.setStyle({ className: 'layer-measurevertex'})` doesn't work. https://github.com/leaflet/leaflet/issues/2662
        // set attribute on path directly
        // NOTE. could be issues with non-SVG browsers or issues because `layer.options.className` is out of sync with actual class
        layer._path.setAttribute('class', 'layer-measurevertex');
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
    L.circleMarker(latlng, {
      clickable: false,
      radius: this.options.markerSize,
      className: 'layer-measurevertex active'
    }).addTo(this._measureVertexes);
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
      this._measureArea = L.polygon(latlngs, {
        clickable: false,
        className: 'layer-measurearea'
      }).addTo(this._layer);
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
      this._measureBoundary = L.polyline(latlngs, {
        clickable: false,
        fill: false,
        className: 'layer-measureboundary'
      }).addTo(this._layer);
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
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./calc":12,"./dom":13,"humanize":10,"underscore":11}]},{},[14]);
