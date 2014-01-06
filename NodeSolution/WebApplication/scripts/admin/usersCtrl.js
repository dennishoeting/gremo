/**
 * User: DennisHoeting
 * Date: 23.04.13
 * Time: 16:45
 *
 * $
 */
function UsersCtrl($scope, AdminSocketService, Alert) {
    $scope.onlineUsers = [];
    $scope.dbUsers = [];

    AdminSocketService.getOnlineUsers()
        .then(function (result) {
            $scope.onlineUsers = result;
        })
        .fail(function (error) {
            Alert.alertError('Online users nicht empfangen.');
            console.log('usersCtrl.js: ', error);
        })
        .always(function () {
            $scope.$apply();
        });

    AdminSocketService.getAllUsers({limit: 'ALL'})
        .then(function (result) {
            $scope.dbUsers = result;
            console.log('usersCtrl.js: ', result);
        })
        .fail(function (error) {
            Alert.alertError('DB users nicht empfangen.');
            console.log('usersCtrl.js: ', error);
        })
        .always(function () {
            $scope.$apply();
        });
}