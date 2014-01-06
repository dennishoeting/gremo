/**
 * User: DennisHoeting
 * Date: 04.06.13
 * Time: 19:01
 *
 * $
 */

angular.module('actionsModule', ['socketModule']).factory('Actions', function (WebSocketService) {
    var constants = {
        oneWeekInMillis: 1000*60*60*24*7
    };

    var exports = {
        model: {
            actionDates: [],
            actions: {},
            actionList: [],
            actionDistance: 0,
            actionList_lastWeek: [],
            actionDistance_lastWeek: 0,
            lockedZones: []
        }
    };

    /*
     * action
     */
    var ACTION_LIMIT = 0;   // all
    var actionOffset = 0;

    var currGroup = '';

    exports.getData = function () {
        var deferred = $.Deferred();
        WebSocketService.getActionList({
            limit: ACTION_LIMIT,
            offset: actionOffset
        })
            .then(function (result) {
                exports.model.actionList = [];
                exports.model.actionDistance = 0;
                exports.model.actionList_lastWeek = [];
                exports.model.actionDistance_lastWeek = 0;

                actionOffset += result.length;
                _.each(result, function (row) {
                    exports.model.actionList.push(row);
                    exports.model.actionDistance += Number(row.distance);

                    if(new Date(row.time).getTime()>new Date().getTime()-constants.oneWeekInMillis) {
                        exports.model.actionList_lastWeek.push(row);
                        exports.model.actionDistance_lastWeek += Number(row.distance);
                    }
                });
                return WebSocketService.getLockedZones();
            })
            .done(function (result) {
                exports.model.lockedZones = result;
                deferred.resolve();
            })
            .fail(function (error) {
                deferred.reject(error);
            });
        return deferred.promise();
    };

    exports.getAction = function (actionId) {
        var deferred = $.Deferred();
        if (exports.model.actions[actionId]) {
            deferred.resolve(exports.model.actions[actionId]);
        } else {
            WebSocketService.getActionData({actionId: actionId})
                .done(function (result) {
                    exports.model.actions[actionId] = result;
                    deferred.resolve(result);
                })
                .fail(function (error) {
                    deferred.reject(error);
                });
        }
        return deferred.promise();
    };

    exports.refresh = function () {
        exports.model.actionDates = [];
        actionOffset = 0;
        return exports.getData();
    };

    return exports;
});