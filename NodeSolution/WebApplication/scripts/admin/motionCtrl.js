/**
 * User: DennisHoeting
 * Date: 23.04.13
 * Time: 16:44
 *
 * $
 */

function MotionCtrl($scope, $rootScope, $timeout, AdminMapService, AdminSocketService, Alert) {
    $scope.selectedMotion = {};

    $scope.data = {
        threshold: 5,
        limit: 1000
    };

    $scope.realLimit = $scope.data.limit;

    var map = AdminMapService.getMotionMap('motionMap');
    map.registerOnFeatureSelect(function (selectedFeature) {
        $scope.$apply(function () {
            $scope.selectedMotion = selectedFeature;
        })
    });


    $scope.result = [];
    var highest = 0, lowest = 0;

    $scope.getMotionData = function () {
        $rootScope.loadingStatus = 0;
        AdminSocketService.getMotionData($scope.data)
            .then(function (result) {
                $scope.result = result;
                $scope.realLimit = result.length;
                result = result.sort(function (a, b) {
                    if(Number(a.threshold)>highest) highest = Number(a.threshold);
                    if(Number(a.threshold)<lowest) lowest = Number(a.threshold);

                    if (a.threshold >= b.threshold) {
                        return 1;
                    } else {
                        return -1;
                    }
                });

                map.pushMotionData(result, lowest, highest);
                Alert.alertSuccess('MotionData erfolgreich heruntergeladen.');
            })
            .fail(function (error) {
                console.log('tracksCtrl.js: ', error);
                Alert.alertError('Fehler beim Herunterladen der MotionData.');
            })
            .always(function () {
                $rootScope.safeApply(function () {
                    $rootScope.loadingStatus = 1;
                });
            });
    };
}