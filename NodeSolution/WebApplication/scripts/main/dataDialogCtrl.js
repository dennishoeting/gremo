/**
 * User: DennisHoeting
 * Date: 04.05.13
 * Time: 01:47
 *
 * $
 */
app.controller('DataDialogCtrl', ['$scope', '$rootScope', '$location', 'WebSocketService', 'Actions', 'Alert', 'dialog', function ($scope, $rootScope, $location, WebSocketService, Actions, Alert, dialog) {
    $scope.actions = Actions.model.actionList;
    $scope.data = [];

    $scope.setPage = function () {
        var offset = ($scope.currentPage - 1) * $scope.numPerPage;
        var max = offset + $scope.numPerPage;
        $scope.data = $scope.actions.slice(offset, max);
    };

    (function init() {
        $scope.numPerPage = 5;
        $scope.noOfPages = Math.ceil($scope.actions.length / $scope.numPerPage);
        $scope.currentPage = 1;
        $scope.setPage();
    })();

    $scope.$watch('currentPage', $scope.setPage);

    $scope.deleteData = function (action) {
        WebSocketService.deleteData({id: action.id})
            .then(function () {
                $scope.actions.splice($scope.actions.indexOf(action), 1);
                $scope.setPage();
                Alert.alertSuccess('Daten wurden gelöscht.');
            })
            .fail(function (error) {
                console.log('dataDialogCtrl.js: ', error);
                Alert.alertError('Fehler beim Löschen der Daten.');
            })
            .always(function () {
                $rootScope.safeApply();
            });

    };

    $scope.anonymizeData = function (action) {
        WebSocketService.anonymizeData({id: action.id})
            .then(function () {
                $scope.actions.splice($scope.actions.indexOf(action), 1);
                $scope.setPage();
                Alert.alertSuccess('Daten wurden anonymisiert.');
            })
            .fail(function (error) {
                console.log('dataDialogCtrl.js: ', error);
                Alert.alertError('Fehler beim Anonymisieren der Daten.');
            })
            .always(function () {
                $rootScope.safeApply();
            });
    };

    $scope.close = function () {
        Actions.refresh();
        dialog.close();
    };
}]);