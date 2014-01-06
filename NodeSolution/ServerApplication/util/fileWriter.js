/**
 * User: DennisHoeting
 * Date: 06.08.13
 * Time: 20:14
 *
 * $
 */
module.exports.FileWriter = (function () {
    var q = undefined;
    var logger = undefined;
    var _ = undefined;
    var fs = undefined;

    function FileWriter(configs) {
        q = configs.q;
        logger = configs.logger;
        _ = configs.underscore;
        fs = configs.fs;
    }

    FileWriter.prototype.write = function (name, file) {
        var deferred = q.defer();
        fs.writeFile('./Resources/' + name, file, function (err) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });
        return deferred.promise;
    };

    return FileWriter;
})();