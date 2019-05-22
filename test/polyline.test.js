'use strict';

var test = require('tap').test,
    polyline = require('../');

test('polyline', function(t) {
    var example = [[38.5, -120.2], [40.7, -120.95], [43.252, -126.453]],
        example_zero = [[39, -120], [41, -121], [43, -126]],
        // encoded value will enclude slashes -> tests escaping
        example_slashes = [[35.6, -82.55], [35.59985, -82.55015], [35.6, -82.55]],
        example_flipped = [[-120.2, 38.5], [-120.95, 40.7], [-126.453, 43.252]],
        example_polygon = [[[-120.2, 38.5, 0], [-120.95, 40.7, 0], [-126.453, 43.252, 0], [-120.2, 38.5, 0]]],
        example_rounding = [[0, 0.000006], [0, 0.000002]],
        example_rounding_negative = [[36.05322, -112.084004], [36.053573, -112.083914], [36.053845, -112.083965]];

    var geojson = { 'type': 'Feature',
        'geometry': {
            'type': 'LineString',
            'coordinates': example_flipped
        },
        'properties': {}
    };

    var geojsonPolygon = { 'type': 'Feature',
        'geometry': {
            'type': 'Polygon',
            'coordinates': example_polygon
        },
        'properties': {}
    };

    var featureCollection = {'name':'CLoCCS_Boundary (JSON)','type':'FeatureCollection'
        ,'features':[
            {'type':'Feature','geometry':{'type':'Polygon','coordinates':[[[-0.149771209943531,51.5032950990106,0],[-0.149910546128835,51.5032456944487,0],[-0.150019915309231,51.5032116402553,0],[-0.150200298632032,51.5031695354625,0],[-0.150313232173393,51.5031472238773,0],[-0.150554898042159,51.5031085120968,0],[-0.149826090184599,51.5033421727736,0],[-0.149771209943531,51.5032950990106,0]]]},'properties':{'OBJECTID':1,'BOUNDARY':'CLoCCS','DESCRIPTIO':'Central London Congestion Charging Scheme','SHAPE_AREA':0,'SHAPE_LEN':0}}
            ,{'type':'Feature','geometry':{'type':'Polygon','coordinates':[[[-0.106343168936631,51.5318176222392,0],[-0.106039777013134,51.5317808098759,0],[-0.105901735336719,51.5317556573613,0],[-0.105521077921582,51.5315956026483,0],[-0.0782388143744422,51.5027143033449,0],[-0.165870454874022,51.5192644822077,0],[-0.10971243678472,51.5317186840771,0],[-0.106598622716693,51.5318293874794,0],[-0.106343168936631,51.5318176222392,0]]]},'properties':{'OBJECTID':2,'BOUNDARY':'CLoCCS','DESCRIPTIO':'Central London Congestion Charging Scheme','SHAPE_AREA':0,'SHAPE_LEN':0}}
        ]
    };

    t.test('#decode()', function(t) {
        t.test('decodes an empty Array', function(t) {
            t.deepEqual(polyline.decode(''), []);
            t.end();
        });

        t.test('decodes a String into an Array of lat/lon pairs', function(t) {
            t.deepEqual(polyline.decode('_p~iF~ps|U_ulLnnqC_mqNvxq`@'), example);
            t.end();
        });

        t.test('decodes with a custom precision', function(t) {
            t.deepEqual(polyline.decode('_izlhA~rlgdF_{geC~ywl@_kwzCn`{nI', 6), example);
            t.end();
        });

        t.test('decodes with precision 0', function(t) {
            t.deepEqual(polyline.decode('mAnFC@CH', 0), example_zero);
            t.end();
        });

        t.end();
    });

    t.test('#identity', function(t) {
        t.test('feed encode into decode and check if the result is the same as the input', function(t) {
            t.deepEqual(polyline.decode(polyline.encode(example_slashes)), example_slashes);
            t.end();
        });

        t.test('feed decode into encode and check if the result is the same as the input', function(t) {
            t.equal(polyline.encode(polyline.decode('_chxEn`zvN\\\\]]')), '_chxEn`zvN\\\\]]');
            t.end();
        });

        t.end();
    });

    t.test('#encode()', function(t) {
        t.test('encodes an empty Array', function(t) {
            t.equal(polyline.encode([]), '');
            t.end();
        });

        t.test('encodes an Array of lat/lon pairs into a String', function(t) {
            t.equal(polyline.encode(example), '_p~iF~ps|U_ulLnnqC_mqNvxq`@');
            t.end();
        });

        t.test('encodes with proper rounding', function(t) {
            t.equal(polyline.encode(example_rounding), '?A?@');
            t.end();
        });

        t.test('encodes with proper negative rounding', function(t) {
            t.equal(polyline.encode(example_rounding_negative), 'ss`{E~kbkTeAQw@J');
            t.end();
        });

        t.test('encodes with a custom precision', function(t) {
            t.equal(polyline.encode(example, 6), '_izlhA~rlgdF_{geC~ywl@_kwzCn`{nI');
            t.end();
        });

        t.test('encodes with precision 0', function(t) {
            t.equal(polyline.encode(example, 0), 'mAnFC@CH');
            t.end();
        });

        t.test('encodes negative values correctly', function(t) {
            t.ok(polyline.decode(polyline.encode([[-107.3741825, 0]], 7), 7)[0][0] < 0);
            t.end();
        });


        t.end();
    });

    t.test('#fromGeoJSON()', function(t) {
        t.test('throws for non linestrings/polygons and non feature collections', function(t) {
            t.throws(function() {
                polyline.fromGeoJSON({});
            }, /Input must be a GeoJSON LineString or Polygon/);
            t.end();
        });

        t.test('allows geojson geometries for linestring', function(t) {
            t.equal(polyline.fromGeoJSON(geojson.geometry), '_p~iF~ps|U_ulLnnqC_mqNvxq`@');
            t.end();
        });

        t.test('allows geojson geometries for polygons', function(t) {
            t.equal(polyline.fromGeoJSON(geojsonPolygon.geometry), '_p~iF~ps|U_ulLnnqC_mqNvxq`@~b_\\ghde@');
            t.end();
        });

        t.test('allows geojson feature collection', function(t) {
            t.equal(JSON.stringify(polyline.fromGeoJSON(featureCollection)), 
                JSON.stringify({ encodedPaths: ["sfjyH`g\\HZFTFb@BTFn@m@oCFK", "{xoyHrwSF{@B[^kApsDoiDmfBtbP{lA_~IUmR@s@"]}));
            t.end();
        });

        t.test('flips coordinates and encodes', function(t) {
            t.equal(polyline.fromGeoJSON(geojson), '_p~iF~ps|U_ulLnnqC_mqNvxq`@');
            t.end();
        });

        t.end();
    });

    t.test('#toGeoJSON()', function(t) {
        t.test('flips coordinates and decodes geometry', function(t) {
            t.deepEqual(polyline.toGeoJSON('_p~iF~ps|U_ulLnnqC_mqNvxq`@'), geojson.geometry);
            t.end();
        });

        t.end();
    });

    t.end();
});
