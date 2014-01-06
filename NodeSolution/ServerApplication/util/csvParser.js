/**
 * User: DennisHoeting
 * Date: 06.08.13
 * Time: 20:14
 *
 * $
 */
module.exports.CSVParser = (function () {
    var csv = undefined;
    var q = undefined;
    var logger = undefined;
    var _ = undefined;

    function CSVParser(configs) {
        csv = configs.csv;
        q = configs.q;
        logger = configs.logger;
        _ = configs.underscore;
    }

    CSVParser.prototype.parse = function (file) {
        var deferred = q.defer();
        console.log('csvParser.js: parsing....');
        var result = {};

        csv()
            .from(file, {delimiter: ';'})
            .to.array(function (data) {
                var result = [];

                // Analyze head
                var head = data[0];
                var timestampColumn,
                    dataColumns = [];

                for (var i = 0; i < head.length; i++) {
                    if (head[i] == 'timestamp') {
                        timestampColumn = i;
                    } else if (head[i].substr(0, 'data_'.length)=='data_') {
                        dataColumns.push({loopId: parseInt(head[i].substring('data_'.length)), column: i});
                    }
                }

                // Go through body
                if (timestampColumn != undefined && dataColumns.length > 0) {
                    for (var i = 0; i < dataColumns.length; i++) {
                        for (var j = 1; j < data.length; j++) {
                            var parts = data[j][timestampColumn].match(/(\d+)/g);
                            result.push({
                                inductionLoopId: dataColumns[i].loopId,
                                timestamp: new Date(parts[2],parts[1]-1,parts[0],parts[3],parts[4]),
                                count: parseInt(data[j][dataColumns[i].column])
                            });
                        }
                    }
                }

                deferred.resolve(result);
            });
        return deferred.promise;
    };

    return CSVParser;
})();