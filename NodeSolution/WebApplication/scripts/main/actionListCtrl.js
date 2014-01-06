/**
 * User: DennisHoeting
 * Date: 29.04.13
 * Time: 15:26
 *
 * $
 */
function ActionListCtrl($scope, $rootScope, $location, Actions, Alert, $timeout) {
    $scope.model = Actions.model;

    $scope.sameBulk = function (item1, item2) {
        if(!(item1&&item2)) return false;
        return item1.time.substr(0,10)==item2.time.substr(0,10);
    };

    $timeout(function () {
        $('.overviewColumn').on('scroll', function () {
            $rootScope.actionListScroll = $('.overviewColumn').scrollTop();
        });

        // wait for dom and then scroll
        if (!$rootScope.actionListScroll) {
            $rootScope.actionListScroll = 0;
        } else {
            $('.overviewColumn').scrollTop($rootScope.actionListScroll);
        }
    });

    $scope.getActions = function () {
        $rootScope.loadingStatus = 0;
        Actions.getData({
            limit: $scope.$parent.$parent.ACTION_LIMIT,
            offset: $scope.$parent.$parent.actionOffset
        })
            .done(function () {
                $rootScope.loadingStatus = 1;
            })
            .fail(function () {
                $rootScope.loadingStatus = 1;
                Alert.alertError('Fehler beim Download der Aktivitäten.');
            })
            .always(function () {
                $rootScope.safeApply();
            });
    };

    $scope.increaseLimit = function () {
        $rootScope.actionLimit += $rootScope.LIMIT_STEPS;
    };

    $scope.routeToAction = function (actionid) {
        var url = $location.$$url;
        url = url.substring(url.indexOf('/'), url.lastIndexOf('/'));
        $location.path((url || '/actionMap') + '/' + actionid);
    };
}