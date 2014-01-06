/**
 * User: DennisHoeting
 * Date: 04.06.13
 * Time: 17:55
 *
 * $
 */
var app = angular.module('adminApp', [
        'ui', 'ui.bootstrap', '$strap.directives',
        'adminSocketModule', 'adminMapModule', 'alertModule',
        'htmlGen', 'directives', 'filters'])
    .config(function ($routeProvider, $locationProvider) {
        $routeProvider
            .when('/admin', {controller: StatusCtrl, templateUrl: 'admin/partial/status'})
            .when('/interfaces', {controller: StatusCtrl, templateUrl: 'admin/partial/interfaces'})
            .when('/users', {controller: UsersCtrl, templateUrl: 'admin/partial/users'})
            .when('/communities', {controller: CommunitiesCtrl, templateUrl: 'admin/partial/communities'})
            .when('/tracks', {controller: TracksCtrl, templateUrl: 'admin/partial/tracks'})
            .when('/inductionLoops', {controller: InductionLoopsCtrl, templateUrl: 'admin/partial/inductionLoops'})
            .when('/bluetoothSensors', {controller: BluetoothSensorsCtrl, templateUrl: 'admin/partial/bluetoothSensors'})
            .when('/wifiRouters', {controller: WifiRoutersCtrl, templateUrl: 'admin/partial/wifiRouters'})
            .when('/motion', {controller: MotionCtrl, templateUrl: 'admin/partial/motion'})
            .otherwise({redirectTo: '/admin'});

        $locationProvider.html5Mode(true);
    }).value('$strapConfig', {
        datepicker: {
            format: 'dd.mm.yyyy',
            todayHighlight: true,
            weekStart: 1
        },
        timepicker: {
            showMeridian: false,
            showSeconds: false
        }
    });