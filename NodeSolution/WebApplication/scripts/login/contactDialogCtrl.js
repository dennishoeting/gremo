/**
 * User: DennisHoeting
 * Date: 04.05.13
 * Time: 01:47
 *
 * $
 */
app.controller('ContactDialogCtrl', ['$scope', '$rootScope', 'dialog', 'WebSocketService', 'Alert', function ($scope, $rootScope, dialog, WebSocketService, Alert) {
    $scope.contact = {
        email: '',
        message: ''
    };

    $scope.send = function (contact) {
        dialog.close();
        $rootScope.loadingStatus = 0;
        WebSocketService.sendContact(contact)
            .then(function () {
                Alert.alertSuccess('Vielen Dank für deine Nachricht.');
                $rootScope.loadingStatus = 1;
            })
            .fail(function () {
                Alert.alertError('Deine Nachricht konnte leider nicht gesendet werden. Schreib uns gern direkt an mail@ma-gremo.de.');
                $rootScope.loadingStatus = 1;
            })
            .always(function () {
                $scope.$apply();
            });
    };


    $scope.close = function () {
        dialog.close();
    }
}]);