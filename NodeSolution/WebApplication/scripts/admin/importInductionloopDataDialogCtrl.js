/**
 * User: DennisHoeting
 * Date: 04.05.13
 * Time: 01:47
 *
 * $
 */
app.controller('ImportInductionloopDataDialogCtrl', ['$scope', '$rootScope', '$timeout', 'dialog', 'AdminSocketService', 'Alert', function ($scope, $rootScope, $timeout, dialog, AdminSocketService, Alert) {
    $scope.filePath = 'klick..';
    $timeout(function () {
        $('#file_input')
            .on('change', function () {
                $scope.$apply(function () {
                    $scope.filePath = $('#file_input').val();
                });
            });
    });

    $scope.chooseFile = function () {
        $('#file_input').click();
    };

    function readFile(file, callback) {
        var reader = new FileReader();
        reader.onload = function (evt) {
            if (typeof callback == "function")
                callback(file, evt);
        };
        reader.onprogress = function updateProgress(evt) {
            console.log('uploadTrackDialogCtrl.js: progressing', evt);
        };
        reader.onerror = function errorHandler(evt) {
            console.log('uploadTrackDialogCtrl.js: error', evt);
        };
        reader.readAsBinaryString(file);
    }

    $scope.upload = function () {
        $rootScope.loadingStatus = 0;
        var input = document.getElementById("file_input");

        if (typeof FileReader == "undefined" || !input.files) {
            Alert.alertError('Your browser doesn\'t support the HTML 5 File API!');
            $rootScope.loadingStatus = 1;
            return;
        }
        if (input.files.length < 1) {
            Alert.alertError('Keine Datei ausgewählt');
            $rootScope.loadingStatus = 1;
            return;
        }

        readFile(input.files[0], function (file, evt) {
            dialog.close();
            AdminSocketService.uploadCSV({file: evt.target.result})
                .then(function (result) {
                    Alert.alertSuccess('Datei hochgeladen');
                })
                .fail(function (error) {
                    console.log('uploadTrackDialogCtrl.js: ', error);
                    Alert.alertError('Hochladen der Datei fehlgeschlagen!');
                })
                .always(function () {
                    $rootScope.safeApply(function () {
                        $rootScope.loadingStatus = 1;
                    });
                });
        });
    };

    $scope.close = function () {
        dialog.close();
    };
}]);