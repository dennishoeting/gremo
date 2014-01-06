/**
 * Created with JetBrains WebStorm.
 * User: DennisHoeting
 * Date: 09.04.13
 * Time: 19:46
 * To change this template use File | Settings | File Templates.
 */


function LoginCtrl($scope, $dialog, Alert) {
    $scope.alerts = Alert.repository;
    $scope.appLink = "https://play.google.com/store/apps/details?id=com.GreMo.GreMoApp&referrer=utm_source%3DGremo%2520Homepage%26utm_medium%3DAlfsee";

    $scope.feedback = function () {
        $dialog.dialog({
            templateUrl: '/login/partial/feedbackDialog',
            controller: 'FeedbackDialogCtrl',
            keyboard: false,
            backdropClick: false
        }).open();
    };

    $scope.modalOpts = {
        keyboard: false,
        backdropClick: false
    };
}

function LoginViewCtrl($scope, $dialog, WebSocketService, $routeParams, Alert) {
    $scope.score = 0;
    $scope.regData = {
        email: '',
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
        var emailValid = ($scope.regData.email && $scope.regData.email.match(/^[a-zA-Z0-9][\w\.\+-]*@(?:[a-zA-Z0-9][a-zA-Z0-9_-]+\.)+[A-Z,a-z]{2,5}$/));
        var pwExist = $scope.regData.password.length > 0;
        var pwMatch = $scope.regData.password == $scope.regData.password2;
        return emailValid && pwExist && pwMatch;
    };


    var loginSuccess = $routeParams.loginSuccess;
    var registrationSuccess = $routeParams.registrationSuccess;
    var regConfirmMail = $routeParams.regConfirmMail;
    var logoutSuccess = $routeParams.logoutSuccess;
    var activationSuccess = $routeParams.activationSuccess;
    var resetSuccess = $routeParams.resetSuccess;
    var accountDeleted = $routeParams.deleted;
    if (loginSuccess == 'false') {
        Alert.alertError('Login fehlgeschlagen. Eventuell wurde das Konto nich nicht aktiviert! Der Aktivierungscode wurde per eMail versandt.');
    } else if (registrationSuccess == 'true') {
        Alert.alertSuccess('Registrierung erfolgreich. Eine eMail wurde an ' + (regConfirmMail || 'deine eMail-Adresse') + ' gesendet.');
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
    } else if(accountDeleted == 'true') {
        Alert.alertSuccess('Tschüss!');
    }

    $scope.forgotPassword = function () {
        $dialog.dialog({
            templateUrl: 'login/partial/forgotPasswordDialog',
            controller: 'ForgotPasswordDialogCtrl'
        })
            .open().then(function (email) {
                Alert.alertTransient('Einen Moment bitte....');
                if (email) {
                    var pass = util.getPassword(8);
                    WebSocketService.resetPassword({
                        email: email,
                        password: pass,
                        cryptPassword: String(CryptoJS.SHA256(pass))
                    })
                        .done(function (result) {
                            Alert.alertSuccess('Zurücksetzen fast abgeschlossen. Eine eMail wurde an die angegebene deine eMail-Adresse gesendet.');
                        })
                        .fail(function () {
                            Alert.alertError('Zurücksetzen fehlgeschlagen.');
                        })
                        .always(function () {
                            $scope.$apply();
                        });
                }
            });
    };

    $scope.closeAlert = Alert.close;
}