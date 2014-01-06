/**
 * User: DennisHoeting
 * Date: 29.04.13
 * Time: 15:26
 *
 * $
 */
function ActionsCtrl($scope, $rootScope, User, Actions, Fuel) {
    $scope.user = User.model.self;
    $scope.fuelPrice = Fuel.fuelPrice;

    $scope.lastweek = {
        actionCount: Actions.model.actionList_lastWeek.length,
        distance: Actions.model.actionDistance_lastWeek
    };

    $scope.total = {
        actionCount: Actions.model.actionList.length,
        distance: Actions.model.actionDistance
    };


    $scope.refreshView = function () {
        $rootScope.loadingStatus = 0;
        Actions.refresh()
            .then(function () {
                return User.getData();
            })
            .then(function () {
                $scope.user = User.model.self;

                $scope.lastweek = {
                    actionCount: Actions.model.actionList_lastWeek.length,
                    distance: Actions.model.actionDistance_lastWeek
                };

                $scope.total = {
                    actionCount: Actions.model.actionList.length,
                    distance: Actions.model.actionDistance
                };
            })
            .always(function () {
                $rootScope.safeApply(function () {
                    $rootScope.loadingStatus = 1;
                });
            });
    };
}