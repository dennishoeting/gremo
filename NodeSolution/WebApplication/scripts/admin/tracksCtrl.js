/**
 * User: DennisHoeting
 * Date: 23.04.13
 * Time: 16:44
 *
 * $
 */

function TracksCtrl($scope, $rootScope, $timeout, AdminMapService, AdminSocketService, Alert) {
    var map = AdminMapService.getTracksMap('tracksMap');

    $scope.collapseQuery = false;
    $scope.currentId;
    $scope.actionList = [];

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

    $scope.sameBulk = function (item1, item2) {
        if (!(item1 && item2)) return false;
        console.log('tracksCtrl.js: ', item1, item2);
        return item1.starttimestamp.substr(0, 10) == item2.starttimestamp.substr(0, 10);
    };

    $scope.increaseLimit = function () {
        $rootScope.actionLimit += $rootScope.LIMIT_STEPS;
    };

    $scope.loadActions = function () {
        $rootScope.loadingStatus = 0;

        var data = {
            timeframeStartArray: [],
            timeframeEndArray: []
        };

        if ($scope.queryType.absolute) {
            data.timeframeStartArray.push($scope.timeframe.start.getTime());
            data.timeframeEndArray.push($scope.timeframe.end.getTime());
        } else if ($scope.queryType.interval) {
            var currDate = $scope.timeframe.start;
            while (currDate.getTime() < $scope.timeframe.end.getTime()) {
                data.timeframeStartArray.push(new Date(currDate.getFullYear(), currDate.getMonth(), currDate.getDate(), $scope.timeframe.startInterval.substr(0, 2), $scope.timeframe.startInterval.substr(3, 2)));
                data.timeframeEndArray.push(new Date(currDate.getFullYear(), currDate.getMonth(), currDate.getDate(), $scope.timeframe.endInterval.substr(0, 2), $scope.timeframe.endInterval.substr(3, 2)));
                currDate = new Date(currDate.getTime() + (1000 * 3600 * 24)); // one day
            }
        } else if ($scope.queryType.weekday) {
            var currWeekday = $scope.timeframe.start.getDay();
            var goalWeekday = $scope.weekdays.indexOf($scope.timeframe.weekday);
            var daysToAdd = (currWeekday<=goalWeekday) ? (goalWeekday-currWeekday) : (goalWeekday+7-currWeekday);
            var currDate = new Date($scope.timeframe.start.getTime() + (daysToAdd * 1000 * 3600 * 24));
            while (currDate.getTime() < $scope.timeframe.end.getTime()) {
                data.timeframeStartArray.push(new Date(currDate.getFullYear(), currDate.getMonth(), currDate.getDate(), $scope.timeframe.startInterval.substr(0, 2), $scope.timeframe.startInterval.substr(3, 2)));
                data.timeframeEndArray.push(new Date(currDate.getFullYear(), currDate.getMonth(), currDate.getDate(), $scope.timeframe.endInterval.substr(0, 2), $scope.timeframe.endInterval.substr(3, 2)));
                currDate = new Date(currDate.getTime() + (1000 * 3600 * 24 * 7)); // one week
            }
        } else return;

        $scope.actionList = [];
        AdminSocketService.loadActions(data)
            .then(function (result) {
                result = result.sort(function (a, b) {
                    if (a.starttimestamp >= b.starttimestamp) {
                        return 1;
                    } else {
                        return -1;
                    }
                });
                $scope.actionList = result;
                map.pushTracks(result);
                Alert.alertSuccess('Tracks erfolgreich heruntergeladen.');
            })
            .fail(function (error) {
                console.log('tracksCtrl.js: ', error);
                Alert.alertError('Fehler beim Herunterladen der Tracks.');
            })
            .always(function () {
                $rootScope.safeApply(function () {
                    $rootScope.loadingStatus = 1;
                });
            });
    };

    $scope.highlightAction = function (actionId) {

    };
}