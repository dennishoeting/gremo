/**
 * User: DennisHoeting
 * Date: 04.05.13
 * Time: 01:47
 *
 * $
 */
app.controller('FeedbackDialogCtrl', ['$scope', '$rootScope', 'dialog', 'WebSocketService', 'Alert', function ($scope, $rootScope, dialog, WebSocketService, Alert) {
    $scope.feedback = {
        message: '',
        email: ''
    };

    $scope.send = function (feedback) {
        $rootScope.loadingStatus = 0;
        dialog.close();
        WebSocketService.sendFeedback(feedback)
            .then(function () {
                Alert.alertSuccess('Danke für dein Feedback!');
                $rootScope.loadingStatus = 1;
            })
            .fail(function () {
                Alert.alertError('Feedback konnte nicht gesendet werden.');
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