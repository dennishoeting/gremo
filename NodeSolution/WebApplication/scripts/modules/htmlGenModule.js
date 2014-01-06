/**
 * User: DennisHoeting
 * Date: 29.04.13
 * Time: 10:11
 *
 * $
 */
angular.module('htmlGen', []).factory('OpenLayersPopupHTMLGenerator', function ($compile) {
    var exports = {};

    exports.getWifiPopup = function (wifiRouter) {
        var result = '<div class="wifiPopup" ng-init="router = getCopy(' + wifiRouter.index + ')">' +
            '<dl class="dl-horizontal">' +
            '<dt>BSSID</dt>' +
            '<dd>{{router.id}}</dd>' +
            '<dt>SSID</dt>' +
            '<dd>{{router.ssid}}</dd>' +
            '<dt>Typ</dt>' +
            '<dd>{{router.name}}</dd>' +
            '<dt>Heartbeat</dt>' +
            '<dd>{{router.lastheartbeat}}</dd>' +
            '</dl>' +
            '<hr />' +
            '<dl class="dl-horizontal">' +
            '<dt><label>Punkte</label></dt>' +
            '<dd><input class="small" type="number" min="0" ng-model="router.pointsperdetection" /></dd>' +
            '<dt><label>Status</label></dt>' +
            '<dd><select ng-model="router.isactive" class="small">' +
            '<option value="true">Active</option>' +
            '<option value="false">Inactive</option>' +
            '</select></dd>' +
            '</dl>' +
            '<hr />' +
            '<gm-button ng-click="save(router)">Speichern</gm-button>' +
            '<gm-button ng-click="abort(router.index)">Abbrechen</gm-button>';
        return result;
    };

    return exports;
});