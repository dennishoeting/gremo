/**
 * User: DennisHoeting
 * Date: 04.05.13
 * Time: 01:47
 *
 * $
 */
app.controller('CommunitySearchDialogCtrl', ['$scope', '$rootScope', '$location', 'dialog', 'parameters', function ($scope, $rootScope, $location, dialog, parameters) {
    $scope.busy = true;
    $scope.more = false;

    var limit = 10;
    $scope.pattern = parameters.pattern;
    $scope.lastPattern = '';
    $scope.results = [];

    $scope.searchCommunity = function (_pattern) {
        parameters.getMethod.call(this, {limit: limit, pattern: _pattern})
            .done(function (result) {
                $scope.busy = false;
                $scope.lastPattern = $scope.pattern;
                $scope.results = result;

                if (result.length > limit) {
                    more = true;
                }
            })
            .always(function () {
                $rootScope.safeApply();
            });
    };
    $scope.searchCommunity($scope.pattern);


    $scope.routeToCommunity = function (communityId) {
        dialog.close();
        $location.path("/community/" + communityId);
    };

    $scope.close = function () {
        dialog.close();
    };
}]);