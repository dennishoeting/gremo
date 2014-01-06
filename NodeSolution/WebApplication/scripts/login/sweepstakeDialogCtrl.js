/**
 * User: DennisHoeting
 * Date: 04.05.13
 * Time: 01:47
 *
 * $
 */
app.controller('SweepstakeDialogCtrl', ['$scope', '$rootScope', '$location', 'dialog', 'WebSocketService', 'Alert', 'parameters', function ($scope, $rootScope, $location, dialog, WebSocketService, Alert, parameters) {
    $scope.credentials = {
        name: '',
        postcode: '',
        address: ''
    };

    $scope.loggedIn = function () {
        return parameters.loggedIn;
    };

    $scope.never = function () {
        dialog.close();
        $rootScope.loadingStatus = 0;
        WebSocketService.confirmNotification()
            .then(function () {
                $rootScope.loadingStatus = 1;
            })
            .fail(function (error) {
                console.log('sweepstakeDialogCtrl.js: ', error);
                $rootScope.loadingStatus = 1;
                Alert.alertError('Fehler!');
            })
            .always(function () {
                $scope.$apply();
            });
    };

    $scope.send = function () {
        dialog.close();
        $rootScope.loadingStatus = 0;
        WebSocketService.sendSweepstakeCredentials($scope.credentials)
            .then(function () {
                return WebSocketService.confirmNotification();
            })
            .then(function () {
                $rootScope.loadingStatus = 1;
            })
            .fail(function (error) {
                console.log('sweepstakeDialogCtrl.js: ', error);
                $rootScope.loadingStatus = 1;
                Alert.alertError('Fehler!');
            })
            .always(function () {
                $scope.$apply(function () {});
            })
    };

    $scope.close = function () {
        dialog.close();
    };
}])
;