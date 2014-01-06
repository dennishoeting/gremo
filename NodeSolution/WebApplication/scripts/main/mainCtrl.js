/**
 * Created with JetBrains WebStorm.
 * User: DennisHoeting
 * Date: 09.04.13
 * Time: 19:46
 * To change this template use File | Settings | File Templates.
 */
function MainCtrl($scope, $rootScope, $location, $dialog, WebSocketService, User, Statistics, Actions, Messages, Alert) {
    var parameters = $location.searchCommunity();
    $scope.userId = parameters['id'];
    $scope.appLink = "https://play.google.com/store/apps/details?id=com.GreMo.GreMoApp&referrer=utm_source%3DGremo%2520Homepage%26utm_medium%3DAlfsee";

    $rootScope.LIMIT_STEPS = 10;
    $rootScope.actionLimit = 10;
    $rootScope.messageLimit = 10;

    $scope.modalOpts = {
        keyboard: false,
        backdropClick: false
    };

    var MIN_POINTS_FOR_SWEEPSTAKE = 5000;

    // https://coderwall.com/p/ngisma
    $rootScope.safeApply = function (fn) {
        var phase = this.$root.$$phase;
        if (phase == '$apply' || phase == '$digest') {
            if (fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };

    $scope.openDisclaimer = function () {
        $dialog.dialog({
            templateUrl: '/login/partial/disclaimerDialog',
            controller: 'DisclaimerDialogCtrl'
        }).open();
    };

    $scope.openContact = function () {
        $dialog.dialog({
            templateUrl: '/login/partial/contactDialog',
            controller: 'ContactDialogCtrl'
        }).open();
    };

    $scope.feedback = function () {
        $dialog.dialog({
            templateUrl: '/login/partial/feedbackDialog',
            controller: 'FeedbackDialogCtrl',
            keyboard: false,
            backdropClick: false
        }).open();
    };

    $scope.messages = Messages.model;

    $rootScope.loadingStatus = 0;
    /*
     * Alerts
     */
    $scope.alerts = Alert.repository;
    $scope.closeAlert = function (index) {
        Alert.repository.splice(index, 1);
    };

    WebSocketService.connect({
        type: 'main',
        id: $scope.userId,
        onConnect: function () {
            $rootScope.loadingStatus = 0.4;

            WebSocketService.registerWebSocketListener([
                {
                    event: 'userMessage',
                    func: function () {
                        Messages.getData()
                            .then(function () {
                                $scope.$apply();
                            });
                    }
                },
                {
                    event: 'restart',
                    func: function() {
                        alert('Neustart erforderlich.');
                    }
                }
            ]);
        },
        onIdentification: function () {
            $rootScope.loadingStatus = 0.5;
            User.getData()
                .then(function () {
                    $rootScope.loadingStatus = 0.6;
                    return Actions.getData();
                })
                .then(function () {
                    $rootScope.loadingStatus = 0.7;
                    return Statistics.getData();
                })
                .then(function () {
                    $rootScope.loadingStatus = 0.8;
                    return Messages.getData();
                })
                .then(function () {
                    $rootScope.loadingStatus = 1;
                    $scope.$apply(function () {
                        // Redirect
                        if ($location.$$url.length > '/main'.length) {
                            var parameters = $location.searchCommunity();
                            var destination = parameters['dest'];
                            if (destination) {
                                $location.url(destination);
                            } else {
                                $location.url('/main');
                            }
                        }
                    });

                    $scope.$broadcast('loadingFinished');
                })
                .then(function () {
                    if (!User.model.self.notified && User.model.self.points > MIN_POINTS_FOR_SWEEPSTAKE) {
                        $dialog.dialog({
                            templateUrl: '/login/partial/sweepstakeDialog',
                            controller: 'SweepstakeDialogCtrl',
                            resolve: {
                                parameters: function () {
                                    return {
                                        loggedIn: true
                                    }
                                }
                            }
                        })
                            .open();
                    }
                });
        }
    })
    ;

}