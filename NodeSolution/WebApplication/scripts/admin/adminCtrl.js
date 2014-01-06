/**
 * Created with JetBrains WebStorm.
 * User: DennisHoeting
 * Date: 09.04.13
 * Time: 19:46
 * To change this template use File | Settings | File Templates.
 */

function AdminCtrl($scope, $rootScope, AdminSocketService, Alert) {
    $rootScope.loadingStatus = 0;
    $rootScope.LIMIT_STEPS = 10;
    $rootScope.actionLimit = 10;

    // https://coderwall.com/p/ngisma
    $rootScope.safeApply = function(fn) {
        var phase = this.$root.$$phase;
        if(phase == '$apply' || phase == '$digest') {
            if(fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };

    $scope.connectionEstablished = false;
    AdminSocketService.connect({
        onConnect: function () {
            $scope.connectionEstablished = true;
            $scope.$apply();
        }
    });

    /*
     * Load stuff
     */
    $rootScope.loadingStatus = 1;

    $scope.alerts = Alert.repository;
    $scope.closeAlert = function (index) {
        Alert.repository.splice(index, 1);
    };

    $scope.modalOpts = {
        keyboard: false,
        backdropClick: false
    };
}