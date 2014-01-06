/**
 * User: DennisHoeting
 * Date: 29.04.13
 * Time: 15:26
 *
 * $
 */
function ActionControlsCtrl($scope, $dialog) {
    $scope.openUploadDialog = function () {
        $dialog.dialog({
            templateUrl: '/main/partial/uploadTrackDialog',
            controller: 'UploadTrackDialogCtrl',
            resolve: {
                parameters: function () {
                    return {
                        parentScope: $scope
                    }
                }
            }
        })
            .open();
    }
}