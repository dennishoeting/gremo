/**
 * Created with JetBrains WebStorm.
 * User: DennisHoeting
 * Date: 09.04.13
 * Time: 19:46
 * To change this template use File | Settings | File Templates.
 */


function OpenLoginCtrl($scope, $rootScope, $dialog, Alert) {
    $scope.alerts = Alert.repository;
    $scope.closeAlert = Alert.close;

    $scope.appLink = "https://play.google.com/store/apps/details?id=com.GreMo.GreMoApp&referrer=utm_source%3DGremo%2520Homepage%26utm_medium%3DAlfsee";

    // https://coderwall.com/p/ngisma
    $rootScope.safeApply = function (fn) {
        var phase = this.$root.$$phase;
        if (phase == '$apply' || phase == '$digest') {
            if (fn && (typeof(fn) === 'function')) {
                fn();
            }
        } else {
            this.$apply(fn);
        }
    };

    $scope.openDisclaimer = function () {
        $dialog.dialog({
            templateUrl: '/login/partial/disclaimerDialog',
            controller: 'DisclaimerDialogCtrl'
        }).open();
    };

    $scope.openContact = function () {
        $dialog.dialog({
            templateUrl: '/login/partial/contactDialog',
            controller: 'ContactDialogCtrl'
        }).open();
    };

    $scope.donateTrack = function () {
        $dialog.dialog({
            templateUrl: '/login/partial/donateTrackDialog',
            controller: 'DonateTrackDialogCtrl'
        })
            .open();
    };

    $scope.feedback = function () {
        $dialog.dialog({
            templateUrl: '/login/partial/feedbackDialog',
            controller: 'FeedbackDialogCtrl',
            keyboard: false,
            backdropClick: false
        }).open();
    };

    $scope.openFaq = function () {
        $dialog.dialog({
            templateUrl: '/login/partial/faqDialog',
            controller: 'FaqDialogCtrl',
            keyboard: false,
            backdropClick: false
        }).open();
    };
}

function OpenLoginViewCtrl($scope, WebSocketService, $routeParams, Alert) {
    $scope.score = 0;
    $scope.regData = {
        name: '',
        password: '',
        password2: '',
        cryptPass: ''
    };

    $scope.$watch('regData.password', function (newPass) {
        $scope.regData.cryptPass = String(CryptoJS.SHA256(newPass));
    });

    $scope.loginData = {
        login: '',
        uncryptPass: '',
        cryptPass: '',
        dest: $routeParams.dest
    };

    $scope.$watch('loginData.uncryptPass', function (newPass) {
        $scope.loginData.cryptPass = String(CryptoJS.SHA256(newPass));
    });


    WebSocketService.connect({type: 'login'});

    var urlParts = document.URL.split(':');
    $scope.adminAddr = ['http:', urlParts[1], ':', 1332, '/admin'].join('');

    $scope.validate = function () {
        var nameValid = ($scope.regData.name && $scope.regData.name.length > 0);
        var pwExist = $scope.regData.password.length > 0;
        var pwMatch = $scope.regData.password == $scope.regData.password2;
        return nameValid && pwExist && pwMatch;
    };

    var loginSuccess = $routeParams.loginSuccess;
    var registrationSuccess = $routeParams.registrationSuccess;
    var regConfirmMail = $routeParams.regConfirmMail;
    var logoutSuccess = $routeParams.logoutSuccess;
    var activationSuccess = $routeParams.activationSuccess;
    var resetSuccess = $routeParams.resetSuccess;
    var accountDeleted = $routeParams.deleted;
    if (loginSuccess == 'false') {
        Alert.alertError('Login fehlgeschlagen.');
    } else if (registrationSuccess == 'true') {
        if (regConfirmMail) {
            Alert.alertSuccess('Registrierung erfolgreich. Eine eMail wurde an ' + regConfirmMail + ' gesendet.');
        }
        Alert.alertSuccess('Registrierung erfolgreich. Du kannst dich nun direkt einloggen.');
    } else if (registrationSuccess == 'false') {
        Alert.alertError('Registrierung fehlgeschlagen.');
    } else if (logoutSuccess == 'true') {
        Alert.alertSuccess('Logout erfolgreich.');
    } else if (activationSuccess == 'true') {
        Alert.alertSuccess('Aktivierung erfolgreich.');
    } else if (activationSuccess == 'false') {
        Alert.alertError('Aktivierung fehlgeschlagen.');
    } else if (resetSuccess == 'true') {
        Alert.alertSuccess('Zurücksetzen erfolgreich.');
    } else if (resetSuccess == 'false') {
        Alert.alertError('Zurücksetzen fehlgeschlagen.');
    } else if (accountDeleted == 'true') {
        Alert.alertSuccess('Tschüss!');
    }

    $scope.modalOpts = {
        keyboard: false,
        backdropClick: false
    };
}