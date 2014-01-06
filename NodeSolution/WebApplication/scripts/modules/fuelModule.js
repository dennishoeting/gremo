/**
 * User: DennisHoeting
 * Date: 04.06.13
 * Time: 19:01
 *
 * $
 */

angular.module('fuelModule', []).factory('Fuel', function () {

    var exports = {
        fuelPrice: {
            "Super Benzin": 1.69,
            "Super E10": 1.51,
            "Super Plus": 1.74,
            "Diesel": 1.32,
            "LPG-Autogas": 0.89
        }
    };

    return exports;
});