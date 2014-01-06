/**
 * User: DennisHoeting
 * Date: 04.05.13
 * Time: 18:03
 *
 * $
 */
function UserCtrl($scope, $rootScope, $routeParams, $location, WebSocketService, User, Alert) {
    $scope.user = undefined;
    $scope.message = '';

    $scope.communityList = [];
    function initCommunityPagination() {
        $scope.setCommunityPage = function () {
            if (!$scope.user) return;
            var offset = ($scope.currentCommunityPage - 1) * $scope.numPerCommunityPage;
            var max = offset + $scope.numPerCommunityPage;
            $scope.communityList = $scope.user.communityList.slice(offset, max);
        };

        $scope.numPerCommunityPage = 5;
        $scope.noOfCommunityPages = Math.ceil($scope.user.communityList.length / $scope.numPerCommunityPage);
        $scope.currentCommunityPage = 1;
        $scope.setCommunityPage();
        $scope.$watch('currenCommunitytPage', $scope.setCommunityPage);
    }

    $scope.friendList = [];
    function initFriendPagination() {
        $scope.setFriendPage = function () {
            if (!$scope.user) return;
            var offset = ($scope.currentFriendPage - 1) * $scope.numPerFriendPage;
            var max = offset + $scope.numPerFriendPage;
            $scope.friendList = $scope.user.friendList.slice(offset, max);
        };

        $scope.numPerFriendPage = 5;
        $scope.noOfFriendPages = Math.ceil($scope.user.friendList.length / $scope.numPerFriendPage);
        $scope.currentFriendPage = 1;
        $scope.setFriendPage();
        $scope.$watch('currenFriendtPage', $scope.setFriendPage);
    }

    function refresh() {
        $rootScope.loadingStatus = 0;
        WebSocketService.getUserFriend($routeParams.id)
            .then(function (result) {
                $scope.user = result;
                initCommunityPagination();
                initFriendPagination();
            })
            .fail(function (err) {
                Alert.alertSuccess('Daten konnten nicht geladen werden.');
            })
            .always(function () {
                $rootScope.safeApply(function () {
                    $rootScope.loadingStatus = 1;
                });
            });
    }

    refresh();

    $scope.makeFriendRequest = function (id) {
        $rootScope.loadingStatus = 0;
        WebSocketService.makeFriendRequest({friendId: id})
            .then(function () {
                $rootScope.loadingStatus = 1;
                Alert.alertSuccess('Freundschaftsanfrage gesendet.');
            })
            .fail(function (err) {
                $rootScope.loadingStatus = 1;
                Alert.alertError('Fehler. Eventuell enthält Deine Nachricht unerlaubte Zeichen.');
                console.log('userCtrl.js: ', err);
            })
            .always(function () {
                $rootScope.safeApply();
            });
    };

    $scope.sendMessage = function (friendId, message) {
        $rootScope.loadingStatus = 0;
        var name = User.model.self.nickname || User.model.self.email;
        WebSocketService.sendMessage({userName:name, to:friendId, message:message})
            .then(function () {
                Alert.alertSuccess('Nachricht gesendet.');
                $rootScope.loadingStatus = 1;
                $scope.message = '';
            })
            .fail(function (error) {
                Alert.alertError('Fehler');
                $rootScope.loadingStatus = 1;
                console.log('userCtrl.js: ', error);
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
}