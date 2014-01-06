/**
 * User: DennisHoeting
 * Date: 04.05.13
 * Time: 01:47
 *
 * $
 */
app.controller('DisclaimerDialogCtrl', ['$scope', '$rootScope', 'dialog', function ($scope, $rootScope, dialog) {


    $scope.close = function () {
        dialog.close();
    }
}]);