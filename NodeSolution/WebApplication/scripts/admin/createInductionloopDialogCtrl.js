/**
 * User: DennisHoeting
 * Date: 04.05.13
 * Time: 01:47
 *
 * $
 */
app.controller('CreateInductionloopDialogCtrl', ['$scope', '$timeout', 'dialog', 'AdminSocketService', 'AdminMapService', 'Alert', function ($scope, $timeout, dialog, AdminSocketService, AdminMapService, Alert) {
    $scope.loopTypes = [];
    $scope.newLoop = {
        name: 'New Loop',
        lat: undefined,
        lng: undefined,
        typeId: -1,
        groupId: -1
    };

    $timeout(function () {
        var map = AdminMapService.getCreateInductionLoopMap('createInductionloopMap');
        map.registerOnPositionChange(function (lng, lat) {
            $scope.$apply(function () {
                $scope.newLoop.lng = lng;
                $scope.newLoop.lat = lat;
            })
        });
    });

    $scope.chosenType = undefined;
    $scope.$watch('chosenType', function (newType) {
        if (newType) {
            $scope.newLoop.typeId = newType.id;
        }
    });

    $scope.chosenGroup = undefined;
    $scope.$watch('chosenGroup', function (chosenGroup) {
        if (chosenGroup) {
            $scope.newLoop.groupId = chosenGroup.id;
        }
    });

    AdminSocketService.getInductionLoopTypes()
        .then(function (result) {
            $scope.loopTypes = result;
            $scope.chosenType = result[0];
        })
        .fail(function (error) {
            console.log('inductionLoopsCtrl.js: ', error);
            Alert.alertError('Induction Loop Types nicht empfangen.');
        })
        .always(function () {
            $scope.$apply();
        });

    AdminSocketService.getInductionLoopGroups()
        .then(function (result) {
            $scope.loopGroups = result;
            $scope.chosenGroup = result[0];
        })
        .fail(function (error) {
            console.log('inductionLoopsCtrl.js: ', error);
            Alert.alertError('Induction Loop Types nicht empfangen.');
        })
        .always(function () {
            $scope.$apply();
        });


    $scope.createLoop = function (loop) {
        AdminSocketService.createInductionLoop(loop)
            .then(function (result) {
                Alert.alertSuccess('Induktionsschleife erfolgreich erstellt.');
            })
            .fail(function (error) {
                console.log('inductionLoopsCtrl.js: ', error);
                Alert.alertError('Induktionsschleife nicht erstellt.');
            })
            .always(function () {
                $scope.$apply();
            });
    };

    $scope.close = function () {
        disableSave = true;
        dialog.close();
    };
}]);