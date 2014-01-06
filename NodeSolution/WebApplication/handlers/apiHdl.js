/**
 * User: DennisHoeting
 * Date: 09.05.13
 * Time: 12:58
 *
 * $
 */

var validator = require('./../controllers/inputValidationCtrl.js');

module.exports.APIHandler = (function () {
    var webSocketClient = undefined;
    var smtpCtrl = undefined;
    var passport = undefined;
    var cryptCtrl = undefined;
    var clientCodesPerId = undefined;
    var clientCodesPerCode = undefined;
    var q = undefined;
    var logger = undefined;

    function APIHandler(configs) {
        webSocketClient = configs.webSocketClient;
        passport = configs.passport;
        cryptCtrl = configs.cryptCtrl;
        smtpCtrl = configs.smtpCtrl;
        clientCodesPerId = configs.clientCodesPerId;
        clientCodesPerCode = configs.clientCodesPerCode;
        q = configs.q;
        logger = configs.logger;
    }

    function conductRegistration(_email, _password, _code) {
        var deferred = q.defer();

        if (!_email || !_password) {
            deferred.reject('insufficientData');
        } else if (!_email.match(/^[a-zA-Z0-9][\w\.\+-]*@(?:[a-zA-Z0-9][a-zA-Z0-9_-]+\.)+[A-Z,a-z]{2,5}$/)) {
            deferred.reject('invalidMail');
        } else {
            webSocketClient.emit('register',
                {email: _email, password: _password, code: _code},
                function (err, result) {
                    if (err) {
                        deferred.reject('pgExc' + err.code);
                    } else if (isNaN(result)) {
                        deferred.reject('unknown');
                    } else {
                        deferred.resolve(result);
                    }
                });
        }

        return deferred.promise;
    }

    function sendRegistrationConfirmationMail(_email, _code, _id) {
        var deferred = q.defer();

        smtpCtrl.sendPostRegistrationMail({to: _email, code: _code, id: _id})
            .then(function () {
                deferred.resolve();
            })
            .fail(function () {
                deferred.reject('emailSendFailure');
            });

        return deferred.promise;
    }

    APIHandler.prototype.register = function (req, res) {
        var _code = cryptCtrl.getActivationCode();

        validator.validate(req.body)
            .then(function (validated) {
                req.body = validated;
                var _email = req.body.email;
                var _password = req.body.password;
                return conductRegistration(_email, _password, _code)
                    .then(function (_id) {
                        return sendRegistrationConfirmationMail(_email, _code, _id);
                    })
                    .then(function () {
                        res.redirect('/login?registrationSuccess=true&regConfirmMail=' + _email);
                    });
            })
            .fail(function (reason) {
                res.redirect('/login?registrationSuccess=false&&errorCode=' + reason);
            });
    };

    function conductOpenRegistration(_name, _password) {
        var deferred = q.defer();

        if (!_name || !_password) {
            deferred.reject('insufficientData');
        } else {
            webSocketClient.emit('openRegister',
                {name: _name, password: _password},
                function (err, result) {
                    if (err) {
                        deferred.reject('pgExc' + err.code);
                    } else if (isNaN(result)) {
                        deferred.reject('unknown');
                    } else {
                        deferred.resolve(result);
                    }
                });
        }

        return deferred.promise;
    }

    APIHandler.prototype.openRegister = function (req, res) {
        var _code = cryptCtrl.getActivationCode();
        validator.validate(req.body)
            .then(function (validated) {
                req.body = validated;
                var _name = req.body.name;
                var _password = req.body.password;
                return conductOpenRegistration(_name, _password, _code)
                    .then(function () {
                        res.redirect('/openLogin?registrationSuccess=true');
                    });
            })
            .fail(function (reason) {
                res.redirect('/openLogin?registrationSuccess=false&&errorCode=' + reason);
            });
    };

    APIHandler.prototype.login = function (req, res) {
        var targetUrl = '', extra = '';
        if (req.body && req.body.dest) {
            extra = '&dest=' + req.body.dest;
        }
        validator.validate(req.body)
            .then(function (validated) {
                req.body = validated;
                passport.authenticate('local', function (err, user, info) {
                    console.log('apiHdl.js: ', user);
                    if (err) {
                        return res.redirect('/login?loginSuccess=false' + extra);
                    }
                    if (!user) {
                        return res.redirect('/login?loginSuccess=false' + extra);
                    }
                    req.logIn(user, function (err) {
                        if (err) {
                            return res.redirect('/login?loginSuccess=false' + extra);
                        }
                        var code = cryptCtrl.getUserIdCode(user.id);
                        clientCodesPerId[user.id] = code;
                        clientCodesPerCode[code] = user.id;
                        res.redirect('/main?id=' + String(code) + extra);
                    });

                })(req, res, function () {
                    res.redirect('/login?loginSuccess=false' + extra);
                });
            })
            .fail(function () {
                res.redirect('/login?loginSuccess=false' + extra);
            });

    };

    APIHandler.prototype.openLogin = function (req, res) {
        var targetUrl = '', extra = '';
        if (req.body && req.body.dest) {
            extra = '&dest=' + req.body.dest;
        }
        validator.validate(req.body)
            .then(function (validated) {
                req.body = validated;
                passport.authenticate('local', function (err, user, info) {
                    console.log('apiHdl.js: ', user);
                    if (err) {
                        return res.redirect('/openLogin?loginSuccess=false' + extra);
                    }
                    if (!user) {
                        return res.redirect('/openLogin?loginSuccess=false' + extra);
                    }
                    req.logIn(user, function (err) {
                        if (err) {
                            return res.redirect('/openLogin?loginSuccess=false' + extra);
                        }
                        var code = cryptCtrl.getUserIdCode(user.id);
                        clientCodesPerId[user.id] = code;
                        clientCodesPerCode[code] = user.id;
                        res.redirect('/main?id=' + String(code) + extra);
                    });

                })(req, res, function (err) {
                    res.redirect('/openLogin?loginSuccess=false' + extra);
                });
            })
            .fail(function () {
                res.redirect('/login?loginSuccess=false' + extra);
            });
    };

    APIHandler.prototype.activate = function (req, res) {
        validator.validate(req.query)
            .then(function (validated) {
                req.query = validated;
                webSocketClient.emit('activate', req.query, function (err, result) {
                    if (err || !result) {
                        res.redirect('/login?activationSuccess=false');
                    } else {
                        res.redirect('/login?activationSuccess=true');
                    }
                });
            })
            .fail(function () {
                res.redirect('/login?activationSuccess=false');
            });
    };

    APIHandler.prototype.confirmPasswordReset = function (req, res) {
        validator.validate(req.query)
            .then(function (validated) {
                req.query = validated;
                webSocketClient.emit('confirmPasswordReset', req.query, function (err, result) {
                    if (err) {
                        res.redirect('/login?resetSuccess=false')
                    } else {
                        res.redirect('/login?resetSuccess=true')
                    }
                });
            })
            .fail(function () {
                res.redirect('/login?activationSuccess=false');
            });
    };

    APIHandler.prototype.logout = function (req, res) {
        req.logout();
        res.redirect('/login?logoutSuccess=true');
    };

    APIHandler.prototype.fallback = function (req, res) {
        res.redirect('/verify?dest=' + req.url);
    };

    return APIHandler;
})
    ();