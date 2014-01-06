/**
 * User: DennisHoeting
 * Date: 06.08.13
 * Time: 20:14
 *
 * $
 */
module.exports.KMLParser = (function () {
    var xml2js = undefined;
    var q = undefined;
    var logger = undefined;

    var kmlFile = '';

    function KMLParser(configs) {
        xml2js = configs.xml2js;
        q = configs.q;
        logger = configs.logger;
    }

    KMLParser.prototype.readFile = function (file) {
        var deferred = q.defer();
        kmlFile = file;
        deferred.resolve(true);
        return deferred.promise;
    };

    KMLParser.prototype.parseToGPSDataArray = function (userId) {
        var deferred = q.defer();
        var bulk = [];
        var gxTracks = [];

        function search(obj, pattern) {
            var result = [];
            for (var key in obj) {
                if (key === pattern) {
                    result.push({'gx:Track': obj[key]});
                } else if (typeof obj[key] == 'object') {
                    result = result.concat(search(obj[key], pattern));
                }
            }
            return result;
        }

        xml2js.parseString(kmlFile, function (err, res) {
            if (res) {
                gxTracks = search(res, 'gx:Track');

                for (var i = 0, track; i < gxTracks.length; i++) {
                    for (var j = 0; j < gxTracks[i]['gx:Track'].length; j++) {
                        track = gxTracks[i]['gx:Track'][j];
                        if (!(track['when'] && track['gx:coord'])) {
                            throw new Error('Track broken.');
                        }
                        for (var k = 0, when, coord, speed, res; k < track['when'].length; k++) {
                            if (!(track['when'][k] && track['gx:coord'][k])) {
                                throw new Error('Track broken.');
                            }

                            when = new Date(track['when'][k]);
                            coord = track['gx:coord'][k].split(' ');

                            // optionals
                            speed = track['speed'] && track['speed'][k] ? track['speed'][k] : 0;

                            res = {
                                userId: userId,
                                timestamp: when,
                                position: 'POINT(' + Number(coord[0]) + ' ' + Number(coord[1]) + ')',
                                speed: speed,
                                accuracy: 0,
                                providerId: 4
                            };

                            if (userId != undefined && !isNaN(when.getTime()) && coord[0] != undefined && coord[1] != undefined) {
                                bulk.push(res);
                            }
                        }
                    }
                }

                deferred.resolve(bulk);
            } else {
                deferred.reject(err);
            }
        });

        return deferred.promise;
    };

    return KMLParser;
})();