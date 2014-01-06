/**
 * User: DennisHoeting
 * Date: 23.04.13
 * Time: 16:45
 *
 * $
 */
function CommunitiesCtrl($scope, AdminSocketService, Alert) {
    $scope.communities = [];
    $scope.communityTypes = [];

    AdminSocketService.getAllCommunities({limit: 'ALL'})
        .then(function (result) {
            $scope.communities = result;
            console.log('communitiesCtrl.js: got community', result);
        })
        .fail(function (error) {
            Alert.alertError('Communities nicht empfangen.');
            console.log('usersCtrl.js: ', error);
        })
        .always(function () {
            $scope.$apply();
        });


    AdminSocketService.getCommunityTypes({limit: 'ALL'})
        .then(function (result) {
            $scope.communityTypes = result;
            console.log('communitiesCtrl.js: got type ', result);
        })
        .fail(function (error) {
            Alert.alertError('Communities nicht empfangen.');
            console.log('usersCtrl.js: ', error);
        })
        .always(function () {
            $scope.$apply();
        });


}