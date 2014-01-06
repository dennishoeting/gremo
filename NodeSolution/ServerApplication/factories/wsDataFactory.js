/**
 * User: DennisHoeting
 * Date: 19.06.13
 * Time: 21:01
 *
 * $
 */

module.exports.WSDataFactory = (function () {
    function WSDataFactory(configs) {
        this.q = configs.q;
        this.logger = configs.logger;
    }

    WSDataFactory.prototype.validateRegistrationData = function (data) {
        var deferred = this.q.defer();

        if (data.email == undefined) {
            deferred.reject(new Error('email must not be undefined.'));
        } else if (data.email.length < 5) {
            deferred.reject(new Error('email too short.'));
        } else if (data.password == undefined) {
            deferred.reject(new Error('password must not be undefined.'));
        } else if (data.password.length < 1) {
            deferred.reject(new Error('password too short.'));
        } else if (data.code == undefined) {
            deferred.reject(new Error('code must not be undefined.'));
        } else if (data.code.length < 1) {
            deferred.reject(new Error('code too short.'));
        } else {
            deferred.resolve(data);
        }

        return deferred.promise;
    };

    WSDataFactory.prototype.validateOpenRegistrationData = function (data) {
        var deferred = this.q.defer();

        if (data.name == undefined) {
            deferred.reject(new Error('name must not be undefined.'));
        } else if (data.name.length < 1) {
            deferred.reject(new Error('name too short.'));
        } else if (data.password == undefined) {
            deferred.reject(new Error('password must not be undefined.'));
        } else if (data.password.length < 1) {
            deferred.reject(new Error('password too short.'));
        } else {
            deferred.resolve(data);
        }

        return deferred.promise;
    };

    WSDataFactory.prototype.validateLoginData = function (data) {
        var deferred = this.q.defer();

        if (data.username == undefined) {
            deferred.reject(new Error('username must not be undefined.'));
        } else if (data.username.length < 1) {
            deferred.reject(new Error('username too short.'));
        } else if (data.password == undefined) {
            deferred.reject(new Error('password must not be undefined.'));
        } else if (data.password.length < 1) {
            deferred.reject(new Error('password too short.'));
        } else {
            deferred.resolve({
                login: data.username,
                password: data.password
            });
        }

        return deferred.promise;
    };

    return WSDataFactory;
})();