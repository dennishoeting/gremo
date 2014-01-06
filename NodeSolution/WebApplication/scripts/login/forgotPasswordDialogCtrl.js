/**
 * User: DennisHoeting
 * Date: 11.05.13
 * Time: 17:09
 *
 * $
 */
app.controller('ForgotPasswordDialogCtrl', ['$scope', 'dialog', 'Alert', function ($scope, dialog, Alert) {
    $scope.email = '';

    $scope.close = function (email) {
        dialog.close(email);
    };
}]);