/**
 * User: DennisHoeting
 * Date: 13.05.13
 * Time: 14:34
 *
 * $
 */
angular.module('alertModule', []).factory('Alert', function ($rootScope) {
    var exports = {
        repository: []
    };

    exports.alertError = function (msg) {
        exports.repository.push({
            type: 'error',
            msg: msg
        });
        window.setTimeout(function () {
            $rootScope.$apply(function () {
                exports.close(0);
            })
        }, 5000);
    };

    exports.alertSuccess = function (msg) {
        exports.repository.push({
            type: 'success',
            msg: msg
        });
        window.setTimeout(function () {
            $rootScope.$apply(function () {
                exports.close(0);
            })
        }, 5000);
    };

    exports.alertInfo = function (msg) {
        exports.repository.push({
            type: 'info',
            msg: msg
        });
        window.setTimeout(function () {
            $rootScope.$apply(function () {
                exports.close(0);
            })
        }, 5000);
    };

    exports.alertTransient = function (msg) {
        exports.repository.push({
            msg: msg
        });
        window.setTimeout(function () {
            $rootScope.$apply(function () {
                exports.close(0);
            })
        }, 5000);
    };

    exports.clearAlerts = function () {
        exports.repository.clear();
    };

    exports.close = function (index) {
        exports.repository.splice(index, 1);
    };

    return exports;
});