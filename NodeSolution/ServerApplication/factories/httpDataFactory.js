/**
 * User: DennisHoeting
 * Date: 19.06.13
 * Time: 21:01
 *
 * $
 */

module.exports.HTTPDataFactory = (function () {
    function HTTPDataFactory(configs) {
        this.q = configs.q;
        this.logger = configs.logger;
        this._ = configs.underscore;
    }

    HTTPDataFactory.prototype.getLoginData = function (req) {
        var deferred = this.q.defer();
        if (req.body == undefined) {
            deferred.reject(new Error('Body may not be undefined!'));
        } else if (req.body.username == undefined) {
            deferred.reject(new Error('Username may not be undefined!'));
        } else if (typeof req.body.username != 'string') {
            deferred.reject(new Error('Username must be a string!'));
        } else if (req.body.username.length < 1) {
            deferred.reject(new Error('Username may not be empty!'));
        } else if (req.body.password == undefined) {
            deferred.reject(new Error('Password may not be undefined!'));
        } else if (req.body.password.length < 1) {
            deferred.reject(new Error('Password may not be empty!'));
        } else {
            deferred.resolve({
                login: req.body.username,
                password: req.body.password
            });
        }

        return deferred.promise;
    };

    HTTPDataFactory.prototype.getUserPointRequestData = function (req) {
        var deferred = this.q.defer();

        if (req.params == undefined) {
            deferred.reject(new Error('Params may not be undefined!'));
        } else if (req.params.userId == undefined) {
            deferred.reject(new Error('UserId may not be undefined!'));
        } else if (isNaN(req.params.userId)) {
            deferred.reject(new Error('UserId must be a number!'));
        } else {
            deferred.resolve({
                userId: req.params.userId
            });
        }

        return deferred.promise;
    };

    HTTPDataFactory.prototype.getActionListRequestData = function (req) {
        var deferred = this.q.defer();


        if (req.params == undefined) {
            deferred.reject(new Error('Params must not be undefined!'));
        } else if (req.params.userId == undefined) {
            deferred.reject(new Error('UserId must not be undefined!'));
        } else if (isNaN(req.params.userId)) {
            deferred.reject(new Error('UserId must be a number!'));
        } else if (req.query == undefined) {
            deferred.reject(new Error('Query must not be undefined!'));
        } else {
            var limit = parseInt(req.query.limit) || 10;
            var offset = parseInt(req.query.offset) || 0;

            deferred.resolve({
                userId: req.params.userId,
                limit: limit,
                offset: offset
            });
        }


        return deferred.promise;
    };

    HTTPDataFactory.prototype.getStartActionData = function (req) {
        var deferred = this.q.defer();

        if (req.params == undefined) {
            deferred.reject(new Error('Params must not be undefined!'));
        } else if (req.params.userId == undefined) {
            deferred.reject(new Error('UserId must not be undefined!'));
        } else if (isNaN(req.params.userId)) {
            deferred.reject(new Error('UserId must be a number!'));
        } else if (req.body == undefined) {
            deferred.reject(new Error('Body must not be undefined!'));
        } else if (req.body.actionType == undefined) {
            deferred.reject(new Error('ActionType must not be undefined!'));
        } else if (isNaN(req.body.actionType)) {
            deferred.reject(new Error('ActionType must be a number!'));
        } else {
            deferred.resolve({
                userId: req.params.userId,
                mac: req.body.mac, // might be undefined
                typeId: req.body.actionType
            });
        }

        return deferred.promise;
    };

    HTTPDataFactory.prototype.getStopActionData = function (req) {
        var deferred = this.q.defer();

        if (req.params == undefined) {
            deferred.reject(new Error('Params must not be undefined!'));
        } else if (req.params.userId == undefined) {
            deferred.reject(new Error('userId must not be undefined!'));
        } else if (isNaN(req.params.userId)) {
            deferred.reject(new Error('userId must be a number!'));
        } else {
            deferred.resolve({
                userId: req.params.userId
            });
        }

        return deferred.promise;
    };

    HTTPDataFactory.prototype.getPushGPSData = function (req) {
        var deferred = this.q.defer();

        if (req.params == undefined) {
            deferred.reject(new Error('Body must not be undefined!'));
        } else if (req.params.userId == undefined) {
            deferred.reject(new Error('userId must not be undefined!'));
        } else if (isNaN(req.params.userId)) {
            deferred.reject(new Error('userId must be a number!'));
        } else if (req.body == undefined) {
            deferred.reject(new Error('Body must not be undefined!'));
        } else if (req.body.bulk == undefined) {
            deferred.reject(new Error('bulk must not be undefined!'));
        } else {
            var bulk = [];
            for (var i = 0; i < req.body.bulk.length; i++) {
                var entry = req.body.bulk[i];

                if (entry.lat == undefined) {
                    deferred.reject(new Error('lat must not be undefined!'));
                } else if (isNaN(entry.lat)) {
                    deferred.reject(new Error('lat must be a number!'));
                } else if (entry.lng == undefined) {
                    deferred.reject(new Error('lng must not be undefined!'));
                } else if (isNaN(entry.lng)) {
                    deferred.reject(new Error('lng must be a number!'));
                } else if (entry.time == undefined) {
                    deferred.reject(new Error('time must not be undefined!'));
                } else if (isNaN(entry.time)) {
                    deferred.reject(new Error('time must be a number!'));
                } else if (entry.speed == undefined) {
                    deferred.reject(new Error('speed must not be undefined!'));
                } else if (isNaN(entry.speed)) {
                    deferred.reject(new Error('speed must be a number!'));
                } else if (entry.accuracy == undefined) {
                    deferred.reject(new Error('accuracy must not be undefined!'));
                } else if (isNaN(entry.accuracy)) {
                    deferred.reject(new Error('accuracy must be a number!'));
                } else if (entry.providerId == undefined) {
                    deferred.reject(new Error('providerId must not be undefined!'));
                } else if (isNaN(entry.providerId)) {
                    deferred.reject(new Error('providerId must be a number!'));
                } else {
                    bulk.push({
                        userId: parseInt(req.params.userId),
                        speed: entry.speed,
                        accuracy: entry.accuracy,
                        position: 'POINT(' + entry.lng + ' ' + entry.lat + ')',
                        timestamp: new Date(entry.time),
                        providerId: entry.providerId
                    });
                }
            }
            deferred.resolve(bulk);
        }

        return deferred.promise;
    };

    HTTPDataFactory.prototype.getPushBluetoothData = function (req) {
        var deferred = this.q.defer();

        if (req.params == undefined) {
            deferred.reject(new Error('Body must not be undefined!'));
        } else if (req.params.userId == undefined) {
            deferred.reject(new Error('userId must not be undefined!'));
        } else if (isNaN(req.params.userId)) {
            deferred.reject(new Error('userId must be a number!'));
        } else if (req.body == undefined) {
            deferred.reject(new Error('Body must not be undefined!'));
        } else if (req.body.bulk == undefined) {
            deferred.reject(new Error('bulk must not be undefined!'));
        } else {
            var bulk = [];
            for (var i = 0; i < req.body.bulk.length; i++) {
                var entry = req.body.bulk[i];

                if (entry.scanResult == undefined) {
                    deferred.reject(new Error('ScanResult must not be undefined!'));
                } else if (!(entry.scanResult instanceof Array)) {
                    deferred.reject(new Error('ScanResult must be an array!'));
                } else {
                    var actorIds = [];
                    var timestamps = [];
                    var bluetoothClasses = [];

                    var result = undefined;
                    for (var j = 0; j < entry.scanResult.length; j++) {
                        result = entry.scanResult[j];
                        if (result.bluetoothId == undefined || typeof result.bluetoothId != 'string') {
                            deferred.reject(new Error('Scanned id ' + result.bluetoothId + ' is not valid'));
                        } else if (result.time == undefined || isNaN(result.time)) {
                            deferred.reject(new Error('Scanned time ' + result.time + ' is not valid'));
                        } else if (result.bluetoothClass == undefined || isNaN(result.bluetoothClass)) {
                            deferred.reject(new Error('Scanned bluetoothClass ' + result.bluetoothClass + ' is not valid'));
                        } else {
                            actorIds.push(result.bluetoothId);
                            timestamps.push(new Date(result.time));
                            bluetoothClasses.push(result.bluetoothClass);
                        }
                    }

                    bulk.push({
                        userId: req.params.userId,
                        actorIds: actorIds,
                        timestamps: timestamps,
                        bluetoothClasses: bluetoothClasses
                    });
                }
            }
            deferred.resolve(bulk);
        }

            return deferred.promise;
    };

    //TODO test
    HTTPDataFactory.prototype.getPushMotionData = function (req) {
        var deferred = this.q.defer();

        if (req.params == undefined) {
            deferred.reject(new Error('Body must not be undefined!'));
        } else if (req.params.userId == undefined) {
            deferred.reject(new Error('userId must not be undefined!'));
        } else if (isNaN(req.params.userId)) {
            deferred.reject(new Error('userId must be a number!'));
        } else if (req.body == undefined) {
            deferred.reject(new Error('Body must not be undefined!'));
        } else if (req.body.bulk == undefined) {
            deferred.reject(new Error('bulk must not be undefined!'));
        } else {
            var bulk = [];
            for (var i = 0; i < req.body.bulk.length; i++) {
                var entry = req.body.bulk[i];
                if (entry.time == undefined) {
                    deferred.reject(new Error('time must not be undefined!'));
                } else if (isNaN(entry.time)) {
                    deferred.reject(new Error('time must be a number!'));
                } else if (entry.x == undefined) {
                    deferred.reject(new Error('x must not be undefined!'));
                } else if (isNaN(entry.x)) {
                    deferred.reject(new Error('x must be a number!'));
                } else if (entry.y == undefined) {
                    deferred.reject(new Error('y must not be undefined!'));
                } else if (isNaN(entry.y)) {
                    deferred.reject(new Error('y must be a number!'));
                } else if (entry.z == undefined) {
                    deferred.reject(new Error('z must not be undefined!'));
                } else if (isNaN(entry.z)) {
                    deferred.reject(new Error('z must be a number!'));
                } else {
                    bulk.push({
                        userId: req.params.userId,
                        timestamp: new Date(entry.time),
                        x: entry.x,
                        y: entry.y,
                        z: entry.z
                    });
                }
            }
            deferred.resolve(bulk);
        }

        return deferred.promise;
    };

    HTTPDataFactory.prototype.getPushWifiData = function (req) {
        var deferred = this.q.defer();

        if (req.params == undefined) {
            deferred.reject(new Error('Params must not be undefined!'));
        } else if (req.params.userId == undefined) {
            deferred.reject(new Error('UserId must not be undefined!'));
        } else if (req.body == undefined) {
            deferred.reject(new Error('Body must not be undefined!'));
        } else if (req.body.bulk == undefined) {
            deferred.reject(new Error('bulk must not be undefined!'));
        } else {
            var bulk = [];
            for (var i = 0; i < req.body.bulk.length; i++) {
                //this.logger.info('current: ', entry);
                var entry = req.body.bulk[i];
                if (entry.wifirouterBSSIDs == undefined) {
                    deferred.reject(new Error('wifirouterBSSIDs must not be undefined!'));
                } else if (entry.wifirouterBSSIDs.length < 1) {
                    deferred.reject(new Error('wifirouterBSSIDs must not be empty!'));
                } else if (entry.wifirouterSSIDs == undefined) {
                    deferred.reject(new Error('wifirouterSSIDs must not be undefined!'));
                } else if (entry.wifirouterSSIDs.length < 1) {
                    deferred.reject(new Error('wifirouterSSIDs must not be empty!'));
                } else if (entry.time == undefined) {
                    deferred.reject(new Error('Time must not be undefined!'));
                } else if (isNaN(entry.time)) {
                    deferred.reject(new Error('Time must be a number!'));
                } else {
                    var _this = this;
                    var changedSSIDs = [];
                    this._.forEach(entry.wifirouterSSIDs, function (ssid) {
                        //FIXME: encode utf8
                        changedSSIDs.push(ssid.replace("\uFFFD", "_"));
                    });

                    bulk.push({
                        userId: req.params.userId,
                        wifirouterBSSIDs: entry.wifirouterBSSIDs,
                        wifirouterSSIDs: changedSSIDs,
                        timestamp: new Date(entry.time)
                    });
                }
            }
            deferred.resolve(bulk);
        }

        return deferred.promise;
    };

    HTTPDataFactory.prototype.getAddWifiRouterData = function (req) {
        var deferred = this.q.defer();

        if (req.body == undefined) {
            deferred.reject(new Error('Body must not be undefined!'));
        } else if (req.body.bssid == undefined) {
            deferred.reject(new Error('BSSID must not be undefined!'));
        } else if (typeof req.body.bssid != 'string') {
            deferred.reject(new Error('BSSID must be a string!'));
        } else if (req.body.ssid == undefined) {
            deferred.reject(new Error('SSID must not be undefined!'));
        } else if (req.body.lat == undefined) {
            deferred.reject(new Error('Lat must not be undefined!'));
        } else if (isNaN(req.body.lat)) {
            deferred.reject(new Error('Lat must be a number!'));
        } else if (req.body.lng == undefined) {
            deferred.reject(new Error('Lng must not be undefined!'));
        } else if (isNaN(req.body.lng)) {
            deferred.reject(new Error('Lng must be a number!'));
        } else if (req.body.typeId == undefined) {
            deferred.reject(new Error('TypeId must not be undefined!'));
        } else if (isNaN(req.body.typeId)) {
            deferred.reject(new Error('TypeId must be a number!'));
        } else {
            if (req.body.pointsperdetection == undefined || isNaN(req.body.pointsperdetection)) {
                req.body.pointsperdetection = 5;
            }

            deferred.resolve({
                bssid: req.body.bssid,
                ssid: req.body.ssid,
                position: 'POINT(' + req.body.lng + ' ' + req.body.lat + ')',
                typeId: req.body.typeId,
                pointsperdetection: req.body.pointsperdetection
            });
        }

        return deferred.promise;
    };

    HTTPDataFactory.prototype.getAddBluetoothData = function (req) {
        var deferred = this.q.defer();

        if (req.body == undefined) {
            deferred.reject(new Error('Body must not be undefined!'));
        } else if (req.body.bssid == undefined) {
            deferred.reject(new Error('BSSID must not be undefined!'));
        } else if (typeof req.body.bssid != 'string') {
            deferred.reject(new Error('BSSID must be a string!'));
        } else if (req.body.lat == undefined) {
            deferred.reject(new Error('Lat must not be undefined!'));
        } else if (isNaN(req.body.lat)) {
            deferred.reject(new Error('Lat must be a number!'));
        } else if (req.body.lng == undefined) {
            deferred.reject(new Error('Lng must not be undefined!'));
        } else if (isNaN(req.body.lng)) {
            deferred.reject(new Error('Lng must be a number!'));
        } else if (req.body.typeId == undefined) {
            deferred.reject(new Error('TypeId must not be undefined!'));
        } else if (isNaN(req.body.typeId)) {
            deferred.reject(new Error('TypeId must be a number!'));
        } else {
            if (req.body.pointsperdetection == undefined || isNaN(req.body.pointsperdetection)) {
                req.body.pointsperdetection = 5;
            }

            deferred.resolve({
                bssid: req.body.bssid,
                typeId: req.body.typeId,
                position: 'POINT(' + req.body.lng + ' ' + req.body.lat + ')',
                pointsperdetection: req.body.pointsperdetection
            });

        }

        return deferred.promise;
    };

    HTTPDataFactory.prototype.getPushBluetoothSensorData = function (req) {
        var deferred = this.q.defer();

        if (req.params == undefined) {
            deferred.reject(new Error('Body must not be undefined!'));
        } else if (req.params.mac == undefined) {
            deferred.reject(new Error('Mac must not be undefined!'));
        } else if (typeof req.params.mac != 'string') {
            deferred.reject(new Error('Mac must be a string!'));
        } else if (req.body == undefined) {
            deferred.reject(new Error('Body must not be undefined!'));
        } else if (req.body.bulk == undefined) {
            deferred.reject(new Error('bulk must not be undefined!'));
        } else {
            var bulk = [];
            for (var i = 0; i < req.body.bulk.length; i++) {
                var entry = req.body.bulk[i];

                if (entry.scanResult == undefined) {
                    deferred.reject(new Error('ScanResult must not be undefined!'));
                } else if (!(entry.scanResult instanceof Array)) {
                    deferred.reject(new Error('ScanResult must be an array!'));
                } else {
                    var actorIds = [];
                    var timestamps = [];
                    var bluetoothClasses = [];

                    var result = undefined;
                    for (var j = 0; j < entry.scanResult.length; j++) {
                        result = entry.scanResult[j];
                        if (result.bluetoothId == undefined || typeof result.bluetoothId != 'string') {
                            deferred.reject(new Error('Scanned id ' + result.bluetoothId + ' is not valid'));
                        } else if (result.time == undefined || isNaN(result.time)) {
                            deferred.reject(new Error('Scanned time ' + result.time + ' is not valid'));
                        } else if (result.bluetoothClass == undefined || isNaN(result.bluetoothClass)) {
                            deferred.reject(new Error('Scanned bluetoothClass ' + result.bluetoothClass + ' is not valid'));
                        } else {
                            actorIds.push(result.bluetoothId);
                            timestamps.push(new Date(result.time));
                            bluetoothClasses.push(result.bluetoothClass);
                        }
                    }

                    bulk.push({
                        bssid: req.params.mac,
                        actorIds: actorIds,
                        timestamps: timestamps,
                        bluetoothClasses: bluetoothClasses
                    });
                }
            }
            deferred.resolve(bulk);
        }

        return deferred.promise;
    };

    return HTTPDataFactory;
})();