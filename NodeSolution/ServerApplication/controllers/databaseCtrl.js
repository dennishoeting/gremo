/**
 * User: DennisHoeting
 * Date: 10.04.13
 * Time: 09:38
 *
 * Controller for database.
 */

/*
 * Module
 */
module.exports.DatabaseControl = (function () {
    var deferredQuery = undefined;

    function DatabaseControl(configs) {
        this.pg = configs.pg;
        this.q = configs.q;
        this.logger = configs.logger;
        this._ = configs.underscore;

        /*
         * Database client
         */
        this.dbClient = undefined;
        this.deferredQuery = undefined;
    }

    /**
     * Connect with appropriate connectParameters
     *
     * @param connectParameter Possible properties:
     * - connectionString, connection string für connecting to PostgreSQL - Database
     * - onConnect, callback to be invoked on successfull connection
     */
    DatabaseControl.prototype.connect = function (connectParameter) {
        var _this = this;

        console.log('databaseCtrl.js: connecting');
        var deferred = this.q.defer();

        // Validate mandatories
        if (!connectParameter.connectionString) {
            throw new Error('Connection string is mandatory mandatory.');
        }

        /*
         * Establish connection
         */
        this.pg.connect(connectParameter.connectionString, function (err, client) {
            if (err || !client) {
                _this.logger.error('Connection failed', err);
                // Error
                deferred.reject(err || new Error('No client available.'));
            } else {
                // Success
                _this.dbClient = client;

                _this.logger.info('Database connection established');

                _this.deferredQuery = function (string, data) {
                    console.log('databaseCtrl.js: querying:', string, data);
                    var query = _this.q.defer();
                    //try {
                        _this.dbClient.query(string, data, function (err, result) {
                            if (err || !result) {
                                query.reject(err || new Error('unknown database error.'));
                            } else {
                                query.resolve(result);
                            }
                        });
                    //} catch (e) {
                    //    query.reject(e);
                    //}
                    return query.promise;
                };

                // Invoke callback if existent
                deferred.resolve();
            }
        });

        return deferred.promise;
    };

    /*
     * For testing!
     */
    DatabaseControl.prototype._customQuery = function (queryString, data) {
        this.logger.info('_customQuery');
        this.logger.info('queryString:', queryString);
        this.logger.info('data:', data);
        var deferred = this.q.defer();

        this.deferredQuery(queryString, data)
            .then(function (result) {
                deferred.resolve(result);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.login = function (data) {
        this.logger.info('login', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT id, email, password, isactive FROM gm_user WHERE password = $2 AND (email = $1 OR nickname = $1)',
                [data.login, data.password])
            .then(function (result) {
                deferred.resolve(result.rows[0]);
            })
            .fail(function (err) {
                deferred.reject(err);
            });
        return deferred.promise;
    };

    DatabaseControl.prototype.pushAction = function (data) {
        this.logger.info('insertAction', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT gm_actionstarted($1, $2, $3)',
                [data.typeId, data.userId, data.mac])
            .then(function (result) {
                deferred.resolve(result.rows[0].gm_actionstarted);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.endAction = function (data) {
        this.logger.info('endAction', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT gm_actionfinished((SELECT MAX(id) FROM gm_action WHERE userid = $1))',
                [data.userId])
            .then(function (result) {
                deferred.resolve({points: result.rows[0].gm_actionfinished});
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.endUploadedAction = function (data) {
        this.logger.info('endUploadedAction', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT gm_actionuploaded((SELECT actionid FROM gm_runningaction WHERE userid = $1))',
                [data.userId])
            .then(function (result) {
                deferred.resolve(true);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.pushGpsData = function (bulk) {
        var _this = this;
        this.logger.info('pushGpsData', bulk);
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT actionid FROM gm_runningaction WHERE userid = $1',
                [bulk[0].userId])
            .then(function (result) {
                if (result.rowCount < 1) {
                    var err = new Error('No running action found.');
                    err.code = 'P0001';
                    throw err;
                }
                var actionId = result.rows[0].actionid;

                var functions = [];
                for (var i = 0; i < bulk.length; i++) {
                    // Ersetzt gm_pushgpsdata
                    functions.push(
                        _this.deferredQuery(
                            'INSERT INTO gm_gpsdata(actionid, speed, timestamp, position, accuracy, providerid) ' +
                                'VALUES ($1, $2, $3, $4, $5, $6)',
                            [actionId, bulk[i].speed, bulk[i].timestamp, bulk[i].position, bulk[i].accuracy, bulk[i].providerId]
                        )
                    );
                }
                return _this.q.all(functions);
            })
            .then(function () {
                deferred.resolve(true);
            })
            .fail(function (error) {
                deferred.reject(error);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.pushBluetoothData = function (bulk) {
        var _this = this;
        this.logger.info('pushBluetoothData', bulk);
        var deferred = this.q.defer();

        this.deferredQuery('SELECT actionid FROM gm_runningaction WHERE userid = $1', [bulk[0].userId])
            .then(function (result) {
                if (result.rowCount < 1) {
                    var err = new Error('No running action found.');
                    err.code = 'P0001';
                    throw err;
                }
                var actionId = result.rows[0].actionid;

                var functions = [];
                for (var i = 0; i < bulk.length; i++) {
                    var entry = bulk[i];    // is mandatory to use i in closure!
                    for (var j = 0; j < entry.actorIds.length; j++) {
                        functions.push(
                            _this.deferredQuery('INSERT INTO gm_bluetoothsensordetection(actorid, timestamp, actionid) ' +
                                'VALUES((SELECT gm_addidentification($2, $4)), $3, $1)',
                                [actionId, entry.actorIds[j], entry.timestamps[j], entry.bluetoothClasses[j]])
                        )
                    }
                }

                return _this.q.all(functions);
            })
            .then(function () {
                deferred.resolve(true);
            })
            .fail(function (error) {
                deferred.reject(error);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.pushMotionData = function (data) {
        this.logger.info('pushMotionData', data);
        var _this = this;
        var deferred = this.q.defer();

        this.deferredQuery('SELECT actionid FROM gm_runningaction WHERE userid = $1', [data[0].userId])
            .then(function (result) {
                if (result.rowCount < 1) {
                    var err = new Error('No running action found.');
                    err.code = 'P0001';
                    throw err;
                }
                var actionId = result.rows[0].actionid;

                var functions = [];
                for (var i = 0; i < data.length; i++) {
                    functions.push(
                        _this.deferredQuery(
                            'INSERT INTO gm_motiondata(actionid, timestamp, x, y, z) ' +
                                'VALUES ($1, $2, $3, $4, $5)',
                            [actionId, data[i].timestamp , data[i].x, data[i].y, data[i].z]
                        )
                    );
                }

                return _this.q.all(functions);
            })
            .then(function () {
                deferred.resolve(true);
            })
            .fail(function (error) {
                deferred.reject(error);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.addWifiRouter = function (data) {
        this.logger.info('addWifi', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT gm_addwifirouterinstance($1, $2, $3, $4, $5)',
                [data.bssid, data.ssid, data.typeId, data.position, data.pointsperdetection])
            .then(function (result) {
                if (result.rows[0].gm_addwifirouterinstance) {
                    deferred.resolve(true);
                } else {
                    deferred.reject(new Error('Database error.'));
                }
            })
            .then(function () {
                deferred.resolve(true);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.pushWifiData = function (data) {
        this.logger.info('pushWifiData', data);

        var _this = this;
        var deferred = this.q.defer();

        var functions = [];
        for (var i = 0; i < data.length; i++) {
            functions.push(
                _this.deferredQuery(
                    'SELECT gm_pushwifidata($1, $2, $3, $4)',
                    [data[i].userId, data[i].wifirouterBSSIDs, data[i].wifirouterSSIDs, data[i].timestamp]
                )
            );
        }

        this.q.all(functions)
            .then(function (result) {
                deferred.resolve(true);
            })
            .fail(function (error) {
                deferred.reject(error);
            });

        return deferred.promise;
    };


    DatabaseControl.prototype.addBluetoothSensor = function (data) {
        this.logger.info('addBluetoothSensor', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT gm_addbluetoothsensorinstance($1, $2, $3, $4)',
                [data.bssid, data.typeId, data.position, data.pointsperdetection])
            .then(function (result) {
                if (result.rows[0].gm_addbluetoothsensorinstance) {
                    deferred.resolve(true);
                } else {
                    deferred.reject(new Error('Database error.'));
                }
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.pushBluetoothSensorData = function (bulk) {
        var _this = this;
        //this.logger.info('pushBluetoothSensorData', bulk);
        this.logger.info('pushBluetoothSensorData', bulk[bulk.length - 1].timestamps[0]);
        var deferred = this.q.defer();

        var functions = [];
        for (var i = 0; i < bulk.length; i++) {
            var entry = bulk[i];    // is mandatory to use i in closure!

            for (var j = 0; j < entry.actorIds.length; j++) {
                functions.push(
                    // Ersetzt PLPGSQL-Funktion: gm_pushbluetoothdata
                    _this.deferredQuery(
                        'INSERT INTO gm_bluetoothsensordetection(actorid, sensorid, timestamp, actionid) ' +
                            'VALUES((SELECT gm_addidentification($2, $4)), ' +
                            '(SELECT id FROM gm_bluetoothsensorinstance WHERE sensorid = $1 AND isactive = true), ' +
                            '$3, ' +
                            '(SELECT actionid FROM gm_runningaction WHERE identificationid = (SELECT gm_addidentification($2, $4))))',
                        [entry.bssid, entry.actorIds[j], entry.timestamps[j], entry.bluetoothClasses[j]]
                    )
                );
            }
        }

        this.q.all(functions)
            .then(function () {
                deferred.resolve(true);
            })
            .fail(function (error) {
                deferred.reject(error);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.getWifiRouterTypes = function () {
        this.logger.info('getWifiRouterTypes');
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT * FROM gm_wifiroutertype',
                [])
            .then(function (result) {
                deferred.resolve(result);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.getBluetoothSensorTypes = function () {
        this.logger.info('getBluetoothSensorTypes');
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT * FROM gm_bluetoothsensortype',
                [])
            .then(function (result) {
                deferred.resolve(result);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.register = function (data) {
        this.logger.info('register', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT gm_registeruser($1, $2, $3, $4)',
                [data.email, data.password, data.code, new Date()])
            .then(function (result) {
                deferred.resolve(result.rows[0].gm_registeruser);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.openRegister = function (data) {
        this.logger.info('openRegister', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT gm_registeruser_open($1, $2, $3, $4)',
                [data.name + new Date().getTime() + '@ma-gremo.de', data.name, data.password, new Date()])
            .then(function (result) {
                deferred.resolve(result.rows[0].gm_registeruser);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.activate = function (data) {
        var _this = this;

        this.logger.info('activate', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT gm_activateuser($1)',
                [data.code])
            .then(function (result) {
                console.log('databaseCtrl.js: ', result);
                if (result.rows[0].gm_activateuser) {
                    console.log('databaseCtrl.js: resolving');
                    deferred.resolve(true);
                } else {
                    console.log('databaseCtrl.js: rejecting');
                    deferred.reject(new Error('User not found!'));
                }
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };


    DatabaseControl.prototype.getLeaderboard = function (data) {
        this.logger.info('getLeaderboard', data);
        var deferred = this.q.defer();

        this.deferredQuery('SELECT rank, id, nickname, email, points FROM gm_user WHERE rank>0 ORDER BY rank ASC LIMIT $1',
                [data.size])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });
        return deferred.promise;
    };

    //TODO test
    DatabaseControl.prototype.getGroupLeaderboard = function (data) {
        this.logger.info('getGroupLeaderboard', data);
        var deferred = this.q.defer();

        this.deferredQuery('SELECT rank, id, name, usercount, points FROM gm_community WHERE rank>0 ORDER BY rank ASC LIMIT $1',
                [data.size])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });
        return deferred.promise;
    };

    DatabaseControl.prototype.getMessages = function (data) {
        this.logger.info('getMessages', data);
        var deferred = this.q.defer();

        this.deferredQuery('SELECT gm_message.*, gm_user.email AS sendermail, gm_user.nickname AS sendernickname ' +
                'FROM gm_message FULL JOIN gm_user ON gm_message.senderid = gm_user.id ' +
                'WHERE  gm_message.receiverid = $1 ORDER BY gm_message.id DESC LIMIT ' + data.size,
                [data.userId])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });
        return deferred.promise;
    };

    DatabaseControl.prototype.markMessageAsRead = function (data) {
        this.logger.info('markMessageAsRead', data);
        var deferred = this.q.defer();

        this.deferredQuery('UPDATE gm_message SET read = $3 WHERE id = $2 AND receiverid = $1',
                [data.userId, data.messageId, true])
            .then(function () {
                deferred.resolve(true);
            })
            .fail(function (err) {
                deferred.reject(err);
            });
        return deferred.promise;
    };

    DatabaseControl.prototype.addCommunity = function (data) {
        var _this = this;
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT gm_createcommunity($1, $2, $3, $4, $5)',
                //[4, 'myName', '', 15052, true])
                [data.typeId, data.name, data.description, data.founderId, data.requireconfirmation])
            .then(function (result) {
                // return new communities id
                deferred.resolve(result.rows[0].gm_createcommunity);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.joinCommunity = function (data) {
        this.logger.info('joinCommunity', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'select gm_joincommunity($1, $2)',
                [data.userId, data.communityId])
            .then(function (result) {
                console.log('databaseCtrl.js getting: ', result);
                deferred.resolve(result.rows[0].gm_joincommunity);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.leaveCommunity = function (data) {
        this.logger.info('leaveCommunity', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT gm_leavecommunity($1, $2)',
                [data.userId, data.communityId])
            .then(function () {
                deferred.resolve(true);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.acceptJoinRequest = function (data) {
        this.logger.info('acceptJoinRequest', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT gm_resolvejoinrequest($1, $2, true)',
                [data.userId, data.referenceId])
            .then(function () {
                deferred.resolve(true);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.rejectJoinRequest = function (data) {
        this.logger.info('acceptJoinRequest', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT gm_resolvejoinrequest($1, $2, false)',
                [data.userId, data.referenceId])
            .then(function () {
                deferred.resolve(true);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.getUserCommunities = function (data) {
        this.logger.info('getUserCommunities', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT gm_community.id, gm_community.name, gm_community_user.confirmed, gm_community.points FROM gm_community_user, gm_community WHERE gm_community_user.userid = $1 AND gm_community_user.communityid = gm_community.id',
                [data.userId])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.getWifiRouters = function (data) {
        this.logger.info('getWifiRouters', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT i.id, i.routerid, ST_ASTEXT(i.position) AS "position", i.isactive, i.pointsperdetection, i.locationupdates, r.ssid, r.typeid FROM gm_wifirouterinstance i, gm_wifirouter r WHERE r.id = i.routerid LIMIT ' + data.limit + ' OFFSET $1',
                [data.offset || 0])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };


    DatabaseControl.prototype.getActionList = function (data) {
        this.logger.info('getActionList', data);
        var deferred = this.q.defer();

        data.limit = data.limit || 'ALL';
        data.offset = data.offset || 0;
        this.deferredQuery(
                'SELECT * FROM gm_actionandtype WHERE userid = $1 AND time IS NOT NULL LIMIT ' + data.limit + ' OFFSET $2',
                [data.userId, data.offset])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    //TODO test
    DatabaseControl.prototype.getActionData = function (data) {
        this.logger.info('getActionData', data);
        var deferred = this.q.defer();

        this.deferredQuery('SELECT gm_action.id, ' +
                'gm_actiontype.name, ' +
                'gm_action.distance, ' +
                'gm_action.points, ' +
                'gm_action.starttimestamp, ' +
                'gm_action.endtimestamp, ' +
                'gm_action.inserttimestamp ' +
                'FROM gm_action, gm_actiontype ' +
                'WHERE gm_action.id = $1 ' +
                'AND gm_action.userid = $2 ' +
                'AND gm_action.typeid = gm_actiontype.id',
                [data.actionId, data.userId])
            .then(function (result) {
                if (result.rowCount > 0) {
                    result.rows[0].starttimestamp = result.rows[0].starttimestamp.getTime();
                    result.rows[0].endtimestamp = result.rows[0].endtimestamp.getTime();
                    result.rows[0].inserttimestamp = result.rows[0].inserttimestamp.getTime();
                    deferred.resolve(result.rows[0]);
                } else {
                    deferred.reject(new Error("No action found!"));
                }
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.getActionDataLine = function (data) {
        this.logger.info('getActionDataLine', data);
        var deferred = this.q.defer();

        this.deferredQuery('select st_astext(line) from gm_action WHERE id = $1 AND userid = $2',
                [data.actionId, data.userId])
            .then(function (result) {
                if (result.rowCount == 1) {
                    deferred.resolve(result.rows[0].st_astext);
                } else {
                    deferred.reject(new Error("No line found!"));
                }
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.getGPSDataForAction = function (data) {
        this.logger.info('getActionDataGPS', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT gm_action.userid, ' +
                    'gm_gpsdata.actionid, ' +
                    'gm_gpsdata."timestamp", ' +
                    'st_astext(gm_gpsdata."position") AS "position", ' +
                    'gm_gpsdata.speed, ' +
                    'gm_gpsdata.providerid, ' +
                    'constant.type::text AS type ' +
                'FROM gm_action, ' +
                    'gm_gpsdata, ' +
                    '(SELECT \'gps\' AS type) constant ' +
                'WHERE gm_action.id = gm_gpsdata.actionid ' +
                    'AND gm_action.id = $1 ' +
                    'AND gm_action.userid = $2 ' +
                'ORDER BY gm_gpsdata."timestamp";',
                [data.actionId, data.userId])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.getWifiRouterDetectionForAction = function (data) {
        this.logger.info('getUserAndWifiRouterDetection', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT DISTINCT ON (gm_wifirouterdetection."timestamp") ' +
                    'gm_action.userid, ' +
                    'gm_wifirouterdetection.actionid, ' +
                    'gm_wifirouterdetection."timestamp", ' +
                    'st_astext(gm_wifirouterinstance."position") AS "position", ' +
                    'gm_wifirouter.ssid, ' +
                    'constant.type::text AS type ' +
                'FROM gm_action, ' +
                    'gm_wifirouterdetection, ' +
                    'gm_wifirouterinstance, ' +
                    'gm_wifirouter, ' +
                    '(SELECT \'wifi\' AS type) constant ' +
                'WHERE gm_action.id = gm_wifirouterdetection.actionid ' +
                    'AND gm_wifirouterdetection.routerid = gm_wifirouterinstance.id ' +
                    'AND gm_wifirouterinstance.routerid = gm_wifirouter.id ' +
                    'AND gm_action.userid = $2 ' +
                    'AND gm_action.id = $1 ' +
                'ORDER BY gm_wifirouterdetection."timestamp";',
                [data.actionId, data.userId])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.getBluetoothSensorDetectionForAction = function (data) {
        this.logger.info('getBluetoothSensorDetectionForAction', data);
        var deferred = this.q.defer();

        this.deferredQuery('SELECT gm_action.userid, ' +
                'gm_action.id AS actionid, ' +
                'gm_bluetoothsensordetection."timestamp", ' +
                'st_astext(gm_bluetoothsensorinstance."position") AS "position", ' +
                'constant.type::text AS type ' +
                'FROM gm_action, ' +
                'gm_bluetoothsensordetection, ' +
                'gm_bluetoothsensorinstance, ' +
                '(SELECT \'bluetooth\' AS type) constant ' +
                'WHERE gm_action.id = gm_bluetoothsensordetection.actionid ' +
                'AND gm_bluetoothsensordetection.sensorid = gm_bluetoothsensorinstance.id ' +
                'AND gm_action.id = $1 ' +
                'AND gm_action.userid = $2 ' +
                'ORDER BY gm_bluetoothsensordetection."timestamp";',
                [data.actionId, data.userId])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.getMotionDataForAction = function (data) {
        this.logger.info('getMotionDataForAction', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT gm_action.userid, ' +
                    'gm_action.id AS actionid, ' +
                    'gm_motiondata."timestamp", ' +
                    'gm_motiondata.x, gm_motiondata.y, gm_motiondata.z, ' +
                    'st_astext(gm_motiondata."position") AS "position", ' +
                    'constant.type::text AS type ' +
                'FROM gm_action, ' +
                    'gm_motiondata, ' +
                    '(SELECT \'motion\' AS type) constant ' +
                'WHERE gm_action.id = gm_motiondata.actionid ' +
                    'AND gm_action.id = $1 ' +
                    'AND gm_action.userid = $2 ' +
                'ORDER BY gm_motiondata."timestamp";',
                [data.actionId, data.userId])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.getFullUser = function (data) {
        this.logger.info('getFullUser', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'select gm_user.id, ' +
                    'gm_user.email, ' +
                    'gm_user.firstname, ' +
                    'gm_user.lastname, ' +
                    'gm_user.nickname, ' +
                    'gm_user.password, ' +
                    'gm_user.membersince, ' +
                    'gm_user.points, ' +
                    'gm_user.birthyear, ' +
                    'gm_user.rank, ' +
                    'gm_user.pointsspent, ' +
                    'gm_user.notified, ' +        //FIXME: TEMP
                    'gm_fuelprofile.avgconsumption as consumption, ' +
                    'gm_fueltype.name as consumptionType, ' +
                    'gm_address.zipcode, ' +
                    'gm_address.postaddress ' +
                    'from gm_user, gm_fuelprofile, gm_fueltype, gm_address ' +
                    'where gm_user.id = $1 ' +
                    'and gm_user.id = gm_fuelprofile.userid ' +
                    'and gm_fuelprofile.fueltypeid = gm_fueltype.id ' +
                    'and gm_user.id = gm_address.userid',
                [data.userId])
            .then(function (result) {
                // fixme: do this more elegantly
                result.rows[0].consumption = Number(result.rows[0].consumption);
                deferred.resolve(result.rows[0]);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.getUserFriends = function (data) {
        this.logger.info('getUserFriends', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT gm_user.id, gm_user.email, gm_user.nickname, gm_friendship.confirmed ' +
                    'FROM gm_user, gm_friendship ' +
                    'WHERE gm_friendship.confirmed = $2 ' +
                    'AND ((gm_friendship.userid1 = $1 AND gm_friendship.userid2 = gm_user.id) ' +
                    'OR (gm_friendship.userid2 = $1 AND gm_friendship.userid1 = gm_user.id))',
                [data.userId, true])
            .then(function (result) {
                console.log('databaseCtrl.js: okay', result);
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                console.log('databaseCtrl.js: err', err);
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.getUserFriend = function (data) {
        this.logger.info('getUserFriend', data);
        var deferred = this.q.defer();

        // TODO: resolve data only if friendship!
        if (isNaN(data.userquery)) {
            this.deferredQuery(
                    'SELECT gm_user.id, ' +
                        'gm_user.email, ' +
                        'gm_user.nickname, ' +
                        'gm_user.membersince, ' +
                        'gm_user.points, ' +
                        'gm_user.rank FROM gm_user WHERE email = $1 OR nickname = $1',
                    [data.userquery])
                .then(function (result) {
                    if (result.rowCount == 1) {
                        deferred.resolve(result.rows[0]);
                    } else {
                        deferred.reject(new Error('User not found.'))
                    }
                })
                .fail(function (err) {
                    deferred.reject(err);
                });
        } else {
            this.deferredQuery(
                    'SELECT gm_user.id, ' +
                        'gm_user.email, ' +
                        'gm_user.nickname, ' +
                        'gm_user.membersince, ' +
                        'gm_user.points, ' +
                        'gm_user.rank FROM gm_user WHERE id = $1',
                    [Number(data.userquery)])
                .then(function (result) {
                    if (result.rowCount == 1) {
                        deferred.resolve(result.rows[0]);
                    } else {
                        deferred.reject(new Error('User not found.'))
                    }
                })
                .fail(function (err) {
                    deferred.reject(err);
                });
        }


        return deferred.promise;
    };

    DatabaseControl.prototype.getUserPoints = function (data) {
        this.logger.info('getUserPoints', data);
        var deferred = this.q.defer();

        this.deferredQuery('SELECT * FROM gm_userstats WHERE userid = $1',
                [data.userId])
            .then(function (result) {
                deferred.resolve(result.rows[0]);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.getFueltypes = function () {
        this.logger.info('getFueltypes');
        var deferred = this.q.defer();

        this.deferredQuery('SELECT * FROM gm_fueltype', [])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.saveUser = function (data) {
        var _this = this;

        this.logger.info('saveUser', data);
        var deferred = this.q.defer();

        var changedSomething = false;

        function saveNickname() {
            var deferred = _this.q.defer();
            if (data.nickname) {
                console.log('databaseCtrl.js: saving nickname', data.nickname);
                changedSomething = true;
                return _this.deferredQuery(
                    'UPDATE gm_user SET nickname = $1 WHERE id = $2',
                    [data.nickname, data.userId]);
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        }

        function saveFirstname() {
            var deferred = _this.q.defer();
            if (data.firstname) {
                console.log('databaseCtrl.js: saving firstname', data.firstname);
                changedSomething = true;
                return _this.deferredQuery(
                    'UPDATE gm_user SET firstname = $1 WHERE id = $2',
                    [data.firstname, data.userId]);
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        }

        function saveLastname() {
            var deferred = _this.q.defer();
            if (data.lastname) {
                console.log('databaseCtrl.js: saving lastname', data.lastname);
                changedSomething = true;
                return _this.deferredQuery(
                    'UPDATE gm_user SET lastname = $1 WHERE id = $2',
                    [data.lastname, data.userId]);
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        }

        function saveBirthYear() {
            var deferred = _this.q.defer();
            if (data.birthyear) {
                console.log('databaseCtrl.js: saving birthyear', data.birthyear);
                changedSomething = true;
                return _this.deferredQuery(
                    'UPDATE gm_user SET birthyear = $1 WHERE id = $2',
                    [data.birthyear, data.userId]);
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        }

        function saveConsumptionType() {
            var deferred = _this.q.defer();
            if (data.consumptiontype) {
                console.log('databaseCtrl.js: saving consumptiontype', data.consumptiontype);
                changedSomething = true;
                return _this.deferredQuery(
                    'UPDATE gm_fuelprofile SET fueltypeid = (SELECT id FROM gm_fueltype WHERE name = $1) WHERE userid = $2',
                    [data.consumptiontype, data.userId]);
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        }

        function saveConsumption() {
            var deferred = _this.q.defer();
            if (data.consumption) {
                console.log('databaseCtrl.js: saving consumption', data.consumption);
                changedSomething = true;
                return _this.deferredQuery(
                    'UPDATE gm_fuelprofile SET avgconsumption = $1 WHERE userid = $2',
                    [data.consumption, data.userId]);
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        }

        function saveZipCode() {
            var deferred = _this.q.defer();
            if (data.zipcode) {
                console.log('databaseCtrl.js: saving zipcode', data.zipcode);
                changedSomething = true;
                return _this.deferredQuery(
                    'UPDATE gm_address SET zipcode = $1 WHERE userid = $2',
                    [data.zipcode, data.userId]);
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        }

        function savePostAddress() {
            var deferred = _this.q.defer();
            if (data.postaddress) {
                console.log('databaseCtrl.js: saving postaddress', data.postaddress);
                changedSomething = true;
                return _this.deferredQuery(
                    'UPDATE gm_address SET postaddress = $1 WHERE userid = $2',
                    [data.postaddress, data.userId]);
            } else {
                deferred.resolve();
            }
            return deferred.promise;
        }

        saveNickname()
            .then(saveFirstname)
            .then(saveLastname)
            .then(saveBirthYear)
            .then(saveZipCode)
            .then(savePostAddress)
            .then(saveConsumptionType)
            .then(saveConsumption)
            .then(function () {
                if (!changedSomething) {
                    deferred.reject(new Error('No changes.'))
                } else {
                    deferred.resolve(true);
                }
            })
            .fail(function (err) {
                console.log('databaseCtrl.js: failed ', err);
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.changePassword = function (data) {
        var _this = this;

        this.logger.info('changePassword', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT password FROM gm_user WHERE id = $1',
                [data.userId])
            .then(function (result) {
                if (result.rows[0].password != data.oldPass) {
                    deferred.reject(new Error('Old password incorrect.'));
                } else {
                    return _this.deferredQuery(
                        'UPDATE gm_user SET password = $1 WHERE id = $2',
                        [data.pw1, parseInt(data.userId)]);
                }
            })
            .then(function () {
                deferred.resolve(true);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.resetPassword = function (data) {
        this.logger.info('resetPassword', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'INSERT INTO gm_pendingpasswordreset(userid, code, timestamp, password) VALUES ((SELECT id FROM gm_user WHERE email = $1), $2, $3, $4) RETURNING id',
                [data.email, data.code, new Date(), data.cryptPassword])
            .then(function (result) {
                deferred.resolve(result.rows[0].id);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.confirmPasswordReset = function (data) {
        this.logger.info('confirmPasswordReset', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'SELECT gm_confirmpasswordreset($1)',
                [data.code])
            .then(function (result) {
                deferred.resolve(result.rows[0].gm_confirmpasswordreset);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.getAllUsers = function (data) {
        var deferred = this.q.defer();
        this.logger.info('getAllUsers', data);

        this.deferredQuery(
                'SELECT * FROM gm_user LIMIT ' + data.limit + ' OFFSET $1',
                [data.offset || 0])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.addCommunityType = function (data) {
        this.logger.info('addCommunityType', data);
        var deferred = this.q.defer();

        this.deferredQuery(
                'INSERT INTO gm_communitytype(name, description) VALUES($1, $2) RETURNING *',
                [data.name, data.description])
            .then(function (result) {
                deferred.resolve(result.rows[0]);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.getCommunityTypes = function (data) {
        var deferred = this.q.defer();
        this.logger.info('getCommunityTypes', data);

        this.deferredQuery(
                'SELECT * FROM gm_communityType LIMIT ' + data.limit + ' OFFSET $1',
                [data.offset || 0])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.getAllCommunities = function (data) {
        var deferred = this.q.defer();
        this.logger.info('getAllCommunities', data);

        this.deferredQuery(
                'SELECT * FROM gm_community LIMIT ' + data.limit + ' OFFSET $1',
                [data.offset || 0])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.getCommunityList = function (data) {
        var deferred = this.q.defer();
        this.logger.info('getCommunityList', data);

        this.deferredQuery(
                'SELECT id, name FROM gm_community WHERE lower(name) LIKE $1 LIMIT $2',
                ['%' + data.pattern + '%', data.limit + 1])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.getUserList = function (data) {
        var deferred = this.q.defer();
        this.logger.info('getUserList', data);

        this.deferredQuery(
                'SELECT id, nickname, email FROM gm_user WHERE (lower(nickname) LIKE $1 OR lower(email) LIKE $1) LIMIT $2',
                ['%' + data.pattern + '%', data.limit + 1])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.getCommunity = function (data) {
        var deferred = this.q.defer();
        this.logger.info('getCommunity', data);

        this.deferredQuery(
                'SELECT gm_community.*, ' +
                    'gm_user.id as founderid,' +
                    'gm_user.email as founderemail, ' +
                    'gm_user.nickname as foundernickname ' +
                    'FROM gm_community, gm_user ' +
                    'WHERE gm_community.id = $1 ' +
                    'AND gm_community.founderid = gm_user.id',
                [data.communityId])
            .then(function (result) {
                deferred.resolve(result.rows[0]);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    // TODO test
    DatabaseControl.prototype.getCommunityMembers = function (data) {
        var deferred = this.q.defer();
        this.logger.info('getCommunityMembers', data);

        this.deferredQuery(
                'SELECT gm_user.id, ' +
                    'gm_user.nickname, ' +
                    'gm_user.email ' +
                    'FROM gm_user, gm_community_user ' +
                    'WHERE gm_community_user.communityid = $1 ' +
                    'AND gm_community_user.userid = gm_user.id ' +
                    'AND gm_community_user.confirmed = true',
                [data.communityId])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.calculateRanks = function () {
        var deferred = this.q.defer();
        this.logger.info('calculateRanks');

        this.deferredQuery(
                'SELECT gm_calculateranks()',
                [])
            .then(function (result) {
                deferred.resolve(result.rows[0].gm_calculateranks);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    //TODO test
    DatabaseControl.prototype.pushLockedZone = function (data) {
        var deferred = this.q.defer();
        this.logger.info('pushLockedZone');

        this.deferredQuery(
                'INSERT INTO gm_lockedzone(userid, name, geometry) VALUES($1, $2, $3)',
                [data.userId, data.name, data.geometry])
            .then(function () {
                deferred.resolve(true);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    //TODO test
    DatabaseControl.prototype.getLockedZones = function (data) {
        var deferred = this.q.defer();
        this.logger.info('getLockedZones', data);

        this.deferredQuery(
                'SELECT name, ST_ASTEXT(geometry) AS geometry FROM gm_lockedzone WHERE userid = $1',
                [data.userId])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    //TODO test
    DatabaseControl.prototype.deleteLockedZone = function (data) {
        var deferred = this.q.defer();
        this.logger.info('deleteLockedZone');

        this.deferredQuery(
                'DELETE FROM gm_lockedzone WHERE userid = $1 AND name = $2',
                [data.userId, data.name])
            .then(function () {
                deferred.resolve(true);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    //TODO test
    DatabaseControl.prototype.alterLockedZone = function (data) {
        var deferred = this.q.defer();
        this.logger.info('alterLockedZone');

        this.deferredQuery(
                'UPDATE gm_lockedzone SET geometry = $3 WHERE userid = $1 AND name = $2',
                [data.userId, data.name, data.geometry])
            .then(function () {
                deferred.resolve(true);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };


    //TODO test
    DatabaseControl.prototype.deleteData = function (data) {
        var deferred = this.q.defer();
        this.logger.info('deleteData', data);

        this.deferredQuery(
                'DELETE FROM gm_action WHERE id = $1 AND userid = $2',
                [data.id, data.userId])
            .then(function () {
                deferred.resolve(true);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    //TODO test
    DatabaseControl.prototype.anonymizeData = function (data) {
        var deferred = this.q.defer();
        this.logger.info('anonymizeData', data);

        this.deferredQuery(
                'SELECT gm_anonymizeaction($1, $2)',
                [data.userId, data.id])
            .then(function () {
                deferred.resolve(true);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    //TODO test
    DatabaseControl.prototype.deleteAccount = function (data) {
        var deferred = this.q.defer();
        this.logger.info('deleteAccount', data);

        this.deferredQuery(
                'SELECT gm_deleteaccount($1, $2)',
                [data.userId, data.deleteData])
            .then(function () {
                deferred.resolve(true);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    //TODO test
    DatabaseControl.prototype.makeFriendRequest = function (data) {
        var deferred = this.q.defer();
        this.logger.info('makeFriendRequest', data);

        this.deferredQuery(
                'SELECT gm_friendrequest($1, $2)',
                [data.userId, data.friendId])
            .then(function () {
                deferred.resolve(true);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    //TODO test
    DatabaseControl.prototype.sendMessage = function (data) {
        var deferred = this.q.defer();
        this.logger.info('sendMessage', data);

        this.deferredQuery(
                'INSERT INTO gm_message(typeid, subject, text, senderid, receiverid, sendername) VALUES ($1, $2, $3, $4, $5, $6)',
                [
                    2,
                    'Private Nachricht von <a href="/user/' + data.userId + '">' + data.userName + '</a>',
                    data.message,
                    data.userId,
                    data.to,
                    data.userName])
            .then(function () {
                deferred.resolve(true);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    //TODO test
    DatabaseControl.prototype.deleteMessage = function (data) {
        var deferred = this.q.defer();
        this.logger.info('deleteMessage', data);

        this.deferredQuery(
                'DELETE FROM gm_message WHERE receiverid = $1 AND id = $2',
                [data.userId, data.messageId])
            .then(function () {
                deferred.resolve(true);
            })
            .fail(function (err) {
                console.log('databaseCtrl.js: ', err);
                deferred.reject(err);
            });

        return deferred.promise;
    };

    //TODO test
    DatabaseControl.prototype.insertSweepstakeCredentials = function (data) {
        var deferred = this.q.defer();
        this.logger.info('insertSweepstakeCredentials', data);

        this.deferredQuery(
                'INSERT INTO gm_sweepstake(email,name,address) VALUES($1, $2, $3)',
                [data.email, data.name, data.postcode + ', ' + data.address])
            .then(function () {
                deferred.resolve(true);
            })
            .fail(function (err) {
                console.log('databaseCtrl.js: ', err);
                deferred.reject(err);
            });

        return deferred.promise;
    };

    //TODO test
    DatabaseControl.prototype.confirmNotification = function (data) {
        var deferred = this.q.defer();
        this.logger.info('confirmNotification', data);

        this.deferredQuery(
                'UPDATE gm_user SET notified = true WHERE id = $1',
                [data.userId])
            .then(function () {
                deferred.resolve(true);
            })
            .fail(function (err) {
                console.log('databaseCtrl.js: ', err);
                deferred.reject(err);
            });

        return deferred.promise;
    };


    /*
     * Admin
     */

    //TODO test
    DatabaseControl.prototype.getInductionLoops = function (data) {
        var deferred = this.q.defer();
        this.logger.info('getInductionLoops', data);

        this.deferredQuery(
                'SELECT gm_inductionloop.id, ST_ASTEXT(gm_inductionloop.position) AS "position", gm_inductionloop.name, gm_inductionloop.typeid FROM gm_inductionloop', [])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    //TODO test
    DatabaseControl.prototype.getInductionLoopTypes = function (data) {
        var deferred = this.q.defer();
        this.logger.info('getInductionLoopTypes', data);

        this.deferredQuery(
                'SELECT * FROM gm_inductionlooptype', [])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    //TODO test
    DatabaseControl.prototype.getInductionLoopGroups = function (data) {
        var deferred = this.q.defer();
        this.logger.info('getInductionLoopGroups', data);

        this.deferredQuery(
                'SELECT * FROM gm_inductionloopgroup', [])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    //TODO TMP
    DatabaseControl.prototype.getMotionData = function (data) {
        var deferred = this.q.defer();
        this.logger.info('getMotionData', data);

        this.deferredQuery(
                'select id, actionid, timestamp, x, y, z, threshold, credibility, ST_ASTEXT(position) as position from (' +
                    'select *, (x^2+y^2+z^2)/(9.81^2) as threshold ' +
                    'from gm_motiondata ' +
                    'where timestamp between \'2013-08-26\' and \'2013-08-31\' ' +
                    'and position is not null' +
                ') as sub ' +
                'where threshold > $1', [data.threshold])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    //TODO test
    DatabaseControl.prototype.createInductionLoop = function (data) {
        var deferred = this.q.defer();
        this.logger.info('createInductionLoop', data);

        this.deferredQuery(
                'SELECT gm_addinductionloop($1, $2, $3, $4)',
                [data.typeId, data.name, 'POINT(' + data.lng + ' ' + data.lat + ')', data.groupId])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    //TODO test
    DatabaseControl.prototype.getBluetoothSensors = function (data) {
        var deferred = this.q.defer();
        this.logger.info('getBluetoothSensors', data);

        this.deferredQuery(
                'SELECT id, sensorid, ST_ASTEXT(position) AS "position", isactive, pointsperdetection FROM gm_bluetoothsensorinstance',
                [])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    //TODO test
    DatabaseControl.prototype.pushInductionLoopData = function (data) {
        var deferred = this.q.defer();
        this.logger.info('pushInductionLoopData', data);

        var values = [];
        for (var i = 0; i < data.length; i++) {
            values.push(
                '(' + [
                    data[i].inductionLoopId,
                    '\'' + [data[i].timestamp.getFullYear(), data[i].timestamp.getMonth() + 1, data[i].timestamp.getDate()].join('-') + ' ' + data[i].timestamp.getHours() + ':' + data[i].timestamp.getMinutes() + '\'::TIMESTAMP',
                    data[i].count
                ].join(',')
                    + ')');
        }

        console.log('databaseCtrl.js: inserting', values.join(','));
        this.deferredQuery(
                'INSERT INTO gm_inductionloopdata(inductionloopid, timestamp, count) VALUES ' + values.join(','),
                [])
            .then(function (result) {
                deferred.resolve(result.rows);
            })
            .fail(function (err) {
                deferred.reject(err);
            });

        return deferred.promise;
    };

    //TODO test
    DatabaseControl.prototype.calculateBluetoothRatio = function (data) {
        var deferred = this.q.defer();
        this.logger.info('calculateBluetoothRatio', data);

        this.deferredQuery(
                'SELECT * FROM gm_calculatebluetoothratio($1, $2, $3)',
                [
                    data.inductionloopId,
                    this._.map(data.startTimestamps, function (ms) {
                        return new Date(ms);
                    }),
                    this._.map(data.endTimestamps, function (ms) {
                        return new Date(ms);
                    })
                ])
            .then(function (result) {
                console.log('databaseCtrl.js: RESULT IS:', result.rows[0]);
                deferred.resolve(result.rows[0]);
            })
            .fail(function (err) {
                console.log('databaseCtrl.js: ', err);
                deferred.reject(err);
            });

        return deferred.promise;
    };

    //TODO test
    DatabaseControl.prototype.loadActions = function (data) {
        var _this = this;
        var deferred = this.q.defer();
        this.logger.info('loadActions', data);

        var allResults = [];
        var functions = [];
        for (var i = 0; i < data.timeframeStartArray.length; i++) {
            // Ersetzt gm_pushgpsdata
            functions.push(
                this.deferredQuery(
                        'SELECT id, ' +
                            'typeid, ' +
                            'userid, ' +
                            'distance, ' +
                            'starttimestamp,' +
                            ' endtimestamp,' +
                            ' inserttimestamp, ' +
                            'points, ' +
                            'ST_ASTEXT(line) AS line ' +
                        'FROM gm_action ' +
                        'WHERE starttimestamp BETWEEN $1 AND $2',
                        //'SELECT id, typeid, userid, distance, starttimestamp, endtimestamp, inserttimestamp, points, ST_ASTEXT(line) AS line FROM gm_action WHERE id IN (10153, 10201, 10220, 10347, 10439, 10483, 10488)',
                        [new Date(data.timeframeStartArray[i]), new Date(data.timeframeEndArray[i])]
                        //[]
                        )
                    .then(function (result) {
                        console.log('databaseCtrl.js: ', result);
                        allResults = allResults.concat(result.rows);
                    })
            );
        }

        this.q.all(functions)
            .then(function () {
                deferred.resolve(allResults);
            })
            .fail(function (err) {
                console.log('databaseCtrl.js: ', err);
                deferred.reject(err);
            });

        return deferred.promise;
    };         //TODO test

    DatabaseControl.prototype.calculateBluetoothTracks = function (data) {
        var _this = this;
        var deferred = this.q.defer();
        this.logger.info('calculateBluetoothTracks', data);

        this.deferredQuery(
                'SELECT * FROM gm_calculatebluetoothtracks_bike($1, $2, $3) ORDER BY partnerinstanceid, self_start',
                [
                    data.bluetoothSensorId,
                    this._.map(data.startTimestamps, function (ms) {
                        return new Date(ms);
                    }),
                    this._.map(data.endTimestamps, function (ms) {
                        return new Date(ms);
                    })
                ])
            .then(function (result) {
                deferred.resolve(_this._.map(result.rows, function (row) {
                    row.self_start = row.self_start.getTime();
                    row.self_end = row.self_end.getTime();
                    row.partner_start = row.partner_start.getTime();
                    row.partner_end = row.partner_end.getTime();
                    return row;
                }));
            })
            .fail(function (err) {
                console.log('databaseCtrl.js: ', err);
                deferred.reject(err);
            });

        return deferred.promise;
    };

    DatabaseControl.prototype.pushNewRandomIdentificationHashPart = function () {
        var deferred = this.q.defer();
        this.deferredQuery('UPDATE gm_random SET value = $1 WHERE id = 1',
                [parseInt(Math.random() * 1000000000)])
            .then(function () {
                deferred.resolve();
            })
            .fail(function (err) {
                console.log('databaseCtrl.js: ', err);
                deferred.reject(err);
            });

        return deferred.promise;
    };

    /**
     * Disconnect
     */
    DatabaseControl.prototype.disconnect = function () {
        var deferred = this.q.defer();
        if (this.dbClient) {
            try {
                this.dbClient.end();
                this.dbClient = undefined;
                this.logger.info('Database connection closed.');
                deferred.resolve(true);
            } catch (e) {
                deferred.reject(e);
            }
        } else {
            deferred.resolve(false);
        }
        return deferred.promise;
    };

    /*
     * Expose exports
     */
    return DatabaseControl;
})();