/**
 * User: DennisHoeting
 * Date: 10.05.13
 * Time: 22:29
 *
 * $
 */
var os = require("os");
module.exports.SMTPController = (function () {
    var settings = {
        from: 'ma-gremo@informatik.uni-oldenburg.de',
        urlRoot: 'http://' + os.hostname() + '.informatik.uni-oldenburg.de:1332'
    };


    function SMTPController(configs) {
        if (!configs || !configs.q || !configs.logger || !configs.emailjs) {
            throw new Error('Invalid parameters.');
        }

        this.q = configs.q;
        this.logger = configs.logger;
        this.email = configs.emailjs;

        /*this.server = this.email.server.connect({
         user: 'magremo',
         password: 'phnyg13',
         host: 'taifun.Informatik.Uni-Oldenburg.DE',
         ssl: false
         });*/
        this.server = this.email.server.connect({
            user: 'dennis.hoeting@gmail.com',
            password: 'bmzqbrffhauuoejy',
            host: 'smtp.gmail.com',
            ssl: true
        });
    }

    SMTPController.prototype.sendFeedbackMail = function (feedback) {
        var _this = this;

        var deferred = this.q.defer();
        this.server.send({
            text: (feedback.email?'Der Nutzer '+feedback.email:'Ein anonymer Nutzer')+' hat folgendes Feedback gegeben:\n' + feedback.message,
            from: settings.from,
            to: 'ma-gremo@informatik.uni-oldenburg.de',
            subject: 'Feedback gesendet '
        }, function (err) {
            _this.logger.info('bootstrap.js: ', err || 'eMail sent');
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });
        return deferred.promise;
    };

    SMTPController.prototype.sendContactMail = function (data) {
        var _this = this;
        console.log('smtpCtrl.js: got', data);

        var deferred = this.q.defer();
        this.server.send({
            text: 'Ein Nutzer ('+data.email+') hat Kontakt aufgenommen:\n' + data.message,
            from: settings.from,
            to: 'ma-gremo@informatik.uni-oldenburg.de',
            subject: 'Kontaktformular ausgefüllt'
        }, function (err) {
            _this.logger.info('bootstrap.js: ', err || 'eMail sent');
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });
        return deferred.promise;
    };

    SMTPController.prototype.sendErrorMail = function (error) {
        var _this = this;

        var deferred = this.q.defer();
        this.server.send({
            text: os.hostname() + ' has error, \n'
                + 'message is:\n'
                + error.message,
            from: settings.from,
            to: 'dennis.hoeting@gmail.com',
            subject: 'Error on host ' + os.hostname()
        }, function (err) {
            _this.logger.info('bootstrap.js: ', err || 'eMail sent');
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });
        return deferred.promise;
    };

    SMTPController.prototype.sendDummyMail = function () {
        var _this = this;

        var deferred = this.q.defer();
        this.server.send({
            text: 'something :-)',
            from: settings.from,
            to: 'dennis.hoeting@gmail.com',
            subject: 'noch irgendwas'
        }, function (err) {
            _this.logger.info('bootstrap.js: ', err || 'eMail sent');
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });
        return deferred.promise;
    };

    SMTPController.prototype.sendPostRegistrationMail = function (params) {
        var _this = this;

        var deferred = this.q.defer();
        if (!params || !params.to || !params.code) {
            deferred.reject(new Error('Invalid parameters.'));
            return deferred.promise;
        }
        this.server.send({
            from: settings.from,
            to: params.to,
            subject: 'Deine Registrierung wartet auf eine Bestätigung.',
            text: 'Link:\n' +
                settings.urlRoot + '/activate?code=' + params.code
        }, function (err) {
            _this.logger.info('smtpCtrl.js: ', err);
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });
        return deferred.promise;
    };

    SMTPController.prototype.sendResetPasswordMail = function (params) {
        var deferred = this.q.defer();
        if (!params || !params.to || !params.password || !params.code) {
            deferred.reject(new Error('Invalid parameters.'));
            return deferred.promise;
        }

        this.server.send({
            from: settings.from,
            to: params.to,
            subject: 'Passwort zurücksetzen.',
            text: 'Neues Passwort ist ' + params.password + '\n' +
                'Link:\n' +
                settings.urlRoot + '/reset?' +
                'code=' + params.code
        }, function (err) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });
        return deferred.promise;
    };

    return SMTPController;
})();