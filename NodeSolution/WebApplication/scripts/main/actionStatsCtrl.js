/**
 * User: DennisHoeting
 * Date: 29.04.13
 * Time: 15:26
 *
 * $
 */
function ActionStatsCtrl($scope, $rootScope, $location, $routeParams, Actions, Alert, Fuel, User) {
    $scope.currentId = $routeParams.id;
    $scope.action = undefined;

    $scope.user = User.model.self;
    $scope.fuelPrice = Fuel.fuelPrice;

    if ($routeParams.id) {
        $rootScope.loadingStatus = 0;
        Actions.getAction($routeParams.id)
            .then(function (result) {
                $scope.action = result;
                $scope.busy = false;
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

    $scope.routeToOverview = function () {
        $location.path("/actions");
    };

    $scope.routeToMap = function (id) {
        $location.path("/actionMap/" + id);
    };

    $scope.routeToStats = function (id) {
        $location.path("/actionStat/" + id);
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