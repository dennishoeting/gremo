/**
 * User: DennisHoeting
 * Date: 18.04.13
 * Time: 19:26
 *
 * $
 */

function StatisticsCtrl($scope, $rootScope, $location, Statistics) {
    $scope.model = Statistics.model;

    $scope.routeToCommunity = function (communityId) {
        $location.path("/community/" + communityId);
    };

    $scope.routeToUser = function (userId) {
        $location.path("/user/" + userId);
    };

    $scope.refreshView = function () {
        $rootScope.loadingStatus = 0;
        Statistics.getData()
            .then(function () {
                $scope.model = Statistics.model;
            })
            .always(function () {
                $rootScope.safeApply(function () {
                    $rootScope.loadingStatus = 1;
                });
            });
    };
}