/**
 * User: DennisHoeting
 * Date: 31.05.13
 * Time: 12:44
 *
 * $
 */

angular.module('adminMapModule', ['mapModule']).factory('AdminMapService', function (MapService, OpenLayersPopupHTMLGenerator) {
    var exports = {};

    exports.getTracksMap = function (containerId) {
        return new TracksMap(containerId);
    };

    exports.getInductionLoopMap = function (containerId) {
        return new InductionLoopMap(containerId);
    };

    exports.getCreateInductionLoopMap = function (containerId) {
        return new CreateInductionLoopMap(containerId);
    };

    exports.getBluetoothSensorMap = function (containerId) {
        return new BluetoothSensorMap(containerId);
    };

    exports.getWifiRouterMap = function (containerId) {
        return new WifiRouterMap(containerId);
    };

    exports.getMotionMap = function (containerId) {
        return new MotionMap(containerId);
    };

    var TracksMap = (function (_super) {
        util.extend(TracksMap, _super);

        var map = undefined;

        var tracks_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        tracks_style.strokeWidth = 5;
        tracks_style.strokeColor = '#FF0000';
        tracks_style.cursor = 'pointer';

        var osmLayer = new OpenLayers.Layer.OSM("OpenStreetMap");
        var tracksLayer = new OpenLayers.Layer.Vector('Locked Zones');

        function TracksMap(containerId) {
            if (map) {
                map.render(containerId);
            } else {
                _super(containerId, [osmLayer, tracksLayer]);
                map = this.getMap();

                map.addControls([new OpenLayers.Control.MousePosition({
                    prefix: 'Position: ',
                    separator: ', ',
                    numDigits: 5,
                    emptyString: 'Maus nicht über Karte.',
                    displayProjection: new OpenLayers.Projection("EPSG:4326")
                })]);
            }
        }

        TracksMap.prototype.pushTracks = function (tracks) {
            tracksLayer.removeAllFeatures();
            var features = [], feature;
            _.each(tracks, function (track) {
                feature = _super.wktParser.read(track.line);
                tracks_style.strokeOpacity = Math.min(tracks.length, 10) / tracks.length;
                //tracks_style.strokeOpacity = 0.15;
                feature.style = tracks_style;
                feature.baseData = track;
                features.push(feature);
            });
            tracksLayer.addFeatures(features);
        };

        return TracksMap;
    }(MapService.BaseMap));

    var InductionLoopMap = (function (_super) {
        util.extend(InductionLoopMap, _super);

        var map = undefined;

        var inductionloop_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        inductionloop_style.pointRadius = 5;
        inductionloop_style.fillOpacity = 1;
        inductionloop_style.fillColor = '#FF0000';
        inductionloop_style.strokeColor = '#000000';
        inductionloop_style.cursor = 'pointer';

        var osmLayer = new OpenLayers.Layer.OSM("OpenStreetMap");
        var inductionLoopLayer = new OpenLayers.Layer.Vector("Induction Loops");

        var onFeatureSelect = undefined;

        function InductionLoopMap(containerId) {
            if (map) {
                map.render(containerId);
            } else {
                _super(containerId, [osmLayer, inductionLoopLayer]);
                map = this.getMap();

                var selectFeature = new OpenLayers.Control.SelectFeature(
                    [inductionLoopLayer],
                    {
                        clickout: true,
                        toggle: false,
                        multiple: false,
                        hover: false,
                        onSelect: function (feature) {
                            onFeatureSelect.apply(null, [feature.baseData]);
                        }
                    }
                );
                map.addControls([selectFeature, new OpenLayers.Control.MousePosition({
                    prefix: 'Position: ',
                    separator: ', ',
                    numDigits: 5,
                    emptyString: 'Maus nicht über Karte.',
                    displayProjection: new OpenLayers.Projection("EPSG:4326")
                })]);
                selectFeature.activate();
            }
        }

        InductionLoopMap.prototype.registerOnFeatureSelect = function (func) {
            onFeatureSelect = func;
        };

        InductionLoopMap.prototype.pushInductionLoopData = function (dataarray) {
            var features = [], feature;
            _.each(dataarray, function (data) {
                feature = _super.wktParser.read(data.position);
                feature.style = inductionloop_style;
                feature.baseData = data;
                features.push(feature);
            });
            inductionLoopLayer.addFeatures(features);
        };

        return InductionLoopMap;
    }(MapService.BaseMap));

    var CreateInductionLoopMap = (function (_super) {
        util.extend(CreateInductionLoopMap, _super);
        var fromProjection = new OpenLayers.Projection("EPSG:4326");
        var toProjection = new OpenLayers.Projection("EPSG:900913");
        var map = undefined;

        var onPositionChange = undefined;

        var marker_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        marker_style.pointRadius = 3;
        marker_style.fillOpacity = 1;
        marker_style.fillColor = '#FF0000';
        marker_style.strokeColor = '#000000';

        var osmLayer = new OpenLayers.Layer.OSM("OpenStreetMap");
        var markerLayer = new OpenLayers.Layer.Vector("Marker");

        OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
            defaultHandlerOptions: {
                'single': true,
                'double': false,
                'pixelTolerance': 0,
                'stopSingle': false,
                'stopDouble': false
            },

            initialize: function (options) {
                this.handlerOptions = OpenLayers.Util.extend({}, this.defaultHandlerOptions);
                OpenLayers.Control.prototype.initialize.apply(this, arguments);
                this.handler = new OpenLayers.Handler.Click(
                    this, {
                        'click': this.trigger
                    }, this.handlerOptions
                );
            },

            trigger: function (e) {
                var lonlat = map.getLonLatFromPixel(e.xy).transform(toProjection, fromProjection);
                markerLayer.removeAllFeatures();
                var point = new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat);
                point.transform(fromProjection, toProjection);
                var feature = new OpenLayers.Feature.Vector(point, null, marker_style);
                markerLayer.addFeatures([feature]);
                onPositionChange.apply(null, [lonlat.lon, lonlat.lat]);
            }
        });

        function CreateInductionLoopMap(containerId) {
            if (map) {
                map.render(containerId);
            } else {
                _super(containerId, [osmLayer, markerLayer]);
                map = this.getMap();

                var click = new OpenLayers.Control.Click();
                map.addControls([click, new OpenLayers.Control.MousePosition({
                    prefix: 'Position: ',
                    separator: ', ',
                    numDigits: 5,
                    emptyString: 'Maus nicht über Karte.',
                    displayProjection: fromProjection
                })]);
                click.activate();
            }
        }

        CreateInductionLoopMap.prototype.registerOnPositionChange = function (func) {
            onPositionChange = func;
        };

        return CreateInductionLoopMap;
    }(MapService.BaseMap));


    var BluetoothSensorMap = (function (_super) {
        util.extend(BluetoothSensorMap, _super);
        var map = undefined;

        var active_sensor_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        active_sensor_style.pointRadius = 5;
        active_sensor_style.fillOpacity = 1;
        active_sensor_style.fillColor = '#0000FF';
        active_sensor_style.strokeColor = '#FF0000';
        active_sensor_style.cursor = 'pointer';

        var inactive_sensor_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        inactive_sensor_style.pointRadius = 5;
        inactive_sensor_style.fillOpacity = 0.2;
        inactive_sensor_style.fillColor = '#0000FF';
        inactive_sensor_style.strokeColor = '#000000';
        inactive_sensor_style.cursor = 'pointer';

        var osmLayer = new OpenLayers.Layer.OSM("OpenStreetMap");
        var activeSensorsLayer = new OpenLayers.Layer.Vector("Active Sensors");
        var inactiveSensorsLayer = new OpenLayers.Layer.Vector("Inctive Sensors");

        var onFeatureSelect = undefined;

        function BluetoothSensorMap(containerId) {
            if (map) {
                map.render(containerId);
            } else {
                _super(containerId, [osmLayer, activeSensorsLayer, inactiveSensorsLayer]);
                map = this.getMap();

                var selectFeature = new OpenLayers.Control.SelectFeature(
                    [activeSensorsLayer, inactiveSensorsLayer],
                    {
                        clickout: true,
                        toggle: false,
                        multiple: false,
                        hover: false,
                        onSelect: function (feature) {
                            onFeatureSelect.apply(null, [feature.baseData]);
                        }
                    }
                );
                map.addControls([selectFeature,
                    new OpenLayers.Control.MousePosition({
                        prefix: 'Position: ',
                        separator: ', ',
                        numDigits: 5,
                        emptyString: 'Maus nicht über Karte.',
                        displayProjection: new OpenLayers.Projection("EPSG:4326")
                    })]);
                selectFeature.activate();
            }
        }

        BluetoothSensorMap.prototype.registerOnFeatureSelect = function (func) {
            onFeatureSelect = func;
        };

        BluetoothSensorMap.prototype.pushBluetoothSensorData = function (data) {
            var active_features = [],
                inactive_features = [],
                feature;
            _.each(data, function (sensor) {
                if (sensor.isactive) {
                    feature = _super.wktParser.read(sensor.position);
                    feature.style = active_sensor_style;
                    feature.baseData = sensor;
                    active_features.push(feature);
                } else {
                    feature = _super.wktParser.read(sensor.position);
                    feature.style = inactive_sensor_style;
                    feature.baseData = sensor;
                    inactive_features.push(feature);
                }
            });
            activeSensorsLayer.addFeatures(active_features);
            inactiveSensorsLayer.addFeatures(inactive_features);
        };

        return BluetoothSensorMap;
    }(MapService.BaseMap));


    var WifiRouterMap = (function (_super) {
        util.extend(WifiRouterMap, _super);
        var map = undefined;

        var active_router_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        active_router_style.pointRadius = 5;
        active_router_style.fillOpacity = 1;
        active_router_style.fillColor = '#00FF00';
        active_router_style.strokeColor = '#000000';
        active_router_style.cursor = 'pointer';

        var inactive_router_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        inactive_router_style.pointRadius = 5;
        inactive_router_style.fillOpacity = 0.5;
        inactive_router_style.fillColor = '#00FF00';
        inactive_router_style.strokeColor = '#000000';
        inactive_router_style.cursor = 'pointer';

        var osmLayer = new OpenLayers.Layer.OSM("OpenStreetMap");
        var activeRoutersLayer = new OpenLayers.Layer.Vector("Active Routers");
        var inactiveRoutersLayer = new OpenLayers.Layer.Vector("Inctive Routers");

        var onFeatureSelect = undefined;

        function WifiRouterMap(containerId) {
            if (map) {
                map.render(containerId);
            } else {
                _super(containerId, [osmLayer, activeRoutersLayer, inactiveRoutersLayer]);
                map = this.getMap();

                var selectFeature = new OpenLayers.Control.SelectFeature(
                    [activeRoutersLayer, inactiveRoutersLayer],
                    {
                        clickout: true,
                        toggle: false,
                        multiple: false,
                        hover: false,
                        onSelect: function (feature) {
                            onFeatureSelect.apply(null, [feature.baseData]);
                        }
                    }
                );
                map.addControls([selectFeature, new OpenLayers.Control.MousePosition({
                    prefix: 'Position: ',
                    separator: ', ',
                    numDigits: 5,
                    emptyString: 'Maus nicht über Karte.',
                    displayProjection: new OpenLayers.Projection("EPSG:4326")
                })]);
                selectFeature.activate();
            }
        }

        WifiRouterMap.prototype.registerOnFeatureSelect = function (func) {
            onFeatureSelect = func;
        };

        WifiRouterMap.prototype.pushWifiRouterData = function (data) {
            var active_features = [],
                inactive_features = [],
                feature;
            _.each(data, function (router) {
                if (router.isactive) {
                    feature = _super.wktParser.read(router.position);
                    feature.style = active_router_style;
                    feature.baseData = router;
                    active_features.push(feature);
                } else {
                    feature = _super.wktParser.read(router.position);
                    feature.style = inactive_router_style;
                    feature.baseData = router;
                    inactive_features.push(feature);
                }
            });
            activeRoutersLayer.addFeatures(active_features);
            inactiveRoutersLayer.addFeatures(inactive_features);
        };

        return WifiRouterMap;
    }(MapService.BaseMap));


    var MotionMap = (function (_super) {
        util.extend(MotionMap, _super);
        var map = undefined;

        var motion_style = OpenLayers.Util.extend({}, OpenLayers.Feature.Vector.style['default']);
        motion_style.pointRadius = 5;
        motion_style.fillOpacity = 1;
        motion_style.fillColor = '#00FF00';
        motion_style.strokeColor = '#000000';
        motion_style.cursor = 'pointer';

        var osmLayer = new OpenLayers.Layer.OSM("OpenStreetMap");
        var motionLayer = new OpenLayers.Layer.Vector("Motion");

        var onFeatureSelect = undefined;

        function MotionMap(containerId) {
            if (map) {
                map.render(containerId);
            } else {
                _super(containerId, [osmLayer, motionLayer]);
                map = this.getMap();
            }
            var selectFeature = new OpenLayers.Control.SelectFeature(
                [motionLayer],
                {
                    clickout: true,
                    toggle: false,
                    multiple: false,
                    hover: false,
                    onSelect: function (feature) {
                        onFeatureSelect.apply(null, [feature.baseData]);
                    }
                }
            );
            map.addControls([selectFeature, new OpenLayers.Control.MousePosition({
                prefix: 'Position: ',
                separator: ', ',
                numDigits: 5,
                emptyString: 'Maus nicht über Karte.',
                displayProjection: new OpenLayers.Projection("EPSG:4326")
            })]);
            selectFeature.activate();
        }

        MotionMap.prototype.registerOnFeatureSelect = function (func) {
            onFeatureSelect = func;
        };

        MotionMap.prototype.pushMotionData = function (data, lowest, highest) {
            motionLayer.removeAllFeatures();
            var features = [],
                feature;
            _.each(data, function (motion) {
                feature = _super.wktParser.read(motion.position);
                feature.style = OpenLayers.Util.extend({},motion_style);
                feature.style.fillOpacity = 0.5;
                //feature.style.fillOpacity = (Number(motion.threshold)-lowest)/(highest-lowest);
                console.log('adminMapModule.js: ', Math.ceil(motion.threshold));
                switch(Math.ceil(motion.threshold)) {
                    case 1:
                    case 2:
                    case 3:
                    case 4:
                        feature.style.fillColor = '#BFFF00';
                       // console.log('adminMapModule.js: 1,2');
                        break;
                    case 5:
                        feature.style.fillColor = '#EEFF00';
                        //console.log('adminMapModule.js: 3');
                        break;
                    case 6:
                        feature.style.fillColor = '#FFE500';
                        //console.log('adminMapModule.js: 4');
                        break;
                    case 7:
                        feature.style.fillColor = '#FFD800';
                        //console.log('adminMapModule.js: 5');
                        break;
                    case 8:
                        feature.style.fillColor = '#FFB200';
                        //console.log('adminMapModule.js: 6');
                        break;
                    case 9:
                        feature.style.fillColor = '#FF5D00';
                        //console.log('adminMapModule.js: 7');
                        break;
                    default:
                        feature.style.fillColor = '#FF0000';
                    //console.log('adminMapModule.js: def');
                }
                feature.baseData = motion;
                features.push(feature);
            });
            motionLayer.addFeatures(features);
        };

        return MotionMap;
    }(MapService.BaseMap));

    return exports;
});