/**
 * User: DennisHoeting
 * Date: 23.08.13
 * Time: 17:38
 *
 * $
 */
var q = require('q');         //FIXME dependency injection!
var forbiddenStrings = ['DROP', 'SELECT', 'DELETE', 'ALTER', 'WHERE'];

module.exports.validate = function(data) {
    var deferred = q.defer();
    // Test forbitten characters
    var forbidden = false;
    for (var k in data) {
        if (data.hasOwnProperty(k) && typeof data[k] == 'string') {
            /*
             * Strip HTML
             */
            data[k] = data[k].replace(/<(?:.|\n)*?>/gm, '');

            /*
             * Check for forbidden strings
             */
            for (var i = 0; i < forbiddenStrings.length; i++) {
                if (data[k].toLowerCase().indexOf(forbiddenStrings[i].toLowerCase()) >= 0) {
                    forbidden = true;
                }
            }
        }
    }
    if (forbidden) {
        deferred.reject('Forbitten characters.');
    } else {
        deferred.resolve(data);
    }

    return deferred.promise;
};