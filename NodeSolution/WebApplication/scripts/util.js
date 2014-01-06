/**
 * User: DennisHoeting
 * Date: 22.04.13
 * Time: 12:57
 *
 * $
 */
var util = (function () {
    var exports = {};

    exports.SECOND = 1000;
    exports.MINUTE = 1000 * 60;
    exports.HOUR = 1000 * 60 * 60;
    exports.DAY = 1000 * 60 * 60 * 24;
    exports.WEEK = 1000 * 60 * 60 * 24 * 7;

    exports.extend = function (someClass, superClass) {
        function __() {
            this.constructor = someClass;
        }

        __.prototype = superClass.prototype;
        someClass.prototype = new __();
    };

    exports.getPassword = function (length) {
        var text = '';
        var set = 'abcdefghijklmnopqrstuvwxyz0123456789';
        for (var i = 0; i < length; i++) {
            text += set.charAt(Math.floor(Math.random() * set.length));
        }
        return text;
    };

    return exports;
}());