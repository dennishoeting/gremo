/**
 * User: DennisHoeting
 * Date: 09.04.13
 * Time: 16:34
 *
 * Module for server application.
 */

/*
 * Required controllers
 */
var logger = require('log4js').getLogger('serverApplication.js');
logger.setLevel('INFO');
var q = require('q');
var cronJob = require('cron').CronJob;
var _ = require('underscore');

var kmlParser = new (require('./util/kmlParser.js').KMLParser)({
    xml2js: require('xml2js'),
    q: q,
    logger: logger
});
var csvParser = new (require('./util/csvParser.js').CSVParser)({
    csv: require('csv'),
    underscore: _,
    q: q,
    logger: logger
});
var fileWriter = new (require('./util/fileWriter.js').FileWriter)({
    fs: require('fs'),
    underscore: _,
    q: q,
    logger: logger
});

var databaseCtrl = new (require('./controllers/databaseCtrl.js').DatabaseControl)({
    pg: require('pg'),
    q: q,
    logger: logger,
    underscore: _
});

/*
 * Instantiate Factories
 */
var httpDataFactory = new (require('./factories/httpDataFactory.js').HTTPDataFactory)({
    q: q,
    logger: logger,
    underscore: _
});
var wsDataFactory = new (require('./factories/wsDataFactory.js')).WSDataFactory({
    q: q,
    logger: logger,
    underscore: _
});

/*
 * Instantiate Handlers
 */
var httpSocketHandler = new (require('./handlers/httpSocketHdl.js').HTTPSocketHandler)({
    databaseCtrl: databaseCtrl,
    logger: logger,
    dataFactory: httpDataFactory,
    underscore: _
});
var webSocketHandler = new (require('./handlers/webSocketHdl.js').WSHandler)({
    databaseCtrl: databaseCtrl,
    logger: logger,
    dataFactory: wsDataFactory,
    kmlParser: kmlParser,
    csvParser: csvParser,
    fileWriter: fileWriter
});

/*
 * Instantiate Controllers
 */
var httpSocketCtrl = new (require('./controllers/httpSocketCtrl.js').HTTPSocketCtrl)({
    http: require('http'),
    express: require('express'),
    logger: logger,
    q: require('q'),
    httpSocketHandler: httpSocketHandler
});
var webSocketCtrl = new (require('./controllers/webSocketCtrl.js').WebSocketCtrl)({
    http: require('http'),
    socketIO: require('socket.io'),
    underscore: require('underscore'),
    logger: logger,
    q: require('q'),
    webSocketHandler: webSocketHandler
});


/*
 * Module
 */
module.exports.ServerApplication = (function () {
    var startParameter = undefined;

    function ServerApplication(params) {
        startParameter = params;
    }

    /**
     * Start main server
     *
     * @param startParameter Possible properties:
     * - dbConnection, connection string for database connection
     * - sensorPort, port for http server
     * - webSocketPort, üort for web socket
     * - onStarted : function, is invoked if server was started
     * - onConnect : function, is invoked if socket connected to web socket
     *
     * @returns self for chaining
     */
    ServerApplication.prototype.start = function () {
        // Validate mandatories
        if (!startParameter.sensorPort || !startParameter.webSocketPort || !startParameter.dbConnection) {
            throw new Error('Sensor port, web socket port and database connection string are mandatory.');
        }

        return q.all([
            /*
             * Establish database connection
             * - Connect with appropriate connection parameters
             * - - connectionString: connectionString for connection
             * - - onConnect: Callback to be invoked when connection is established
             */
            databaseCtrl.connect({
                connectionString: startParameter.dbConnection
            })
                .then(function () {
                    // At midn, 6am, 12am, 6pm
                    new cronJob('0 0-23/6 * * *', function () {
                        databaseCtrl.calculateRanks()
                            .then(function (result) {
                                if (result) {
                                    logger.info('Ranks calculated.');
                                } else {
                                    logger.error('Rank calculation failed!');
                                }
                            });
                    }, null, true);

                    // At 4 o'clock
                    new cronJob('0 4 * * *', function () {
                        databaseCtrl.pushNewRandomIdentificationHashPart()
                            .then(function () {
                                logger.info('New random pushed.');
                            });
                    }, null, true);
                })
                .fail(function (err) {
                    logger.error('Error: ', err);
                }),

            /*
             * Establish http socket connection
             * - Start http socket with appropriate start parameters
             * - - port: port from stat parameters
             * - - onStarted: callback to be invoked when socket is started
             */
            httpSocketCtrl.start({
                port: startParameter.sensorPort
            }),

            /*
             * Establish web socket connection
             * - Start web socket with appropriate start parameter
             * - - port: Port for web socket connection (for web clients)
             * - - onStarted: Callback to be invoked when web socket started
             */
            webSocketCtrl.start({
                port: startParameter.webSocketPort
            })
        ]);
    };

    ServerApplication.prototype.stop = function () {
        logger.info('Stopping main application.');

        databaseCtrl.disconnect()
            .then(function () {
                console.log('serverApplication.js: db closed');
                return httpSocketCtrl.stop();
            })
            .then(function () {
                console.log('serverApplication.js: http closed');
                return webSocketCtrl.stop();
            })
            .then(function () {
                console.log('serverApplication.js: ws closed');
            })
    };

    // expose exports
    return ServerApplication;
})();

