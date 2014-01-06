/**
 * User: DennisHoeting
 * Date: 04.06.13
 * Time: 17:54
 *
 * $
 */

var app = angular.module('loginApp', ['ui', 'ui.bootstrap', 'directives', 'socketModule', 'alertModule'])
    .config(function ($locationProvider, $routeProvider) {
        $routeProvider
            .when('/login', {controller: LoginViewCtrl, templateUrl: 'login/partial/loginView'})
            .otherwise({redirectTo: '/login'});

        $locationProvider.html5Mode(true);
    });