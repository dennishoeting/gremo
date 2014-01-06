/**
 * User: DennisHoeting
 * Date: 28.04.13
 * Time: 13:20
 *
 * $
 */
angular.module('mapModule', []).factory('MapService', function () {
    var exports = {};

    exports.BaseMap = (function () {
        var map = undefined;

        var fromProjection = new OpenLayers.Projection("EPSG:4326");
        var toProjection = new OpenLayers.Projection("EPSG:900913");

        function BaseMap(containerId, layers) {
            map = new OpenLayers.Map(containerId);
            map.addLayers(layers);

            BaseMap.wktParser = new OpenLayers.Format.WKT({
                'internalProjection': map.baseLayer.projection,
                'externalProjection': fromProjection
            });

            map.setCenter(
                new OpenLayers.LonLat(8.211491, 53.144711)
                    .transform(fromProjection, toProjection), 11);
        }

        BaseMap.prototype.getMap = function () {
            return map;
        };

        return BaseMap;
    }());

    return exports;
});