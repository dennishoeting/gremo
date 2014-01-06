/**
 * User: DennisHoeting
 * Date: 07.08.13
 * Time: 10:09
 *
 * $
 */
suite('KML Parser Tests', function () {
    var assert = require('node-assertthat');
    var xml2js = require('xml2js');
    var util = require('util');
    test('Should work (TMP)', function (done) {
        function search(obj, pattern) {
            var result = [];
            for (var key in obj) {
                if (key === 'gx:Track') {
                    result.push({'gx:Track': obj[key]});
                } else if (typeof obj[key] == 'object') {
                    result = result.concat(search(obj[key], pattern));
                }
            }
            return result;
        }

        var xml = '<Document>' +
            '<gx:Track><when>2010-05-01T13:00:09-05</when><gx:coord>52.6 7.4</gx:coord></gx:Track>' +
            '<gx:Track><when>2010-05-01T13:00:09-05</when><gx:coord>52.6 7.4</gx:coord></gx:Track>' +
            '</Document>'

        xml2js.parseString(xml, function (err, res) {
            var kml = res;
            var bulk = [];

            console.log(util.inspect(kml, false, null));

            var gxTracks = search(kml, 'gx:Track');
            for (var i = 0, track; i < gxTracks.length; i++) {
                for (var j = 0; j < gxTracks[i]['gx:Track'].length; j++) {
                    track = gxTracks[i]['gx:Track'][j];
                    if (!(track['when'] && track['gx:coord'])) {
                        throw new Error('Track broken.');
                    }
                    for (var k = 0, when, coord, speed; k < track['when'].length; k++) {
                        if (!(track['when'][k] && track['gx:coord'][k])) {
                            throw new Error('Track broken.');
                        }

                        when = new Date(track['when'][k]);
                        coord = track['gx:coord'][k].split(' ');

                        // optionals
                        speed = track['speed'] && track['speed'][k] ? track['speed'][k] : 0;

                        bulk.push({
                            time: when.getTime(),
                            lat: Number(coord[1]),
                            lng: Number(coord[0]),
                            speed: speed,
                            accuracy: 0,
                            providerId: 4
                        });
                    }
                }
            }

            console.log('KMLParserTests.js: ', bulk);
            assert.that(true, is.true());

            done();
        });
    });
});