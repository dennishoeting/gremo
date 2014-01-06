/**
 * User: DennisHoeting
 * Date: 19.04.13
 * Time: 22:29
 *
 * $
 */
function MessagesCtrl($scope, $rootScope, Messages, WebSocketService, Alert, User) {
    var LIMIT_STEPS = 10;
    $rootScope.messageLimit = LIMIT_STEPS;
    $scope.replyMessage = '';

    $scope.model = Messages.model;

    $scope.sameBulk = function (item1, item2) {
        if(!(item1&&item2)) return false;
        return item1.timestamp.substr(0,10)==item2.timestamp.substr(0,10);
    };

    function selectFirstMessage() {
        $scope.chosenMessage = $scope.model.messages[0];
        if($scope.chosenMessage) {
            $scope.currentId = $scope.chosenMessage.id;
        }
    }
    selectFirstMessage();

    $scope.choose = function (index) {
        $scope.currentId = $scope.model.messages[index].id;
        $scope.chosenMessage = $scope.model.messages[index];

        if (!$scope.model.messages[index].read) {
            Messages.markAsRead($scope.model.messages[index].id)
                .done(function () {
                    $scope.model.messages[index].read = true;
                })
                .fail(function (error) {
                    console.log('messagesCtrl.js: ', error);
                    Alert.alertError('Nachricht konnte nicht als \'gelesen\' markiert werden.');
                })
                .always(function () {
                    $rootScope.safeApply();
                });
        }
    };


    $scope.acceptJoinRequest = function (referenceId) {
        $rootScope.loadingStatus = 0;
        WebSocketService.acceptJoinRequest(referenceId)
            .then(function () {
                Alert.alertSuccess('Nutzer akzeptiert.');
            })
            .fail(function (error) {
                console.log('messagesCtrl.js: ', error);
                Alert.alertError('Konnte nutzer nicht akzeptieren.');
            })
            .always(function () {
                $rootScope.safeApply(function () {
                    $rootScope.loadingStatus = 1;
                });
            });
    };

    $scope.rejectJoinRequest = function (referenceId) {
        $rootScope.loadingStatus = 0;
        WebSocketService.rejectJoinRequest(referenceId)
            .then(function () {
                Alert.alertSuccess('Nutzer abgelehnt.');
            })
            .fail(function (error) {
                console.log('messagesCtrl.js: ', error);
                Alert.alertError('Konnte nutzer nicht ablehnen.');
            })
            .always(function () {
                $rootScope.safeApply(function () {
                    $rootScope.loadingStatus = 1;
                });
            });
    };

    $scope.deleteMessage = function (msg) {
        $rootScope.loadingStatus = 0;
        Messages.delete(msg.id)
            .fail(function (error) {
                console.log('messagesCtrl.js: ', error);
                Alert.alertError('Nachricht konnte nicht gelöscht werden.');
            })
            .always(function () {
                $scope.refreshView();
            });
    };

    $scope.increaseLimit = function () {
        $rootScope.messageLimit += LIMIT_STEPS;
    };

    $scope.refreshView = function () {
        $rootScope.loadingStatus = 0;
        Messages.getData()
            .then(function () {
                $scope.model = Messages.model;
                selectFirstMessage();
            })
            .always(function () {
                $rootScope.safeApply(function () {
                    $rootScope.loadingStatus = 1;
                });
            });
    };

    $scope.sendMessage = function (friendId, message) {
        $rootScope.loadingStatus = 0;
        var name = User.model.self.nickname || User.model.self.email;
        WebSocketService.sendMessage({userName:name, to:friendId, message:message})
            .then(function () {
                $scope.replyMessage = '';
                $rootScope.loadingStatus = 1;
                Alert.alertSuccess('Nachricht gesendet.');
            })
            .fail(function (error) {
                Alert.alertError('Fehler. Eventuell enthält Deine Nachricht unerlaubte Zeichen.');
                $rootScope.loadingStatus = 1;
                console.log('userCtrl.js: ', error);
            })
            .always(function () {
                $rootScope.safeApply();
            });
    };
}