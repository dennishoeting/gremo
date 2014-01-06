/**
 * User: DennisHoeting
 * Date: 09.04.13
 * Time: 16:34
 *
 * Module for http socket connection.
 */


/*
 * Required modules
 */
var http = undefined;
var express = undefined;
var logger = undefined;
var q = undefined;
var httpSocketHandler = undefined;

/*
 * Module
 */
module.exports.HTTPSocketCtrl = (function () {
    /*
     * Http server instance
     */
    function HTTPSocketCtrl(configs) {
        var _this = this;

        http = configs.http;
        express = configs.express;
        logger = configs.logger;
        q = configs.q;
        httpSocketHandler = configs.httpSocketHandler;

        this.app = undefined;
        this.httpServer = undefined;

        /*
         * Configure app
         */
        this.app = express();
        this.app.configure(function () {
            _this.app.use(_this.app.router);
            _this.app.use(express.logger());
        });

        /*
         * OPTIONS-Requests
         */
        this.app.options('*', httpSocketHandler.options);

        /*
         * Interfaces
         * INSERT NEW INTERFACE HERE
         */
        this.app.put('/user', express.bodyParser(), httpSocketHandler.processLogin);
        //this.app.get ('/user/:id', httpSocketHandler.processUserDataRequest);
        this.app.get('/user/:userId/points', httpSocketHandler.processPointRequest);
        this.app.get('/action/:userId/list', httpSocketHandler.processGetActionList);
        this.app.post('/action/:userId', express.bodyParser(), httpSocketHandler.processStartAction);
        this.app.put('/action/:userId/gps', express.bodyParser(), httpSocketHandler.processGPSData);
        this.app.put('/action/:userId/motion', express.bodyParser(), httpSocketHandler.processMotionData);
        this.app.put('/action/:userId/wifi', express.bodyParser(), httpSocketHandler.processWIFIData);
        this.app.put('/action/:userId/bluetooth', express.bodyParser(), httpSocketHandler.processBluetoothData);
        this.app.put('/action/:userId/end', httpSocketHandler.processStopAction);
        this.app.post('/wifisensor', express.bodyParser(), httpSocketHandler.processAddWifi);
        this.app.post('/bluetoothsensor', express.bodyParser(), httpSocketHandler.processAddBluetooth);
        this.app.put('/bluetoothsensor/:mac', express.bodyParser(), httpSocketHandler.processBluetoothSensorData);

        /*
         * Fallback
         */
        this.app.all('*', httpSocketHandler.fallback);
    }

    /**
     * Start HTTP server
     *
     * @param startParameter Possible properties
     * - port, port for HTTP server.
     * - onStarted, callback to be invoked when socket started
     * @returns self for chaining
     */
    HTTPSocketCtrl.prototype.start = function (startParameter) {
        logger.info('httpSocketCtrl.js: starting');
        var deferred = q.defer();
        var retryCounter = 0, MAX_RETRY = 5;

        var _this = this;

        // Create server and start
        try {
            this.httpServer = http.createServer(this.app);

            this.httpServer.on('listening', function () {
                logger.info('HTTP server ready.');
                deferred.resolve();
            });
            this.httpServer.on('error', function (e) {
                /*
                email = new (require('./../../WebApplication/controllers/smtpCtrl.js').SMTPController)({
                    q: q,
                    logger: logger,
                    emailjs: require('emailjs')
                });
                email.sendErrorMail(new Error('HSC: '+ e.message));
                  */
                if (e.code == 'EADDRINUSE' && retryCounter <= MAX_RETRY) {
                    logger.info('Address in use, retrying... ' + retryCounter);
                    setTimeout(function () {
                        _this.httpServer.listen(startParameter.port);
                        retryCounter++;
                    }, 1000);
                } else {
                    deferred.reject(e);
                }
            });

            this.httpServer.listen(startParameter.port);
        } catch (e) {
            deferred.reject(e);
        }

        return deferred.promise;
    };

    HTTPSocketCtrl.prototype.stop = function () {
        var deferred = q.defer();
        try {
            this.httpServer.close(function () {
                logger.info('HTTP socket closed.');

                deferred.resolve();
            });
        } catch (e) {
            deferred.reject(e);
        }
        return deferred.promise;
    };

    /*
     * Expose exports
     */
    return HTTPSocketCtrl;
})();