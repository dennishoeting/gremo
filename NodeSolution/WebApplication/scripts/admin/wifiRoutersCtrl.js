/**
 * User: DennisHoeting
 * Date: 26.04.13
 * Time: 19:37
 *
 * $
 */
function WifiRoutersCtrl($scope, $rootScope, $http, AdminSocketService, AdminMapService, Alert) {
    $rootScope.loadingStatus = 0;
    $scope.selectedRouter = undefined;
    $scope.wifiRouters = [];

    $scope.maxRouters = 10000;

    var map = AdminMapService.getWifiRouterMap('wifiRouterMap');
    map.registerOnFeatureSelect(function (selectedFeature) {
        $scope.$apply(function () {
            $scope.selectedRouter = selectedFeature;
        })
    });

    $scope.$watch('selectedRouter', function (router) {
        if (!router) return;
        var pos = router.position.substring('POINT('.length, router.position.length - 1).split(' ');
        $http({
            method: 'GET',
            url: 'http://nominatim.openstreetmap.org/reverse?format=json&lat=' + pos[1] + '&lon=' + pos[0] + '&zoom=18&addressdetails=1'
        })
            .success(function (data, status) {
                if (status == 200) {
                    router.address = data.address;
                } else {
                    Alert.alertError('Nominatim ' + status + ': Reverse-Geocoding nicht erfolgreich');
                }
            })
            .error(function (data, status) {
                Alert.alertError('Nominatim ' + status + ': Reverse-Geocoding nicht erfolgreich');
            });
    });

    AdminSocketService.getWifiRouters({limit:$scope.maxRouters})
        .then(function (result) {
            $scope.wifiRouters = result;
            map.pushWifiRouterData(result);
        })
        .fail(function (error) {
            console.log('wifiRoutersCtrl.js: ', error);
            Alert.alertError('Wifirouter nicht empfangen.');
        })
        .always(function () {
            $rootScope.loadingStatus = 1;
            $scope.$apply();
        });
}