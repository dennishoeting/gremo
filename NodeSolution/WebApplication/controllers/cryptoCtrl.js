/**
 * User: DennisHoeting
 * Date: 11.05.13
 * Time: 19:24
 *
 * $
 */

module.exports.CryptoController = (function () {
    function CryptoController(configs) {
        this.crypto = configs.crypto;
    }

    CryptoController.prototype.getUserIdCode = function (id) {
        if(!id) {
            throw new Error('Invalid parameters.')
        }

        return this.crypto.createHash('md5').update('g#3m0ID:' + id, 'utf8').digest('hex');
    };

    CryptoController.prototype.getActivationCode = function () {
        return this.crypto.createHash('md5').update('4ct1v4t10n-' + new Date().getTime(), 'utf8').digest('hex');
    };

    CryptoController.prototype.getPasswordCode = function (password) {
        if(!password) {
            throw new Error('Invalid parameters.')
        }

        return this.crypto.createHash('md5').update('p455w0#d-' + password + new Date().getTime(), 'utf8').digest('hex');
    };

    return CryptoController;
})();