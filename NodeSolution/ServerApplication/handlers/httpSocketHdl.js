/**
 * User: DennisHoeting
 * Date: 16.04.13
 * Time: 10:46
 *
 * Module for http socket actions.
 * Actions which are bound to http socket routes are encapsulated in this class.
 */

/*
 * Module
 */
module.exports.HTTPSocketHandler = (function () {
    var databaseCtrl = undefined;
    var logger = undefined;
    var dataFactory = undefined;
    var _ = undefined;
    var util = require('util');

    var RAISED_EXCEPTION = 'P0001';
    var FOREIGN_KEY_VIOLATION = '23503';
    var UNIQUE_VIOLATION = '23505';

    function HTTPSocketHandler(configs) {
        databaseCtrl = configs.databaseCtrl;
        logger = configs.logger;
        dataFactory = configs.dataFactory;
        _ = configs.underscore;
    }

    var constants = {
        /*
         * Standard-Header for http responses
         */
        header: {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
        },
        /*
         * HTTP Response codes
         */
        responseCodes: {
            OK: 200,
            ACCEPTED: 202,
            NO_CONTENT: 204,
            BAD_REQUEST: 400,
            UNAUTHORIZED: 401,
            SERVICE_UNAVAILABLE: 503
        }
    };

    /**
     * Process a login request
     *
     * @param req Request
     * - req.body is {username:string, password:string, mac:string}
     * @param res Response
     * - response is user id of nothing, status code is relevant
     */
    HTTPSocketHandler.prototype.processLogin = function (req, res) {
        logger.info('HTTPSockeHandler processLogin req.body: ', req.body);

        // Get data object from request
        dataFactory.getLoginData(req)
            // Write 400 if data validation failed
            .fail(function (error) {
                res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                throw error;
            })
            // Push data into DB
            .then(function (data) {
                return databaseCtrl.login(data)
                    // Send 503 if DB throws error
                    .fail(function (error) {
                        if (error.code == RAISED_EXCEPTION || error.code == FOREIGN_KEY_VIOLATION) {
                            res.writeHead(constants.responseCodes.UNAUTHORIZED, constants.header);
                        } else {
                            res.writeHead(constants.responseCodes.SERVICE_UNAVAILABLE, constants.header);
                        }
                        throw error;
                    });
            })
            // Write 202 if user found or 401 if user not found
            .then(function (user) {
                if (user && user.isactive) {
                    res.writeHead(constants.responseCodes.ACCEPTED, constants.header);
                    res.write(JSON.stringify({
                        userId: user.id
                    }))
                } else {
                    res.writeHead(constants.responseCodes.UNAUTHORIZED, constants.header);
                }
            })
            // Logg error
            .fail(function (error) {
                logger.error('HTTPSockeHandler processLogin error:', error);
            })
            // Send to client
            .finally(function () {
                logger.info('HTTPSockeHandler processLogin res.statusCode : ', res.statusCode);
                res.end();
            });
    };

    HTTPSocketHandler.prototype.processPointRequest = function (req, res) {
        logger.info('HTTPSockeHandler processPointRequest req.body: ', req.body);

        // Get data from request
        dataFactory.getUserPointRequestData(req)
            // Write 400 if validation failed)
            .fail(function (error) {
                res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                throw error;
            })
            // Push into db
            .then(function (data) {
                return databaseCtrl.getUserPoints(data)
                    // Send 503 if DB throws error
                    .fail(function (error) {
                        if (error.code == RAISED_EXCEPTION || error.code == FOREIGN_KEY_VIOLATION) {
                            res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                        } else {
                            res.writeHead(constants.responseCodes.SERVICE_UNAVAILABLE, constants.header);
                        }
                        throw error;
                    });
            })
            // Write 200 and points
            .then(function (result) {
                if (result) {
                    res.writeHead(constants.responseCodes.OK, constants.header);
                    logger.info('sending', result)
                    res.write(JSON.stringify(
                        result
                    ));
                } else {
                    res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                }
            })
            // Logg error
            .fail(function (error) {
                logger.error('HTTPSockeHandler processPointRequest error:', error);
            })
            // Send to client
            .finally(function () {
                logger.info('HTTPSockeHandler processPointRequest res.statusCode : ', res.statusCode);
                res.end();
            });
    };

    HTTPSocketHandler.prototype.processGetActionList = function (req, res) {
        logger.info('HTTPSockeHandler processGetActionList req.body: ', req.body);

        // Get data object from request
        dataFactory.getActionListRequestData(req)
            // Write 400 if data validation failed
            .fail(function (error) {
                res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                throw error;
            })
            // Push data into DB
            .then(function (data) {
                return databaseCtrl.getActionList(data)
                    // Send 503 if DB throws error
                    .fail(function (error) {
                        if (error.code == RAISED_EXCEPTION || error.code == FOREIGN_KEY_VIOLATION) {
                            res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                        } else {
                            res.writeHead(constants.responseCodes.SERVICE_UNAVAILABLE, constants.header);
                        }
                        throw error;
                    });
            })
            // Write 204
            .then(function (result) {
                var list = [];
                _.each(result, function (row) {
                    list.push({
                        id: row.id,
                        date: row.time.getTime(),
                        actionType: row.actiontype,
                        pointsearned: parseInt(row.pointsearned),
                        distance: Number(row.distance)});
                });
                logger.info('Sending:', list);
                res.writeHead(constants.responseCodes.OK, constants.header);
                res.write(JSON.stringify({
                    list: list
                }));
            })
            // Logg error
            .fail(function (error) {
                logger.error('HTTPSockeHandler processGetActionList error:', error);
            })
            // Send to client
            .finally(function () {
                logger.info('HTTPSockeHandler processGetActionList res.statusCode : ', res.statusCode);
                res.end();
            });
    };

    HTTPSocketHandler.prototype.processStartAction = function (req, res) {
        logger.info('HTTPSockeHandler processStartAction req.body: ', req.body);

        // Get data object from request
        dataFactory.getStartActionData(req)
            // Write 400 if data validation failed
            .fail(function (error) {
                res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                throw error;
            })
            // Push data into DB
            .then(function (data) {
                return databaseCtrl.pushAction(data)
                    // Send 503 if DB throws error
                    .fail(function (error) {
                        if (error.code == RAISED_EXCEPTION || error.code == FOREIGN_KEY_VIOLATION) {
                            res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                        } else {
                            res.writeHead(constants.responseCodes.SERVICE_UNAVAILABLE, constants.header);
                        }
                        throw error;
                    });
            })
            // Write 204
            .then(function () {
                res.writeHead(constants.responseCodes.NO_CONTENT, constants.header);
            })
            // Logg error
            .fail(function (error) {
                logger.error('HTTPSockeHandler processStartAction error:', error);
            })
            // Send to client
            .finally(function () {
                logger.info('HTTPSockeHandler processStartAction res.statusCode : ', res.statusCode);
                res.end();
            });
    };

    HTTPSocketHandler.prototype.processStopAction = function (req, res) {
        logger.info('HTTPSockeHandler processStopAction req.body: ', req.body);

        // Get data from request
        dataFactory.getStopActionData(req)
            // Send 400 if data validation failed
            .fail(function (error) {
                res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                throw error;
            })
            // Push to database
            .then(function (data) {
                return databaseCtrl.endAction(data)
                    // Send 503 if DB throws error
                    .fail(function (error) {
                        if (error.code == RAISED_EXCEPTION || error.code == FOREIGN_KEY_VIOLATION) {
                            res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                        } else {
                            res.writeHead(constants.responseCodes.SERVICE_UNAVAILABLE, constants.header);
                        }
                        throw error;
                    })
            })
            // Write 200
            .then(function (result) {
                res.writeHead(constants.responseCodes.OK, constants.header);
                res.write(JSON.stringify({
                    pointsEarned: result.points
                }));
            })
            // Logg error
            .fail(function (error) {
                logger.error('HTTPSockeHandler processStopAction error:', error);
            })
            // Send
            .finally(function () {
                logger.info('HTTPSockeHandler processStopAction res.statusCode : ', res.statusCode);
                res.end();
            });
    };

    /**
     * Process GPS data requests
     *
     * @param req Request
     * - req.body is {lat:number,lng:Number,id:Number}
     * @param res Response
     * - Response is empty, status code is relevant
     */
    HTTPSocketHandler.prototype.processGPSData = function (req, res) {
        logger.info('HTTPSockeHandler processWIFIData req.body: ', util.inspect(req.body, false, null));
        //logger.info('HTTPSockeHandler processGPSData req.body.length: ', req.body.length);

        // Get data
        dataFactory.getPushGPSData(req)
            // Write 400 if validation failed
            .fail(function (error) {
                res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                throw error;
            })
            // Push into db
            .then(function (data) {
                return databaseCtrl.pushGpsData(data)
                    // Write 503 if DB throws
                    .fail(function (error) {
                        if (error.code == RAISED_EXCEPTION || error.code == FOREIGN_KEY_VIOLATION || error.code == UNIQUE_VIOLATION) {
                            res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                        } else {
                            res.writeHead(constants.responseCodes.SERVICE_UNAVAILABLE, constants.header);
                        }
                        throw error;
                    })
            })
            // Write 204
            .then(function () {
                res.writeHead(constants.responseCodes.NO_CONTENT, constants.header);
            })
            // Log error
            .fail(function (error) {
                logger.error('HTTPSockeHandler processGPSData error:', error);
            })
            // Send to client
            .finally(function () {
                logger.info('HTTPSockeHandler processGPSData res.statusCode : ', res.statusCode);
                res.end();
            });
    };

    /**
     * Process GPS data requests
     *
     * @param req Request
     * - req.body is {lat:number,lng:Number,id:Number}
     * @param res Response
     * - Response is empty, status code is relevant
     */
    HTTPSocketHandler.prototype.processMotionData = function (req, res) {
        logger.info('HTTPSockeHandler processWIFIData req.body: ', util.inspect(req.body, false, null));
        //logger.info('HTTPSockeHandler processMotionData req.body.length: ', req.body.length);

        // Get data
        dataFactory.getPushMotionData(req)
            // Write 400 if validation failed
            .fail(function (error) {
                res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                throw error;
            })
            // Push into db
            .then(function (data) {
                return  databaseCtrl.pushMotionData(data)
                    // Write 503 if DB throws
                    .fail(function (error) {
                        if (error.code == RAISED_EXCEPTION || error.code == FOREIGN_KEY_VIOLATION || error.code == UNIQUE_VIOLATION) {
                            res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                        } else {
                            res.writeHead(constants.responseCodes.SERVICE_UNAVAILABLE, constants.header);
                        }
                        throw error;
                    })
            })
            // Write 204
            .then(function () {
                res.writeHead(constants.responseCodes.NO_CONTENT, constants.header);
            })
            // Log error
            .fail(function (error) {
                logger.error('HTTPSockeHandler processMotionData error:', error);
            })
            // Send to client
            .finally(function () {
                logger.info('HTTPSockeHandler processMotionData res.statusCode : ', res.statusCode);
                res.end();
            });
    };

    HTTPSocketHandler.prototype.processAddWifi = function (req, res) {
        logger.info('HTTPSockeHandler processAddWifi req.body: ', req.body);

        // Get data from request
        dataFactory.getAddWifiRouterData(req)
            // Write 400 if validation failed
            .fail(function (error) {
                res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                throw error;
            })
            // Push data into DB
            .then(function (data) {
                return databaseCtrl.addWifiRouter(data)
                    // Write 503 if DB throws
                    .fail(function (error) {
                        if (error.code == RAISED_EXCEPTION || error.code == FOREIGN_KEY_VIOLATION) {
                            res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                        } else {
                            res.writeHead(constants.responseCodes.SERVICE_UNAVAILABLE, constants.header);
                        }
                        throw error;
                    });
            })
            // Write 200
            .then(function () {
                res.writeHead(constants.responseCodes.OK, constants.header);
            })
            // Logg error
            .fail(function (error) {
                logger.error('HTTPSockeHandler processAddWifi error:', error);
            })
            // Send to client
            .finally(function () {
                logger.info('HTTPSockeHandler processAddWifi res.statusCode : ', res.statusCode);
                res.end();
            });
    };

    HTTPSocketHandler.prototype.processWIFIData = function (req, res) {
        logger.info('HTTPSockeHandler processWIFIData req.body: ', util.inspect(req.body, false, null));
        //logger.info('HTTPSockeHandler processWIFIData req.body.length: ', req.body.length);

        // Get data from request
        dataFactory.getPushWifiData(req)
            // Write 400 if validation failed
            .fail(function (error) {
                res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                throw error;
            })
            // Push into db
            .then(function (data) {
                return databaseCtrl.pushWifiData(data)
                    // Write 503 if DB throws
                    .fail(function (error) {
                        if (error.code == RAISED_EXCEPTION || error.code == FOREIGN_KEY_VIOLATION || error.code == UNIQUE_VIOLATION) {
                            res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                        } else {
                            res.writeHead(constants.responseCodes.SERVICE_UNAVAILABLE, constants.header);
                        }
                        throw error;
                    });
            })
            // Write 200
            .then(function () {
                res.writeHead(constants.responseCodes.NO_CONTENT, constants.header);
            })
            // Logg error
            .fail(function (error) {
                logger.error('HTTPSockeHandler processWIFIData error:', error);
            })
            // Send to client
            .finally(function () {
                logger.info('HTTPSockeHandler processWIFIData res.statusCode : ', res.statusCode);
                res.end();
            });
    };

    //TODO test
    HTTPSocketHandler.prototype.processBluetoothData = function (req, res) {
        logger.info('HTTPSockeHandler processBluetoothData req.body: ', req.body);

        // Get data from request
        dataFactory.getPushBluetoothData(req)
            // Write 400 if validation failed
            .fail(function (error) {
                req.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                throw error;
            })
            // Push data into DB
            .then(function (data) {
                return databaseCtrl.pushBluetoothData(data)
                    // Write 503 if DB throws
                    .fail(function (error) {
                        if (error.code == RAISED_EXCEPTION || error.code == FOREIGN_KEY_VIOLATION || error.code == UNIQUE_VIOLATION) {
                            res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                        } else {
                            res.writeHead(constants.responseCodes.SERVICE_UNAVAILABLE, constants.header);
                        }
                        throw error;
                    });
            })
            // Write 204
            .then(function () {
                res.writeHead(constants.responseCodes.NO_CONTENT, constants.header);
            })
            // Logg error
            .fail(function (error) {
                logger.error('HTTPSockeHandler getPushBluetoothData error:', error);
            })
            // Send to client
            .finally(function () {
                logger.info('HTTPSockeHandler getPushBluetoothData res.statusCode : ', res.statusCode);
                res.end();
            });
    };

    HTTPSocketHandler.prototype.processAddBluetooth = function (req, res) {
        logger.info('HTTPSockeHandler processAddBluetooth req.body: ', req.body);

        // Get data from request
        dataFactory.getAddBluetoothData(req)
            // Write 400 if validation failed
            .fail(function (error) {
                res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                throw error;
            })
            // Push data info DB
            .then(function (data) {
                return databaseCtrl.addBluetoothSensor(data)
                    // Write 503 if DB throws
                    .fail(function (error) {
                        if (error.code == RAISED_EXCEPTION || error.code == FOREIGN_KEY_VIOLATION) {
                            res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                        } else {
                            res.writeHead(constants.responseCodes.SERVICE_UNAVAILABLE, constants.header);
                        }
                        throw error;
                    });
            })
            // Write 204
            .then(function () {
                res.writeHead(constants.responseCodes.NO_CONTENT, constants.header);
            })
            // Logg error
            .fail(function (error) {
                logger.error('HTTPSockeHandler processAddBluetooth error:', error);
            })
            // Send to client
            .finally(function () {
                logger.info('HTTPSockeHandler processAddBluetooth res.statusCode : ', res.statusCode);
                res.end();
            });
    };

    HTTPSocketHandler.prototype.processBluetoothSensorData = function (req, res) {
        //logger.info('HTTPSockeHandler processBluetoothSensorData req.body: ', req.body);
        //logger.info('HTTPSockeHandler processBluetoothSensorData req.body.length: ', req.body.length);

        // Get data from request
        dataFactory.getPushBluetoothSensorData(req)
            // Write 400 if validation failed
            .fail(function (error) {
                res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                throw error;
            })
            // Push data info DB
            .then(function (data) {
                return databaseCtrl.pushBluetoothSensorData(data)
                    // Write 503 if DB throws
                    .fail(function (error) {
                        console.log('httpSocketHdl.js: ', error);
                        if (error.code == RAISED_EXCEPTION || error.code == FOREIGN_KEY_VIOLATION || error.code == UNIQUE_VIOLATION) {
                            res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
                        } else {
                            res.writeHead(constants.responseCodes.SERVICE_UNAVAILABLE, constants.header);
                        }
                        throw error;
                    });
            })
            // Write 200
            .then(function () {
                res.writeHead(constants.responseCodes.OK, constants.header);
            })
            // Logg error
            .fail(function (error) {
                logger.error('HTTPSockeHandler processBluetoothSensorData error:', error);
            })
            .finally(function () {
                logger.info('HTTPSockeHandler processBluetoothSensorData res.statusCode : ', res.statusCode);
                res.end();
            });
    };

    HTTPSocketHandler.prototype.options = function (req, res) {
        logger.info('HTTPSockeHandler options req.body: ', req.body);

        res.writeHead(constants.responseCodes.OK, constants.header);
        logger.info('HTTPSockeHandler options res.statusCode : ', res.statusCode);
        // send
        res.end();
    };

    HTTPSocketHandler.prototype.fallback = function (req, res) {
        logger.info('HTTPSockeHandler fallback req.body: ', req.body);

        res.writeHead(constants.responseCodes.BAD_REQUEST, constants.header);
        logger.info('HTTPSockeHandler fallback res.statusCode : ', res.statusCode);
        // send
        res.end();
    };

    return HTTPSocketHandler;
})();