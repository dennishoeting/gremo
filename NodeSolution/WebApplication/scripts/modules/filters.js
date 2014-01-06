/**
 * User: DennisHoeting
 * Date: 03.05.13
 * Time: 15:01
 *
 * $
 */

/**
 * Usage:
 *   {{some_text | cut:true:100:' ...'}}
 * Options:
 *   - wordwise (boolean) - if true, cut only by words bounds,
 *   - max (integer) - max length of the text, cut to this number of chars,
 *   - tail (string, default: '&nbsp;&hellip;') - add this string to the input
 *     string if the string was cut.
 *
 * FROM https://github.com/angular/angular.js/issues/653
 */
angular.module('filters', [])
    .filter('cut', function () {
        return function (value, wordwise, max, tail) {
            if (!value) return '';

            max = parseInt(max, 10);
            if (!max) return value;
            if (value.length <= max) return value;

            value = value.substr(0, max);
            if (wordwise) {
                var lastspace = value.lastIndexOf(' ');
                if (lastspace != -1) {
                    value = value.substr(0, lastspace);
                }
            }

            return value + (tail || ' …');
        };
    })
    .filter('duration', function () {
        return function (value) {
            if (!value) return '';

            var S = 1000;
            var M = S*60;
            var H = M*60;

            var h = Math.floor(value/H);
            var m = Math.floor((value%H)/M);
            var s = Math.floor((value%M)/S);

            return (h<10?'0'+h:h)+':'+(m<10?'0'+m:m)+':'+(s<10?'0'+s:s);
        }
    });