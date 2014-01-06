/**
 * User: DennisHoeting
 * Date: 23.04.13
 * Time: 16:44
 *
 * $
 */

function BluetoothSensorsCtrl($scope, $rootScope, $http, AdminMapService, AdminSocketService, Alert) {
    $scope.Math = window.Math;

    $rootScope.loadingStatus = 0;
    $scope.selectedSensor = undefined;
    $scope.bluetoothSensors = {};
    $scope.bluetoothSensorsCount = 0;

    $scope.bluetoothTracks = {};
    $scope.weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

    $scope.queryType = {
        absolute: true,
        interval: false,
        weekday: false
    };

    $scope.setAbsolute = function () {
        $scope.queryType.absolute = true;
        $scope.queryType.interval = false;
        $scope.queryType.weekday = false;
    };
    $scope.setInterval = function () {
        $scope.queryType.interval = true;
        $scope.queryType.absolute = false;
        $scope.queryType.weekday = false;
    };
    $scope.setWeekday = function () {
        $scope.queryType.interval = false;
        $scope.queryType.absolute = false;
        $scope.queryType.weekday = true;
    };

    $scope.ratioResults = [];

    $scope.timeframe = {
        startDate: new Date(),
        startTime: '00:00',
        endDate: new Date(),
        endTime: '00:00',
        startInterval: '00:00',
        endInterval: '00:00',
        start: undefined,
        end: undefined,
        weekday: $scope.weekdays[0]
    };

    function calculateStart() {
        $scope.timeframe.start = new Date($scope.timeframe.startDate.getFullYear(), $scope.timeframe.startDate.getMonth(), $scope.timeframe.startDate.getDate(), $scope.timeframe.startTime.substr(0, 2), $scope.timeframe.startTime.substr(3, 2));
    }

    function calculateEnd() {
        $scope.timeframe.end = new Date($scope.timeframe.endDate.getFullYear(), $scope.timeframe.endDate.getMonth(), $scope.timeframe.endDate.getDate(), $scope.timeframe.endTime.substr(0, 2), $scope.timeframe.endTime.substr(3, 2));
    }

    $scope.$watch('timeframe.startDate', function () {
        calculateStart();
    });
    $scope.$watch('timeframe.startTime', function () {
        calculateStart();
    });
    $scope.$watch('timeframe.endDate', function () {
        calculateEnd();
    });
    $scope.$watch('timeframe.endTime', function () {
        calculateEnd();
    });

    var map = AdminMapService.getBluetoothSensorMap('bluetoothSensorMap');
    map.registerOnFeatureSelect(function (selectedFeature) {
        $scope.$apply(function () {
            $scope.selectedSensor = selectedFeature;
        })
    });

    $scope.$watch('selectedSensor', function (sensor) {
        if (sensor) {
            var pos = sensor.position.substring('POINT('.length, sensor.position.length - 1).split(' ');
            reverseGeocode({lat: pos[1], lon: pos[0]})
                .then(function (result) {
                    sensor.address = result;
                })
                .fail(function (error) {
                    console.log('bluetoothSensorsCtrl.js: ', error);
                    Alert.alertError('Nominatim ' + status + ': Reverse-Geocoding nicht erfolgreich');
                })
                .always(function () {
                    $rootScope.safeApply();
                });
        }
    });

    $scope.calculateTracks = function () {
        $rootScope.loadingStatus = 0;

        var data = {
            bluetoothSensorId: $scope.selectedSensor.id,
            startTimestamps: [],
            endTimestamps: []
        };

        if ($scope.queryType.absolute) {
            data.startTimestamps.push($scope.timeframe.start.getTime());
            data.endTimestamps.push($scope.timeframe.end.getTime());
        } else if ($scope.queryType.interval) {
            var currDate = $scope.timeframe.start;
            while (currDate.getTime() < $scope.timeframe.end.getTime()) {
                data.startTimestamps.push(new Date(currDate.getFullYear(), currDate.getMonth(), currDate.getDate(), $scope.timeframe.startInterval.substr(0, 2), $scope.timeframe.startInterval.substr(3, 2)));
                data.endTimestamps.push(new Date(currDate.getFullYear(), currDate.getMonth(), currDate.getDate(), $scope.timeframe.endInterval.substr(0, 2), $scope.timeframe.endInterval.substr(3, 2)));
                currDate = new Date(currDate.getTime() + (1000 * 3600 * 24)); // one day
            }
        } else if ($scope.queryType.weekday) {
            var currWeekday = $scope.timeframe.start.getDay();
            var goalWeekday = $scope.weekdays.indexOf($scope.timeframe.weekday);
            var daysToAdd = (currWeekday <= goalWeekday) ? (goalWeekday - currWeekday) : (goalWeekday + 7 - currWeekday);
            var currDate = new Date($scope.timeframe.start.getTime() + (daysToAdd * 1000 * 3600 * 24));
            while (currDate.getTime() < $scope.timeframe.end.getTime()) {
                data.startTimestamps.push(new Date(currDate.getFullYear(), currDate.getMonth(), currDate.getDate(), $scope.timeframe.startInterval.substr(0, 2), $scope.timeframe.startInterval.substr(3, 2)));
                data.endTimestamps.push(new Date(currDate.getFullYear(), currDate.getMonth(), currDate.getDate(), $scope.timeframe.endInterval.substr(0, 2), $scope.timeframe.endInterval.substr(3, 2)));
                currDate = new Date(currDate.getTime() + (1000 * 3600 * 24 * 7)); // one week
            }
        } else return;

        AdminSocketService.calculateBluetoothTracks(data)
            .then(function (result) {
                $scope.bluetoothTracks = {};
                _.forEach(result, function (entry) {
                    var sensor = $scope.bluetoothSensors[entry.partnerinstanceid];
                    var pos = sensor.position.substring('POINT('.length, sensor.position.length - 1).split(' ');
                    if (!$scope.bluetoothTracks[entry.partnerinstanceid]) {
                        $scope.bluetoothTracks[entry.partnerinstanceid] = {
                            entries: {
                                starts: [],
                                ends: []
                            },
                            address: {
                                road: 'Unknown'
                            },
                            averageDurationStarts: 0,
                            averageDurationEnds: 0,
                            averageDurationTotal: 0
                        };
                        if (entry.isstart) {
                            $scope.bluetoothTracks[entry.partnerinstanceid].entries.ends.push(entry);
                        } else {
                            $scope.bluetoothTracks[entry.partnerinstanceid].entries.starts.push(entry);
                        }
                        reverseGeocode({lat: pos[1], lon: pos[0]})
                            .then(function (result) {
                                $scope.bluetoothTracks[entry.partnerinstanceid].address = result;
                            })
                            .fail(function (error) {
                                console.log('bluetoothSensorsCtrl.js: ', error);
                                Alert.alertError(new Error('Nominatim ' + status + ': Reverse-Geocoding nicht erfolgreich'));
                            })
                            .always(function () {
                                $rootScope.safeApply();
                            });
                    } else {
                        if (entry.isstart) {
                            $scope.bluetoothTracks[entry.partnerinstanceid].entries.ends.push(entry);
                        } else {
                            $scope.bluetoothTracks[entry.partnerinstanceid].entries.starts.push(entry);
                        }
                    }
                });

                _.forEach($scope.bluetoothTracks, function (track) {
                    _.forEach(track.entries.starts, function (entry) {
                        track.averageDurationStarts += Math.abs(entry.partner_start - entry.self_end);
                        track.averageDurationTotal += Math.abs(entry.partner_start - entry.self_end);
                    });
                    track.averageDurationStarts = parseInt(track.averageDurationStarts / track.entries.starts.length);


                    _.forEach(track.entries.ends, function (entry) {
                        track.averageDurationEnds += Math.abs(entry.self_start - entry.partner_end);
                        track.averageDurationTotal += Math.abs(entry.self_start - entry.partner_end);
                    });
                    track.averageDurationEnds = parseInt(track.averageDurationEnds / track.entries.ends.length);

                    track.averageDurationTotal = parseInt(track.averageDurationTotal / (track.entries.ends.length + track.entries.starts.length));
                });
                Alert.alertSuccess('Es wurden ' + result.length + ' Fahrtzeiten geladen.')
            }
        )
            .
            fail(function (error) {
                console.log('bluetoothSensorsCtrl.js: ', error);
                Alert.alertError('Fahrtzeiten nicht empfangen.');
            })
            .always(function () {
                $rootScope.loadingStatus = 1;
                $scope.$apply();
            });
    };

    AdminSocketService.getBluetoothSensors()
        .then(function (result) {
            map.pushBluetoothSensorData(result);

            _.forEach(result, function (sensor) {
                $scope.bluetoothSensorsCount++;
                $scope.bluetoothSensors[sensor.id] = sensor;
            })
        })
        .fail(function (error) {
            console.log('bluetoothSensorsCtrl.js: ', error);
            Alert.alertError('Bluetoothsensoren nicht empfangen.');
        })
        .always(function () {
            $rootScope.loadingStatus = 1;
            $scope.$apply();
        });


    function reverseGeocode(pos) {
        var deferred = $.Deferred();
        $http({
            method: 'GET',
            url: 'http://nominatim.openstreetmap.org/reverse?format=json&lat=' + pos.lat + '&lon=' + pos.lon + '&zoom=18&addressdetails=1'
        })
            .success(function (data, status) {
                if (status == 200) {
                    console.log('bluetoothSensorsCtrl.js: road is', data.address.road);
                    if(!data.address.road) data.address.road = 'Unbekannt';
                    if(!data.address.city) data.address.city = 'Unbekannt';
                    if(!data.address.postcode) data.address.postcode = 'Unbekannt';

                    deferred.resolve(data.address);
                } else {
                    deferred.reject(new Error('Statuscode!=200'));
                }
            })
            .error(function (data, status) {
                deferred.reject(new Error('Nominatim ' + status + ': Reverse-Geocoding nicht erfolgreich'));
            });
        return deferred.promise();
    }
}