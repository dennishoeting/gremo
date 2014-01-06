/**
 * User: DennisHoeting
 * Date: 19.04.13
 * Time: 22:29
 *
 * $
 */
function SettingsCtrl($scope, $rootScope, $dialog, WebSocketService, User, Alert) {
    $scope.model = User.model;
    $scope.fueltypes = [];

    $scope.checkAddress = false;

    WebSocketService.getFueltypes()
        .then(function (fueltypes) {
            $scope.fueltypes = fueltypes;
        })
        .fail(function (error) {
            console.log('settingsCtrl.js: ', error);
            Alert.alertError('Fueltypes nicht geladen.');
        })
        .always(function () {
            $rootScope.safeApply();
        });

    // Copy user
    $scope.changedUser = User.getCopy();

    $scope.profileDataHasChanged = function () {
        return $scope.model.self.nickname != $scope.changedUser.nickname
            || $scope.model.self.firstname != $scope.changedUser.firstname
            || $scope.model.self.lastname != $scope.changedUser.lastname
            || $scope.model.self.birthyear != $scope.changedUser.birthyear
            || $scope.model.self.zipcode != $scope.changedUser.zipcode
            || $scope.model.self.postaddress != $scope.changedUser.postaddress
            || $scope.model.self.consumption != $scope.changedUser.consumption
            || $scope.model.self.consumptiontype != $scope.changedUser.consumptiontype;
    };

    $scope.saveProfileData = function () {
        $rootScope.loadingStatus = 0;
        User.save($scope.changedUser)
            .done(function () {
                Alert.alertSuccess('Deine Daten wurden erfolgreich gespeichert!');
            })
            .fail(function (error) {
                console.log('settingsCtrl.js: ', error);
                Alert.alertError('Beim Speichern deiner Daten ist ein Fehler aufgetreten.');
            })
            .always(function () {
                $rootScope.safeApply(function () {
                    $rootScope.loadingStatus = 1;
                });
            });
    };

    $scope.maintainProfileData = function () {
        $scope.changedUser = User.getCopy();
    };

    $scope.searchForCommunity = function (_pattern) {
        $dialog.dialog({
            templateUrl: '/main/partial/communitySearchDialog',
            controller: 'CommunitySearchDialogCtrl',
            resolve: {
                parameters: function () {
                    return {
                        getMethod: WebSocketService.getCommunityList,
                        pattern: _pattern.toLowerCase()
                    }
                }
            }
        }).open();
    };

    $scope.createCommunity = function () {
        $dialog.dialog({
            templateUrl: 'main/partial/communityCreateDialog',
            controller: 'CommunityCreateDialogCtrl'
        }).open();
    };

    $scope.leaveCommunity = function (_communityId) {
        User.leaveCommunity(_communityId)
            .done(function () {
                Alert.alertSuccess('Gruppe verlassen.');
            })
            .fail(function () {
                Alert.alertError('Fehler beim Verlassen der Gruppe');
            })
            .always(function () {
                $rootScope.saveAapply();
            });
    };

    $scope.routeToCommunity = function (communityId) {
        $location.path("/community/" + communityId);
    };

    $scope.openLockedZoneDialog = function () {
        $dialog.dialog({
            templateUrl: '/main/partial/lockedZoneDialog',
            controller: 'LockedZoneDialogCtrl',
            dialogClass: 'modal lockedZoneDialog',
            keyboard: false,
            backdropClick: false
        }).open();
    };

    $scope.openDataDialog = function () {
        $dialog.dialog({
            templateUrl: '/main/partial/dataDialog',
            controller: 'DataDialogCtrl',
            dialogClass: 'modal dataDialog',
            keyboard: false,
            backdropClick: false
        }).open();
    };

    $scope.deleteAccount = function () {
        $dialog.dialog({
            templateUrl: '/main/partial/deleteAccountDialog',
            controller: 'DeteleAccountDialogCtrl'
        }).open();
    };

    $scope.openChangePasswordDialog = function () {
        $dialog.dialog({
            templateUrl: '/main/partial/changePasswordDialog',
            controller: 'ChangePasswordDialogCtrl',
            dialogClass: 'modal changePasswordDialog',
            keyboard: false,
            backdropClick: false
        }).open();
    };
}