[![Build Status](https://travis-ci.com/mapbox/polyline.svg)](http://travis-ci.com/mapbox/polyline) [![codecov](https://codecov.io/gh/mapbox/polyline/branch/master/graph/badge.svg)](https://codecov.io/gh/mapbox/polyline)
# polyline

A simple [google-esque polyline](https://developers.google.com/maps/documentation/utilities/polylinealgorithm)
implementation in Javascript. Compatible with nodejs (`npm install @mapbox/polyline` and the browser (copy `src/polyline.js`)).

Encodes from / decodes into `[lat, lng]` coordinate pairs. Use `fromGeoJSON()` to encode from GeoJSON objects, or `toGeoJSON` to
decode to a GeoJSON LineString.

## Installation

    npm install @mapbox/polyline
    
Note that the old package `polyline` has been deprecated in favor of `@mapbox/polyline` (the old package remain but won't receive updates).

## Example

```js
var polyline = require('@mapbox/polyline');

// returns an array of lat, lon pairs
polyline.decode('_p~iF~ps|U_ulLnnqC_mqNvxq`@');

// returns an array of lat, lon pairs from polyline6 by passing a precision parameter
polyline.decode('cxl_cBqwvnS|Dy@ogFyxmAf`IsnA|CjFzCsHluD_k@hi@ljL', 6);

// returns a GeoJSON LineString feature
polyline.toGeoJSON('_p~iF~ps|U_ulLnnqC_mqNvxq`@');

// returns a string-encoded polyline (from coordinate ordered lat,lng)
polyline.encode([[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]]);

// returns a string-encoded polyline from a GeoJSON LineString or Polygon
polyline.fromGeoJSON({ "type": "Feature",
  "geometry": {
    "type": "LineString",
    "coordinates": [[-120.2, 38.5], [-120.95, 40.7], [-126.453, 43.252]]
  },
  "properties": {}
});

// returns a string-encoded polyline from a GeoJSON LineString or Polygon
polyline.fromGeoJSON({ "name":"CLoCCS_Boundary (JSON)","type":"FeatureCollection"
  ,"features":[
    {"type":"Feature","geometry":{"type":"Polygon","coordinates":[[
      [-0.149771209943531,51.5032950990106,0],[-0.149910546128835,51.5032456944487,0],[-0.150019915309231,51.5032116402553,0],
      [-0.150200298632032,51.5031695354625,0],[-0.150313232173393,51.5031472238773,0],[-0.150554898042159,51.5031085120968,0],
      [-0.149826090184599,51.5033421727736,0],[-0.149771209943531,51.5032950990106,0]]]},"properties":
      {"OBJECTID":1,"BOUNDARY":"CLoCCS", "DESCRIPTIO":"Central London Congestion Charging Scheme","SHAPE_AREA":0,"SHAPE_LEN":0}}
    ,{"type":"Feature","geometry":{"type":"Polygon","coordinates":[[
      [-0.106343168936631,51.5318176222392,0],[-0.106039777013134,51.5317808098759,0],[-0.105901735336719,51.5317556573613,0],
      [-0.105521077921582,51.5315956026483,0],[-0.0782388143744422,51.5027143033449,0],[-0.165870454874022,51.5192644822077,0],
      [-0.10971243678472,51.5317186840771,0],[-0.106598622716693,51.5318293874794,0],[-0.106343168936631,51.5318176222392,0]]]},"properties":
      {"OBJECTID":2,"BOUNDARY":"CLoCCS","DESCRIPTIO":"Central London Congestion Charging Scheme","SHAPE_AREA":0,"SHAPE_LEN":0}}
  ]
});

```

[API Documentation](https://github.com/mapbox/polyline/blob/master/API.md)

## Command line

Install globally or run `./node_modules/.bin/polyline`.

Send input via stdin and use `--decode`, `--encode`, `--toGeoJSON`, or `--fromGeoJSON` flags. If omitted will default to `--decode`.

Example :

```
cat file.json | ./bin/polyline.bin.js --fromGeoJSON > result.txt
```

## Specific adaptions in this forked version (by pgmoir)

For handling geojson files generated with multiple Features (of both LineString and Polygon format) and stored in a FeatureCollection array, enhancements to the existing code were required.

The key changes were:

- adding "swapped" function. The "flipped" function reverses the whole array. Good for lat-long only arrays, but geojson can also contain elevation. "swapped" only swaps the 1st and 2nd elements. The rest of array stays the same. NB. The swapping is done only to convert for certain applications. See [this article](https://macwright.org/2015/03/23/geojson-second-bite.html#coordinate) for details.
- added "getDepthOfArray" function. The polyline functions for linestring assumed two levels depath of array, but polygons are three, to cater for interior rings. [RFC 7946 GeoJSON Spec - Polygons](https://tools.ietf.org/html/rfc7946#section-3.1.6) This feature may be obsolete since we know we have exactly 3 levels.
- changed "fromGeoJSON" to only control whether to encode FeatureCollection or just a single Feature
- added "fromFeature" function. This essentially is the original "fromGeoJSON" function, but with one amendment. It includes a check on depth of array (see new function mentioned earlier), and reduces it down to just two, so that the original encoding works unaltered.
- added "fromFeatureCollection" function. This wrapper, just handles a GeoJSON file with an array of Features. It also outputs the results encased in an object with single "EncodedPaths" array property.

This does not complete the encoding for all types of GeoJSON shapes as described in the [RFC 7946 GeoJSON Spec](https://tools.ietf.org/html/rfc7946), but was enough to complete the task in hand.

Also included in the repo (in new "Files" folder):

- an example of the GeoJson non encoded file, ccz-geojson.json
- an example of the GeoJson encoded paths file, ccz.json

Example encoding of FeatureCollection format GeoJSON file:

```
cat ./files/ccz-geo.json | ./bin/polyline.bin.js --fromGeoJSON > ./files/ccz.json
```

## A very handy read - check out this website for a clear explanation of GeoJSON

[More than you ever wanted to know about GeoJSON](https://macwright.org/2015/03/23/geojson-second-bite.html#coordinate)
