/**
 * User: DennisHoeting
 * Date: 04.05.13
 * Time: 01:47
 *
 * $
 */
app.controller('UploadTrackDialogCtrl', ['$scope', '$rootScope', '$location', 'dialog', 'WebSocketService', 'Alert', 'Actions', function ($scope, $rootScope, $location, dialog, WebSocketService, Alert, Actions) {
    $scope.actionType = -1;

    $scope.hack = true;
    $scope.$watch('hack', function () {
        $('#file_input')
            .on('change', function () {
                $rootScope.safeApply(function () {
                    $scope.filePath = $('#file_input').val();
                });
            });
    });

    $scope.filePath = 'klick..';

    function readFile(file, callback) {
        var reader = new FileReader();
        reader.onload = function (evt) {
            if (typeof callback == "function") {
                callback(file, evt);
            }
        };
        reader.onerror = function errorHandler(evt) {
            Alert.alertError('Fehler beim Lesen der Datei.');
        };
        reader.readAsBinaryString(file);
    }

    $scope.chooseFile = function () {
        $('#file_input')
            .click();
    };

    $scope.upload = function () {
        $rootScope.loadingStatus = 0;
        var input = document.getElementById("file_input");

        if ($scope.actionType < 0) {
            Alert.alertError('Bitte wähle einen Typ für den Track aus!');
            $rootScope.loadingStatus = 1;
            return;
        }

        if (typeof FileReader == "undefined" || !input.files) {
            Alert.alertError('Dein browser unterstützt die Upload-Funktion leider nicht!');
            $rootScope.loadingStatus = 1;
            return;
        }

        if (input.files.length < 1) {
            Alert.alertError('Bitte wähle vorher eine Datei aus!');
            $rootScope.loadingStatus = 1;
            return;
        }

        dialog.close();
        readFile(input.files[0], function (file, evt) {
            var name = input.files[0].name;
            var ext = name.substring(name.lastIndexOf('.'), name.length);
            WebSocketService.uploadTrack({file: evt.target.result, ext: ext, actionType: parseInt($scope.actionType)})
                .then(function (newActionId) {
                    Alert.alertSuccess('Datei hochgeladen');
                    $rootScope.loadingStatus = 1;
                    Actions.refresh();
                    $location.path("/actionMap/" + newActionId);
                })
                .fail(function (error) {
                    console.log('uploadTrackDialogCtrl.js: ', error);
                    Alert.alertError('Hochladen der Datei fehlgeschlagen!');
                    $rootScope.loadingStatus = 1;
                })
                .always(function () {
                    $rootScope.safeApply();
                });
        });
    };

    $scope.close = function () {
        dialog.close();
    };
}])
;