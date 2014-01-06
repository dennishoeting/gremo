/**
 * User: DennisHoeting
 * Date: 04.05.13
 * Time: 17:47
 *
 * $
 */
function CommunityCtrl($scope, $rootScope, $routeParams, $location, WebSocketService, User, Alert) {
    $scope.community = undefined;
    $rootScope.loadingStatus = 0;

    $scope.memberList = [];
    function initMemberPagination() {
        $scope.setMemberPage = function () {
            if(!$scope.community) return;
            var offset = ($scope.currentMemberPage - 1) * $scope.numPerMemberPage;
            var max = offset + $scope.numPerMemberPage;
            $scope.memberList = $scope.community.memberList.slice(offset, max);
        };

        $scope.numPerMemberPage = 5;
        $scope.noOfMemberPages = Math.ceil($scope.community.memberList.length / $scope.numPerMemberPage);
        $scope.currentMemberPage = 1;
        $scope.setMemberPage();
        $scope.$watch('currenMembertPage', $scope.setMemberPage);
    }
    
    function refresh() {
        WebSocketService.getCommunity($routeParams.id)
            .done(function (result) {
                $scope.community = result;
                initMemberPagination();
                _.forEach(User.model.communities, function (community) {
                    if (community.id == $scope.community.id) {
                        $scope.community.joined = true;
                        $scope.community.confirmed = community.confirmed;
                    }
                });
            })
            .fail(function () {

                Alert.alertError('Daten konnten nicht geladen werden.');
            })
            .always(function () {
                $rootScope.safeApply(function () {
                    $rootScope.loadingStatus = 1;
                });
            });
    }

    $scope.joinCommunity = function () {
        User.joinCommunity($scope.community.id)
            .done(function (accepted) {
                if(accepted) {
                    Alert.alertSuccess('Du bist der Gruppe beigetreten.');
                }                                                         else {
                    Alert.alertSuccess('Du hast eine Anfrage zum Beitritt gestellt und wartest auf Bestätigung.');
                }
            })
            .fail(function (err) {
                console.log('communityCtrl.js: ', err);
                Alert.alertError('Fehler beim Beitreten der Gruppe');
            })
            .always(function () {
                $rootScope.safeApply(function () {
                    refresh();
                });
            });
    };

    $scope.rejectJoinRequest = function () {
        console.log('communityCtrl.js: rejecting');
    };

    $scope.leaveCommunity = function () {
        User.leaveCommunity($scope.community.id)
            .done(function () {
                Alert.alertSuccess('Du hast die Gruppe verlassen.');
            })
            .fail(function (err) {
                console.log('communityCtrl.js: ', err);
                Alert.alertError('Fehler beim Verlassen der Gruppe');
            })
            .always(function () {
                $rootScope.safeApply(function () {
                    refresh();
                });
            });
    };

    refresh();

    $scope.routeToUser = function (userId) {
        $location.path("/user/" + userId);
    };
};