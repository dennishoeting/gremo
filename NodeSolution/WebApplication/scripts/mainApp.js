/**
 * User: DennisHoeting
 * Date: 04.06.13
 * Time: 17:52
 *
 * $
 */
var app = angular.module('mainApp', [
        'ui', 'ui.bootstrap',
        'socketModule', 'mainMapModule',
        'userModule', 'statisticsModule', 'actionsModule', 'messagesModule', 'fuelModule',
        'htmlGen', 'alertModule',
        'directives', 'filters'])
    .config(function ($routeProvider, $locationProvider, $provide) {
        /*
        $provide.decorator("$exceptionHandler", function($delegate) {
            return function(exception, cause) {
                $delegate(exception, cause);
                //TODO: Open custom popup
            };
        });
        */

        $routeProvider
            .when('/main', {controller: ActionsCtrl, templateUrl: 'main/partial/actions'})
            .when('/messages', {controller: MessagesCtrl, templateUrl: 'main/partial/messages'})
            .when('/communities', {controller: CommunitiesCtrl, templateUrl: 'main/partial/communities'})
            .when('/statistics', {controller: StatisticsCtrl, templateUrl: 'main/partial/statistics'})
            .when('/actionMap/:id', {controller: ActionMapCtrl, templateUrl: '../main/partial/actionMap'})
            .when('/actionStat/:id', {controller: ActionStatsCtrl, templateUrl: '../main/partial/actionStats'})
            .when('/community/:id', {controller: CommunityCtrl, templateUrl: '../main/partial/community'})
            .when('/user/:id', {controller: UserCtrl, templateUrl: '../main/partial/user'})
            .when('/settings', {controller: SettingsCtrl, templateUrl: '../main/partial/settings'})
            .when('/logout', {redirectTo: function () {
                window.location.reload();
            }})
            .otherwise({redirectTo: '/main'});

        $locationProvider.html5Mode(true);
    });
