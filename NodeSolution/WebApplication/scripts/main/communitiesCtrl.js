/**
 * User: DennisHoeting
 * Date: 19.04.13
 * Time: 21:56
 *
 * $
 */
function CommunitiesCtrl($scope, $rootScope, $location, $dialog, WebSocketService, User, Alert) {
    $scope.model = User.model;
    $scope.groupSearchPattern = '';
    $scope.userSearchPattern = '';

    $scope.hack = false;

    var initCommunityPagination = function () {
        $scope.communityList = [];
        $scope.setCommunityPage = function () {
            if (!$scope.model) return;
            var offset = ($scope.currentCommunityPage - 1) * $scope.numPerCommunityPage;
            var max = offset + $scope.numPerCommunityPage;
            $scope.communityList = $scope.model.communities.slice(offset, max);
        };

        $scope.numPerCommunityPage = 5;
        $scope.noOfCommunityPages = Math.ceil($scope.model.communities.length / $scope.numPerCommunityPage);
        $scope.currentCommunityPage = 1;
        $scope.setCommunityPage();
        $scope.$watch('currentCommunityPage', $scope.setCommunityPage);
    };
    initCommunityPagination();

    var initFriendPagination = function () {
        $scope.friendList = [];
        $scope.setFriendPage = function () {
            if (!$scope.model) return;
            var offset = ($scope.currentFriendPage - 1) * $scope.numPerFriendPage;
            var max = offset + $scope.numPerFriendPage;
            $scope.friendList = $scope.model.friends.slice(offset, max);
        };

        $scope.numPerFriendPage = 5;
        $scope.noOfFriendPages = Math.ceil($scope.model.friends.length / $scope.numPerFriendPage);
        $scope.currentFriendPage = 1;
        $scope.setFriendPage();
        $scope.$watch('currentFriendtPage', $scope.setFriendPage);
    };
    initFriendPagination();

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

    $scope.searchForUser = function (_pattern) {
        $dialog.dialog({
            templateUrl: '/main/partial/userSearchDialog',
            controller: 'UserSearchDialogCtrl',
            resolve: {
                parameters: function () {
                    return {
                        getMethod: WebSocketService.getUserList,
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
        })
            .open()
            .then(function (result) {
                if(result) {
                    User.getCommunities();
                    $location.path("/community/" + result);
                    Alert.alertSuccess('Gruppe erfolgreich erstellt.');
                }
            });
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
                $rootScope.safeApply();
            });
    };

    $scope.routeToCommunity = function (communityId) {
        $location.path("/community/" + communityId);
    };

    $scope.routeToUser = function (userId) {
        $location.path("/user/" + userId);
    };

    $scope.refreshView = function () {
        $rootScope.loadingStatus = 0;
        User.getData()
            .then(function () {
                $scope.model = User.model;
                initCommunityPagination();
                initFriendPagination();
            })
            .always(function () {
                $rootScope.safeApply(function () {
                    $rootScope.loadingStatus = 1;
                });
            });
    };
}