/**
 * User: DennisHoeting
 * Date: 29.04.13
 * Time: 15:26
 *
 * $
 */
function ActionMapCtrl($scope, $rootScope, $location, $routeParams, MainMapService, Actions, Alert) {
    var map = MainMapService.getActionMap('historyMap');
    map.registerOnFeatureSelect(function (id) {
        $rootScope.safeApply(function () {
            $scope.currentSelection = id;
        });
    });

    $scope.currentId = $routeParams.id;
    $scope.currentAction = {
        dataLength: 0
    };
    $scope.currentSelection = 0;
    $scope.currentData = undefined;

    $scope.$watch('currentSelection', function (newSelection) {
        $scope.currentData = map.highlight(newSelection);
    });

    $scope.checkGps = true;
    $scope.$watch('checkGps', function (newVal) {
        map.toggleShowLayer('gps', newVal);
    });
    $scope.checkNet = true;
    $scope.$watch('checkNet', function (newVal) {
        map.toggleShowLayer('net', newVal);
    });
    $scope.checkWifi = true;
    $scope.$watch('checkWifi', function (newVal) {
        map.toggleShowLayer('wifi', newVal);
    });
    $scope.checkBluetooth = true;
    $scope.$watch('checkBluetooth', function (newVal) {
        map.toggleShowLayer('bluetooth', newVal);
    });
    $scope.checkMotion = true;
    $scope.$watch('checkMotion', function (newVal) {
        map.toggleShowLayer('motion', newVal);
    });

    function refreshCurrentAction() {
        $rootScope.loadingStatus = 0;
        Actions.getAction($routeParams.id)
            .then(function (action) {
                map.clear();
                for (var i = 0; i < Actions.model.lockedZones.length; i++) {
                    map.addLockedZoneFromWkt(Actions.model.lockedZones[i].geometry);
                }
                map.pushLineData(action.linedata);
                map.pushGPSData(action.gpsdata);
                map.pushWifiData(action.wifidata);
                map.pushBluetoothData(action.bluetoothdata);
                map.pushMotionData(action.motiondata);
                $scope.currentAction.dataLength = map.dataComplete();
                $scope.busy = false;

                $scope.$emit('actionLoaded', $scope.currentAction);
            })
            .fail(function () {
                Alert.alertError('Fehler beim Download der Aktivität.');
            })
            .always(function () {
                $rootScope.safeApply(function () {
                    $rootScope.loadingStatus = 1;
                });
            });
    }

    if ($routeParams.id) {
        refreshCurrentAction();
    }

    $scope.routeToOverview = function () {
        $location.path("/actions");
    };

    $scope.routeToMap = function (id) {
        $location.path("/actionMap/" + id);
    };

    $scope.routeToStats = function (id) {
        $location.path("/actionStat/" + id);
    };

    $scope.previousPoint = function () {
        if ($scope.currentSelection > 0) {
            $scope.currentSelection--;
        }
    };

    $scope.nextPoint = function () {
        if ($scope.currentSelection < $scope.currentAction.dataLength - 1) {
            $scope.currentSelection++;
        }
    };

    $scope.refreshView = function () {
        $rootScope.loadingStatus = 0;
        Actions.refresh()
            .always(function () {
                $rootScope.safeApply(function () {
                    $rootScope.loadingStatus = 1;
                });
            });
    };
}