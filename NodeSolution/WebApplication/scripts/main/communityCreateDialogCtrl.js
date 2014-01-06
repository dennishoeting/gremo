/**
 * User: DennisHoeting
 * Date: 04.05.13
 * Time: 01:47
 *
 * $
 */
app.controller('CommunityCreateDialogCtrl', ['$scope', '$rootScope', '$location', 'dialog', 'Alert', 'WebSocketService', 'User', function ($scope, $rootScope, $location, dialog, Alert, WebSocketService, User) {
    $scope.chosenTypeId;
    $scope.communityTypes = [
        {name: '.. pending'}
    ];

    console.log('communityCreateDialogCtrl.js: mhm');
    WebSocketService.getCommunityTypes({limit:'ALL'})
        .done(function (result) {
            console.log('communityCreateDialogCtrl.js: got ', result);
            $scope.communityTypes = result;
        })
        .always(function () {
            $rootScope.safeApply();
        });

    $scope.communityCredentials = {
        name: '',
        description: '',
        typeId: 0,
        open: true,
        founderId: User.model.self.id
    };

    $scope.close = function (communityCredentials) {
        if (communityCredentials) {
            if($scope.chosenTypeId==undefined || parseInt($scope.chosenTypeId)<1) {
                Alert.alertError('Typ ungültig!');
            } else {
                communityCredentials.requireconfirmation = !communityCredentials.open;
                communityCredentials.typeId = parseInt($scope.chosenTypeId);
                WebSocketService.addCommunity(communityCredentials)
                    .done(function (result) {
                        $rootScope.safeApply(function () {
                            dialog.close(result);
                        });
                    })
                    .fail(function (error) {
                        Alert.alertError('Fehler beim Erstellen der Gruppe.');
                        console.log('communityCreateDialogCtrl.js: ', error);
                    });
            }

        } else {
            dialog.close();
        }

    };
}]);