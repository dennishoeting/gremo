/**
 * User: DennisHoeting
 * Date: 04.06.13
 * Time: 17:54
 *
 * $
 */

var app = angular.module('openLoginApp', ['ui', 'ui.bootstrap', 'directives', 'socketModule', 'alertModule'])
    .config(function ($locationProvider, $routeProvider) {
        $routeProvider
            .when('/openLogin', {controller: OpenLoginViewCtrl, templateUrl: 'openLogin/partial/openLoginView'})
            .otherwise({redirectTo: '/openLogin'});

        $locationProvider.html5Mode(true);
    });