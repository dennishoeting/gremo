/**
 * User: DennisHoeting
 * Date: 04.05.13
 * Time: 01:47
 *
 * $
 */
app.controller('ChangePasswordDialogCtrl', ['$scope', '$rootScope', 'dialog', 'User', 'Alert', function ($scope, $rootScope, dialog, User, Alert) {
    $scope.oldPass = '';
    $scope.pw1 = '';
    $scope.pw2 = '';
    var disableSave = false;

    $scope.validatePasswords = function (pw1, pw2) {
        return !disableSave && typeof pw1 === 'string' && pw1 != '' && pw1 === pw2;
    };

    $scope.save = function () {
        disableSave = true;
        User.savePassword({
            oldPass: String(CryptoJS.SHA256($scope.oldPass)),
            pw1: String(CryptoJS.SHA256($scope.pw1)),
            pw2: String(CryptoJS.SHA256($scope.pw2))
        })
            .then(function () {
                User.model.self.password = $scope.pw1;
                Alert.alertSuccess('Passwort geändert.');
            })
            .fail(function (error) {
                console.log('changePasswordDialogCtrl.js: ', error);
                Alert.alertError('Beim Speichern deiner Daten ist ein Fehler aufgetreten.');
            })
            .always(function () {
                dialog.close();
                $rootScope.safeApply();
            });
    };

    $scope.close = function () {
        disableSave = true;
        dialog.close();
    };
}]);