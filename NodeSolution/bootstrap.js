/**
 * User: DennisHoeting
 * Date: 09.04.13
 * Time: 16:27
 *
 * Entry point and bootstrapper for all components.
 * The function 'main' will start all components and establish appropriate connections.
 */

/**
 * Main method
 *
 * @param argv parameters given at app start
 *  Foe example,
 *  $ node ui-bootstrap.js 10815
 *      "10815" is stored in argv[2]
 */
/*
 * Default values
 */
var MAIN_SERVER_HTTP_PORT = 50832,
    MAIN_SERVER_WS_PORT = 40832,
    WEB_SERVER_PORT = 1332,
    DATABSE_PORT = 50815,
    DATABASE_HOST = 'alfsee.informatik.uni-oldenburg.de',
    DATABASE_DB_NAME = 'gremo',
    DATABASE_USERNAME = 'postgres',
    DATABASE_PASSWORD = 'gremo';

/*
 * Get data from arguments
 */
var webServerPort = process.argv[2] || WEB_SERVER_PORT,
    mainServerHttpPort = process.argv[3] || MAIN_SERVER_HTTP_PORT,
    mainServerWebSocketPort = process.argv[4] || MAIN_SERVER_WS_PORT,
    databasePort = process.argv[5] || DATABSE_PORT,
    databaseHost = process.argv[6] || DATABASE_HOST,
    databaseDBName = process.argv[7] || DATABASE_DB_NAME,
    databaseUsername = process.argv[8] || DATABASE_USERNAME,
    databasePassword = process.argv[9] || DATABASE_PASSWORD;

var restartCounter = 0;

var MAX_RESTART = 3;

var os = require("os");

var log4js = require('log4js');
log4js.configure({
    appenders: [
        {
            type: 'console'
        },
        {
            type: 'telnet',
            port: 40815,
            onReady: function (telnetServer) {
                console.log('bootstrap.js: got server ', telnetServer);
            }
        },
        {
            "type": "file",
            "filename": "logs/bootstrap.log",
            "maxLogSize": 2500000,
            "backups": 25,
            "category": "bootstrap.js"
        },
        {
            type: 'file',
            filename: 'logs/serverApplication.log',
            category: 'serverApplication.js',
            "maxLogSize": 2500000,
            "backups": 25
        },
        {
            type: 'file',
            filename: 'logs/webApplication.log',
            category: 'webApplication.js',
            "maxLogSize": 2500000,
            "backups": 25
        }
    ]
});
var logger = log4js.getLogger('bootstrap.js');
logger.setLevel('INFO');

var q = require('q');

var smtp = new (require('./WebApplication/controllers/smtpCtrl.js').SMTPController)({
    q: q,
    logger: logger,
    emailjs: require('emailjs')
});

/*
 * Initialize main server with appropriate start parameters
 * - dbConnection: Connection-String für PostreSQL-Database
 * - webSocketPort: Port for web socket connection to main server
 * - sensorPort: Http-Port for restful interface
 * - onStarted: Callback to be invoked when main server has started
 */
var serverApplication = new (require('./ServerApplication/serverApplication').ServerApplication)({
    dbConnection: ['tcp://', databaseUsername, ':', databasePassword, '@', databaseHost, ':', databasePort, '/', databaseDBName].join(''),
    webSocketPort: mainServerWebSocketPort,
    sensorPort: mainServerHttpPort
});
/*
 * Initialize web server with appropriate start parameters
 * - webSocketPort: Port for web socket connection (for web clients)
 * - onStarted: Callback to be invoked when web server has started
 */
var webApplication = new (require('./WebApplication/webApplication').WebApplication)({
    webSocketPort: webServerPort
});

function main() {
    return smtp.sendErrorMail(new Error('Kein Error, nur Neustart von ' + typeof arguments.callee.caller + '\n'
            + '\n'
            + arguments.callee.caller.toString()))
        .then(function () {
            /*
             * Start main server
             */
            return serverApplication.start();
        })
        .then(function () {
            logger.info('Main server start success');

            // Connect web server to main server
            return webApplication.connectToWS({
                host: 'localhost',
                port: mainServerWebSocketPort
            });
        })
        .then(function () {
            logger.info('Web server start success');
            /*
             * Start web server
             */
            return webApplication.start();
        })
        .fail(function (err) {
            throw err;
        });
}

/*   FOR TESTING
 *   setTimeout(function () {
 *       throw new Error('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaah PANIC');
 *   }, 20000);
 */

/*
 * Catch uncaughtExceptions!
 */
process.on('uncaughtException', function (err) {
    logger.info('UNCAUGHT EXCEPTION!', err);
    console.log(err);

    console.log('bootstrap.js: okay', new Date());
    webApplication.stop()
        .then(function () {
            console.log('bootstrap.js: webapp stopped');
            return serverApplication.stop();
        })
        .then(function () {
            console.log('bootstrap.js: serverapp stopped');
            return smtp.sendErrorMail(new Error('Error:' + err.message));
        })
        .then(function () {
            logger.info('-- All components stopped successfully');
            if (restartCounter++ < MAX_RESTART) {
                logger.info('## RESTARTING!');
                return main()
            }
        })
        .fail(function (e) {
            logger.error('Error while stopping:', e);
            smtp.sendErrorMail(new Error('(@Stopping:) Error:' + err.message));
        });
});

/*
 * ================
 * ENTRY POINT!
 * ================
 */
main()
    .then(function () {
        logger.info('-- All components started successfully!');
        restartCounter = 0;
    });