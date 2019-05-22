'use strict';

/**
 * Based off of [the offical Google document](https://developers.google.com/maps/documentation/utilities/polylinealgorithm)
 *
 * Some parts from [this implementation](http://facstaff.unca.edu/mcmcclur/GoogleMaps/EncodePolyline/PolylineEncoder.js)
 * by [Mark McClure](http://facstaff.unca.edu/mcmcclur/)
 *
 * @module polyline
 */

var polyline = {};

function py2_round(value) {
    // Google's polyline algorithm uses the same rounding strategy as Python 2, which is different from JS for negative values
    return Math.floor(Math.abs(value) + 0.5) * (value >= 0 ? 1 : -1);
}

function encode(current, previous, factor) {
    current = py2_round(current * factor);
    previous = py2_round(previous * factor);
    var coordinate = current - previous;
    coordinate <<= 1;
    if (current - previous < 0) {
        coordinate = ~coordinate;
    }
    var output = '';
    while (coordinate >= 0x20) {
        output += String.fromCharCode((0x20 | (coordinate & 0x1f)) + 63);
        coordinate >>= 5;
    }
    output += String.fromCharCode(coordinate + 63);
    return output;
}

/**
 * Decodes to a [latitude, longitude] coordinates array.
 *
 * This is adapted from the implementation in Project-OSRM.
 *
 * @param {String} str
 * @param {Number} precision
 * @returns {Array}
 *
 * @see https://github.com/Project-OSRM/osrm-frontend/blob/master/WebContent/routing/OSRM.RoutingGeometry.js
 */
polyline.decode = function(str, precision) {
    var index = 0,
        lat = 0,
        lng = 0,
        coordinates = [],
        shift = 0,
        result = 0,
        byte = null,
        latitude_change,
        longitude_change,
        factor = Math.pow(10, Number.isInteger(precision) ? precision : 5);

    // Coordinates have variable length when encoded, so just keep
    // track of whether we've hit the end of the string. In each
    // loop iteration, a single coordinate is decoded.
    while (index < str.length) {

        // Reset shift, result, and byte
        byte = null;
        shift = 0;
        result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        shift = result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        lat += latitude_change;
        lng += longitude_change;

        coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
};

/**
 * Encodes the given [latitude, longitude] coordinates array.
 *
 * @param {Array.<Array.<Number>>} coordinates
 * @param {Number} precision
 * @returns {String}
 */
polyline.encode = function(coordinates, precision) {
    if (!coordinates.length) { return ''; }

    var factor = Math.pow(10, Number.isInteger(precision) ? precision : 5),
        output = encode(coordinates[0][0], 0, factor) + encode(coordinates[0][1], 0, factor);

    for (var i = 1; i < coordinates.length; i++) {
        var a = coordinates[i], b = coordinates[i - 1];
        output += encode(a[0], b[0], factor);
        output += encode(a[1], b[1], factor);
    }

    return output;
};

function flipped(coords) {
    var flipped = [];
    for (var i = 0; i < coords.length; i++) {
        flipped.push(coords[i].slice().reverse());
    }
    return flipped;
}

/*
 * Polygon coordinates includes a 3rd parameter, so replaced the flipped option which brought
 * the 3rd parameter to the front, with a more basic swapped function, that just swaps the first and second
 * items in the array (array index 0 and 1) 
*/
function swapped(coords) {
    var swapped = [];
    for (var i = 0; i < coords.length; i++) {
        var c = coords[i].slice();
        c[0] = coords[i][1];
        c[1] = coords[i][0];
        swapped.push(c);
    }
    return swapped;
}

/*
 * Utility to function to get depth of array, as found the input Polygon may go one level deeper than expected
*/
function getDepthOfArray(arr) {

    var depth = 0;
    var included = [];
  
    function checkDepth(arr, included, level) {
      if (Array.isArray(arr)) {
        depth++;
        included[level] = true;
        checkDeeper(arr, included, level+1)
      }
    };
  
    function checkDeeper(arr, included, level) {
      for (var i = 0; i < arr.length; i++) {
        if (Array.isArray(arr[i])) {
          if (!included[level]) {
            depth++;
            included[level] = true;
          }
          checkDeeper(arr[i], included, level+1);
        }
      };
    };
  
    checkDepth(arr, included, 0);
    return depth;
}

/**
 * Encodes a GeoJSON LineString feature/geometry.
 *
 * @param {Object} geojson
 * @param {Number} precision
 * @returns {String}
 */
polyline.fromGeoJSON = function(geojson, precision) {
    if (geojson && geojson.type === 'FeatureCollection') {
        return fromFeatureCollection(geojson, precision);
    }
    return fromFeature(geojson, precision)
};

function fromFeatureCollection(geojson, precision) {
    var geojsons = geojson.features;
    var paths = [];
    if (Array.isArray(geojsons)) {
        for (var i = 0; i < geojsons.length; i++) {
            paths.push(fromFeature(geojsons[i], precision));
        };
    }
    return { encodedPaths: paths };
}

function fromFeature(geojson, precision) {
    if (geojson && geojson.type === 'Feature') {
        geojson = geojson.geometry;
    }
    if (!geojson || (geojson.type !== 'LineString' && geojson.type !== 'Polygon')) {
        throw new Error('Input must be a GeoJSON LineString or Polygon');
    }
    while (getDepthOfArray(geojson.coordinates) > 2) {
        geojson.coordinates = geojson.coordinates[0];
    }
    return polyline.encode(swapped(geojson.coordinates), precision);
}

/**
 * Decodes to a GeoJSON LineString geometry.
 *
 * @param {String} str
 * @param {Number} precision
 * @returns {Object}
 */
polyline.toGeoJSON = function(str, precision) {
    var coords = polyline.decode(str, precision);
    return {
        type: 'LineString',
        coordinates: flipped(coords)
    };
};

if (typeof module === 'object' && module.exports) {
    module.exports = polyline;
}
