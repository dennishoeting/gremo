/**
 * User: DennisHoeting
 * Date: 04.05.13
 * Time: 01:47
 *
 * $
 */
app.controller('LockedZoneDialogCtrl', ['$scope', '$rootScope', '$location', 'MainMapService', 'WebSocketService', 'dialog', function ($scope, $rootScope, $location, MainMapService, WebSocketService, dialog) {
    var map;

    $scope.modes = {
        creation: 1,
        modification: 2
    };
    $scope.mode = $scope.modes.modification;
    $scope.zonenname = '';

    $scope.selectedFeatures = [];

    $scope.hack = false;
    $scope.$watch('hack', function () {
        map = MainMapService.getLockedZoneMap('lockedZoneMap');
        map.reset();

        map.registerEventHandlers({
            "sketchcomplete": function (event) {
                $scope.deactivateDraw();
                event.feature.id = $scope.zonenname;
                WebSocketService.pushLockedZone({
                    name: $scope.zonenname,
                    geometry: map.getWKT(event.feature)
                })
                    .fail(function (error) {
                        console.log('lockedZoneDialogCtrl.js: ', error);
                    });
                if (!$scope.$$phase) {
                    $rootScope.safeApply();
                }
            },
            "beforefeaturemodified": function (event) {
                $scope.selectedFeatures.push(event.feature);
                if (!$scope.$$phase) {
                    $rootScope.safeApply();
                }
            },
            "afterfeaturemodified": function (event) {
                $scope.selectedFeatures.splice($scope.selectedFeatures.indexOf(event.feature));
                WebSocketService.alterLockedZone({
                    name: event.feature.id,
                    geometry: map.getWKT(event.feature)
                })
                    .fail(function (error) {
                        console.log('lockedZoneDialogCtrl.js: ', error);
                    });
                if (!$scope.$$phase) {
                    $rootScope.safeApply();
                }
            }
        });

        WebSocketService.getLockedZones()
            .then(function (result) {
                var feature;
                for (var i = 0; i < result.length; i++) {
                    feature = map.parseWKT(result[i].geometry);
                    feature.id = result[i].name;
                    map.addFeature(feature);
                }
            })
            .fail(function (error) {
                console.log('lockedZoneDialogCtrl.js: ', error);
            })
            .always(function () {
                $rootScope.safeApply();
            });

        map.activateModify();
    });


    $scope.activateDraw = function () {
        $scope.mode = $scope.modes.creation;
        map.activateDraw();
    };

    $scope.deactivateDraw = function () {
        $scope.mode = $scope.modes.modification;
        map.activateModify();
    };

    $scope.delete = function (feature) {
        map.deleteFeature(feature);
        WebSocketService.deleteLockedZone({name: feature.id});
    };

    $scope.close = function () {
        map.deactivateAll();
        dialog.close();
    };
}]);