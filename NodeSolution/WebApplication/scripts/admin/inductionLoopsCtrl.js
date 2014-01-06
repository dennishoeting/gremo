/**
 * User: DennisHoeting
 * Date: 23.04.13
 * Time: 16:44
 *
 * $
 */

function InductionLoopsCtrl($scope, $rootScope, $timeout, $http, $dialog, AdminMapService, AdminSocketService, Alert) {
    $rootScope.loadingStatus = 0;
    $scope.selectedLoop = undefined;

    var map = AdminMapService.getInductionLoopMap('inductionLoopMap');
    map.registerOnFeatureSelect(function (selectedFeature) {
        $scope.$apply(function () {
            $scope.selectedLoop = selectedFeature;
        })
    });

    $scope.$watch('selectedLoop', function (loop) {
        if (!loop) return;
        var pos = loop.position.substring('POINT('.length, loop.position.length - 1).split(' ');
        $http({
            method: 'GET',
            url: 'http://nominatim.openstreetmap.org/reverse?format=json&lat=' + pos[1] + '&lon=' + pos[0] + '&zoom=18&addressdetails=1'
        })
            .success(function (data, status) {
                if (status == 200) {
                    loop.address = data.address;
                } else {
                    Alert.alertError('Nominatim ' + status + ': Reverse-Geocoding nicht erfolgreich');
                }
            })
            .error(function (data, status) {
                Alert.alertError('Nominatim ' + status + ': Reverse-Geocoding nicht erfolgreich');
            });
    });

    $scope.collapseQuery = false;
    $scope.inductionLoops = [];
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

    $scope.calculateRatio = function () {
        $rootScope.loadingStatus = 0;

        var data = {
            inductionloopId: $scope.selectedLoop.id,
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

        AdminSocketService.calculateBluetoothRatio(data)
            .then(function (result) {
                if ($scope.queryType.absolute) {
                    result.caption = moment($scope.timeframe.start).format('DD.MM.YYYY, h:mm')
                        + ' bis '
                        + moment($scope.timeframe.end).format('DD.MM.YYYY, h:mm');
                } else if ($scope.queryType.interval) {
                    result.caption = moment($scope.timeframe.startDate).format('DD.MM.YYYY')
                        + ' bis '
                        + moment($scope.timeframe.endDate).format('DD.MM.YYYY')
                        + ', jeweils von '
                        + moment($scope.timeframe.startInterval).format('h:mm')
                        + ' bis '
                        + moment($scope.timeframe.endInterval).format('h:mm');
                } else if ($scope.queryType.weekday) {
                    result.caption = moment($scope.timeframe.startDate).format('DD.MM.YYYY')
                        + ' bis '
                        + moment($scope.timeframe.endDate).format('DD.MM.YYYY')
                        + ', jeweils am '
                        + $scope.timeframe.weekday
                        + ' von '
                        + moment($scope.timeframe.startInterval).format('h:mm')
                        + ' bis '
                        + moment($scope.timeframe.endInterval).format('h:mm');
                }
                $scope.ratioResults.push(result);
                Alert.alertSuccess('Berechnung abgeschlossen.');
            })
            .fail(function (error) {
                console.log('inductionLoopsCtrl.js e: ', error);
                Alert.alertError('Kein Ergebnis!');
            })
            .always(function () {
                $rootScope.loadingStatus = 1;
                $scope.$apply();
            })
    };


    $scope.openImportInductionloopDataDialog = function () {
        $dialog.dialog({
            templateUrl: 'admin/partial/importInductionloopDataDialog',
            controller: 'ImportInductionloopDataDialogCtrl'
        })
            .open();
    };

    $scope.openCreateInductionloopDialog = function () {
        $dialog.dialog({
            templateUrl: 'admin/partial/createInductionloopDialog',
            controller: 'CreateInductionloopDialogCtrl',
            dialogClass: 'modal createInductionloopDialog'
        })
            .open();
    };

    AdminSocketService.getInductionLoops()
        .then(function (result) {
            $scope.inductionLoops = result;
            map.pushInductionLoopData(result);
        })
        .fail(function (error) {
            console.log('inductionLoopsCtrl.js: ', error);
            Alert.alertError('Induction Loops nicht empfangen.');
        })
        .always(function () {
            $rootScope.loadingStatus = 1;
            $scope.$apply();
        });
}