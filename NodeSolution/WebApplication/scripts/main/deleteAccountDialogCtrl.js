/**
 * User: DennisHoeting
 * Date: 04.05.13
 * Time: 01:47
 *
 * $
 */
app.controller('DeteleAccountDialogCtrl', ['$scope', '$rootScope', '$location', 'dialog', 'WebSocketService', 'Alert', function ($scope, $rootScope, $location, dialog, WebSocketService, Alert) {
    $scope.dataAction = 0;
    $scope.ANONYMIZE = 1;
    $scope.DELETE = 2;

    $scope.delete = function () {
        switch ($scope.dataAction) {
            case $scope.ANONYMIZE:
            case $scope.DELETE:
                $rootScope.loadingStatus = 0;
                dialog.close();
                WebSocketService.deleteAccount({deleteData: ($scope.dataAction==$scope.DELETE) })
                    .then(function () {
                        window.location = '/login?deleted=true';
                        Alert.alertSuccess('Tschüss!');
                    })
                    .fail(function (error) {
                        console.log('deleteAccountDialogCtrl.js: ', error);
                        Alert.alertError('Account konnte nicht gelöscht werden.');
                    })
                    .always(function () {
                        $rootScope.loadingStatus = 1;
                        $rootScope.safeApply();
                    });
                break;
            default:
                Alert.alertError('Du musst sagen, was mit deinen Daten passieren soll!');
        }
    };

    $scope.close = function () {
        dialog.close();
    };
}]);