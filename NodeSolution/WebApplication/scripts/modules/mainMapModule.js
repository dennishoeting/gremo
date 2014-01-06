/**
 * User: DennisHoeting
 * Date: 31.05.13
 * Time: 12:47
 *
 * $
 */

angular.module('mainMapModule', ['mapModule']).factory('MainMapService', function (MapService) {
    var exports = {};

    exports.getActionMap = function (containerId) {
        return new ActionMap(containerId);
    };
    exports.getLockedZoneMap = function (containerId) {
        return new LockedZoneMap(containerId);
    };

    var ActionMap = (function (_super) {
        util.extend(ActionMap, _super);

        var container = '';

        var map = undefined;

        var allFeatures = [];

        var line_style = OpenLayers.Util.extend({},
            OpenLayers.Feature.Vector.style['default']);
        line_style.strokeColor = '#000';
        line_style.strokeWidth = 2;

        var unknown_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        unknown_style.pointRadius = 5;
        unknown_style.fillOpacity = 1;
        unknown_style.fillColor = '#EEEEEE';
        unknown_style.strokeColor = '#000000';
        unknown_style.cursor = 'pointer';

        var gps_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        gps_style.pointRadius = 5;
        gps_style.fillOpacity = 1;
        gps_style.fillColor = '#FF0000';
        gps_style.strokeColor = '#000000';
        gps_style.cursor = 'pointer';
        gps_style.graphicXOffset = -3;

        var net_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        net_style.pointRadius = 5;
        net_style.fillOpacity = 1;
        net_style.fillColor = '#FFDDDD';
        net_style.strokeColor = '#000000';
        net_style.cursor = 'pointer';
        net_style.graphicXOffset = 3;

        var wifi_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        wifi_style.pointRadius = 5;
        wifi_style.fillOpacity = 1;
        wifi_style.fillColor = '#00FF00';
        wifi_style.strokeColor = '#000000';
        wifi_style.cursor = 'pointer';
        wifi_style.graphicYOffset = -3;

        var bluetooth_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        bluetooth_style.pointRadius = 5;
        bluetooth_style.fillOpacity = 1;
        bluetooth_style.fillColor = '#0000FF';
        bluetooth_style.strokeColor = '#000000';
        bluetooth_style.cursor = 'pointer';
        bluetooth_style.graphicYOffset = 3;

        var motion_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        motion_style.pointRadius = 5;
        motion_style.fillOpacity = 1;
        motion_style.fillColor = '#FFFF00';
        motion_style.strokeColor = '#000000';
        motion_style.strokeLinecap = 'square';
        motion_style.cursor = 'pointer';

        var highlight_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        highlight_style.pointRadius = 15;
        highlight_style.fillOpacity = 0.7;
        highlight_style.fillColor = '#FFFFFF';
        highlight_style.strokeColor = '#000000';

        var osmLayer = new OpenLayers.Layer.OSM('OpenStreetMap');
        var lockedZones = new OpenLayers.Layer.Vector('Locked Zones');
        var lineLayer = new OpenLayers.Layer.Vector('Line');
        var gpsDataLayer = new OpenLayers.Layer.Vector('GPS Data');
        var netDataLayer = new OpenLayers.Layer.Vector('Net Data');
        var wifiDataLayer = new OpenLayers.Layer.Vector('Wifi Data');
        var bluetoothDataLayer = new OpenLayers.Layer.Vector('Bluetooth Data');
        var motionDataLayer = new OpenLayers.Layer.Vector('Motion Data');
        var highlightLayer = new OpenLayers.Layer.Vector('Highlight');

        var onFeatureSelect = undefined;

        function ActionMap(containerId) {
            var _this = this;
            container = containerId;

            if (map) {
                map.render(containerId);
            } else {
                _super(containerId, [
                    osmLayer,
                    lockedZones,
                    lineLayer,
                    gpsDataLayer,
                    netDataLayer,
                    wifiDataLayer,
                    bluetoothDataLayer,
                    motionDataLayer,
                    highlightLayer]);
                map = this.getMap();
            }

            var selectFeature = new OpenLayers.Control.SelectFeature(
                [gpsDataLayer, netDataLayer, wifiDataLayer, bluetoothDataLayer, motionDataLayer],
                {
                    clickout: true,
                    toggle: false,
                    multiple: false,
                    hover: false,
                    onSelect: function (feature) {
                        typeof onFeatureSelect == 'function' ?
                            onFeatureSelect(feature.arrayIndex) : _this.highlight(feature.arrayIndex);
                    }
                }
            );
            map.addControl(selectFeature);
            selectFeature.activate();
        }

        ActionMap.prototype.clear = function () {
            allFeatures = [];
            lockedZones.removeAllFeatures();
            lineLayer.removeAllFeatures();
            gpsDataLayer.removeAllFeatures();
            netDataLayer.removeAllFeatures();
            wifiDataLayer.removeAllFeatures();
            bluetoothDataLayer.removeAllFeatures();
            motionDataLayer.removeAllFeatures();
        };

        ActionMap.prototype.pushLineData = function (linedata) {
            if (linedata) {
                var feature = _super.wktParser.read(linedata);
                feature.style = line_style;
                lineLayer.addFeatures(feature);
            }
        };

        ActionMap.prototype.pushGPSData = function (gpsdata) {
            var gpsfeatures = [],
                netfeatures = [],
                feature;
            _.each(gpsdata, function (data) {
                if (data.position) {
                    feature = _super.wktParser.read(data.position);
                    feature.timestamp = data.timestamp;
                    feature.baseData = data;
                    if (data.providerid == 2) {
                        feature.style = gps_style;
                        gpsfeatures.push(feature);
                    } else if (data.providerid == 3) {
                        feature.style = net_style;
                        netfeatures.push(feature);
                    } else {
                        feature.style = unknown_style;
                        gpsfeatures.push(feature);
                    }
                }
            });
            allFeatures = allFeatures.concat(gpsfeatures).concat(netfeatures);
            gpsDataLayer.addFeatures(gpsfeatures);
            netDataLayer.addFeatures(netfeatures);
        };

        ActionMap.prototype.pushWifiData = function (wifidata) {
            var features = [], feature;
            _.each(wifidata, function (data) {
                if (data.position) {
                    feature = _super.wktParser.read(data.position);
                    feature.style = wifi_style;
                    feature.timestamp = data.timestamp;
                    feature.baseData = data;
                    features.push(feature);
                }
            });
            allFeatures = allFeatures.concat(features);
            wifiDataLayer.addFeatures(features);
        };

        ActionMap.prototype.pushBluetoothData = function (bluetoothdata) {
            var features = [], feature;
            _.each(bluetoothdata, function (data) {
                if (data.position) {
                    feature = _super.wktParser.read(data.position);
                    feature.style = bluetooth_style;
                    feature.timestamp = data.timestamp;
                    feature.baseData = data;
                    features.push(feature);
                }
            });
            allFeatures = allFeatures.concat(features);
            bluetoothDataLayer.addFeatures(features);
        };

        ActionMap.prototype.pushMotionData = function (motiondata) {
            var features = [], feature;
            _.each(motiondata, function (data) {
                if (data.position) {
                    feature = _super.wktParser.read(data.position);
                    feature.style = motion_style;
                    feature.timestamp = data.timestamp;
                    feature.baseData = data;
                    features.push(feature);
                }
            });
            allFeatures = allFeatures.concat(features);
            motionDataLayer.addFeatures(features);
        };

        ActionMap.prototype.dataComplete = function () {
            allFeatures = allFeatures.sort(function (a, b) {
                if (a.timestamp >= b.timestamp) {
                    return 1;
                } else {
                    return -1;
                }
            });

            // Store array index in features to ease bidirectionality
            for (var i = 0; i < allFeatures.length; i++) {
                allFeatures[i].arrayIndex = i;
            }

            return allFeatures.length;
        };

        ActionMap.prototype.addLockedZoneFromWkt = function (wkt) {
            lockedZones.addFeatures([_super.wktParser.read(wkt)]);
        };

        ActionMap.prototype.highlight = function (i) {
            if (allFeatures[i]) {
                highlightLayer.removeAllFeatures();
                var point = new OpenLayers.Geometry.Point(allFeatures[i].geometry.x, allFeatures[i].geometry.y);
                var feature = new OpenLayers.Feature.Vector(point, null, highlight_style);
                highlightLayer.addFeatures([feature]);
                map.panTo(new OpenLayers.LonLat(feature.geometry.x, feature.geometry.y));

                return allFeatures[i].baseData;
            } else
                return null;
        };

        ActionMap.prototype.registerOnFeatureSelect = function (func) {
            onFeatureSelect = func;
        };

        ActionMap.prototype.toggleShowLayer = function (layerName, newStatus) {
            switch (layerName) {
                case 'gps':
                    gpsDataLayer.setVisibility(newStatus);
                    break;
                case 'net':
                    netDataLayer.setVisibility(newStatus);
                    break;
                case 'wifi':
                    wifiDataLayer.setVisibility(newStatus);
                    break;
                case 'bluetooth':
                    bluetoothDataLayer.setVisibility(newStatus);
                    break;
                case 'motion':
                    motionDataLayer.setVisibility(newStatus);
                    break;
            }
        };

        return ActionMap;
    }(MapService.BaseMap));

    var LockedZoneMap = (function (_super) {
        util.extend(LockedZoneMap, _super);

        var projection = new OpenLayers.Projection("EPSG:3857");

        var map = undefined;
        var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
        renderer = (renderer) ? [renderer] : OpenLayers.Layer.Vector.prototype.renderers;
        var vectors = new OpenLayers.Layer.Vector("Vector Layer", {
            renderers: renderer
        });
        vectors.events.on({
            'beforefeaturemodified': function (event) {
                event.feature.area = event.feature.geometry.getGeodesicArea(projection);
            }
        });
        var osmLayer = new OpenLayers.Layer.OSM("OpenStreetMap");

        var drawControl = new OpenLayers.Control.DrawFeature(vectors, OpenLayers.Handler.Polygon);
        var modifyControl = new OpenLayers.Control.ModifyFeature(vectors);

        function LockedZoneMap(containerId) {
            if (map) {
                map.render(containerId);
            } else {
                _super(containerId, [osmLayer, vectors]);
                map = this.getMap();
            }

            map.addControl(drawControl);
            map.addControl(modifyControl);
        }

        LockedZoneMap.prototype.registerEventHandlers = function (eventHandlers) {
            vectors.events.on(eventHandlers);
        };


        LockedZoneMap.prototype.activateModify = function () {
            drawControl.deactivate();
            modifyControl.activate();
        };

        LockedZoneMap.prototype.activateDraw = function () {
            modifyControl.deactivate();
            drawControl.activate();
        };

        LockedZoneMap.prototype.deleteFeature = function (feature) {
            modifyControl.deactivate();
            vectors.removeFeatures(feature);
            modifyControl.activate();
        };

        LockedZoneMap.prototype.deactivateAll = function () {
            modifyControl.deactivate();
            drawControl.deactivate();
        };

        LockedZoneMap.prototype.getWKT = function (feature) {
            return _super.wktParser.write(feature);
        };

        LockedZoneMap.prototype.getFeaturesAsWKT = function () {
            var result = {};
            for (var i = 0; i < vectors.features.length; ++i) {
                result[vectors.features[i].id] = _super.wktParser.write(vectors.features[i]);
            }
            return result;
        };

        LockedZoneMap.prototype.parseWKT = function (wkt) {
            return _super.wktParser.read(wkt);
        };

        LockedZoneMap.prototype.addFeature = function (feature) {
            vectors.addFeatures([feature]);
        };

        LockedZoneMap.prototype.reset = function () {
            vectors.removeAllFeatures();
        };

        return LockedZoneMap;
    }(MapService.BaseMap));

    return exports;
});