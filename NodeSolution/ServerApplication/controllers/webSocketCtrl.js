/**
 * User: DennisHoeting
 * Date: 09.04.13
 * Time: 21:43
 *
 * Module for web socket connection
 */
module.exports.WebSocketCtrl = (function () {
    function WebSocketCtrl(configs) {
        this.http = configs.http;
        this.socketio = configs.socketIO;
        this._ = configs.underscore;
        this.logger = configs.logger;
        this.q = configs.q;
        this.webSocketHandler = configs.webSocketHandler;

        // Number of connected clients
        this.clientCount = 0;

        /*
         * Web socket instance
         */
        this.webSocket = undefined;

        /*
         * Clients
         */
        this.clients = {};

        /*
         * Configurations
         */
        this.handlers = {};
        this.handlers['login'] = this.webSocketHandler.login;
        this.handlers['register'] = this.webSocketHandler.register;
        this.handlers['openRegister'] = this.webSocketHandler.openRegister;
        this.handlers['getFullUser'] = this.webSocketHandler.getFullUser;
        this.handlers['getUserFriends'] = this.webSocketHandler.getUserFriends;
        this.handlers['getUserFriend'] = this.webSocketHandler.getUserFriend;
        this.handlers['getFueltypes'] = this.webSocketHandler.getFueltypes;
        this.handlers['activate'] = this.webSocketHandler.activate;
        this.handlers['saveUser'] = this.webSocketHandler.saveUser;
        this.handlers['changePassword'] = this.webSocketHandler.changePassword;
        this.handlers['resetPassword'] = this.webSocketHandler.resetPassword;
        this.handlers['confirmPasswordReset'] = this.webSocketHandler.confirmPasswordReset;
        this.handlers['addCommunity'] = this.webSocketHandler.addCommunity;
        this.handlers['joinCommunity'] = this.webSocketHandler.joinCommunity;
        this.handlers['leaveCommunity'] = this.webSocketHandler.leaveCommunity;
        this.handlers['acceptJoinRequest'] = this.webSocketHandler.acceptJoinRequest;
        this.handlers['rejectJoinRequest'] = this.webSocketHandler.rejectJoinRequest;
        this.handlers['getUserCommunities'] = this.webSocketHandler.getUserCommunities;
        this.handlers['getCommunityList'] = this.webSocketHandler.getCommunityList;
        this.handlers['getUserList'] = this.webSocketHandler.getUserList;
        this.handlers['getCommunity'] = this.webSocketHandler.getCommunity;
        this.handlers['getLeaderboard'] = this.webSocketHandler.getLeaderboard;
        this.handlers['getGroupLeaderboard'] = this.webSocketHandler.getGroupLeaderboard;
        this.handlers['getMessages'] = this.webSocketHandler.getMessages;
        this.handlers['markMessageAsRead'] = this.webSocketHandler.markMessageAsRead;
        this.handlers['getActionList'] = this.webSocketHandler.getActionList;
        this.handlers['getActionData'] = this.webSocketHandler.getActionData;
        this.handlers['getCommunityTypes'] = this.webSocketHandler.getCommunityTypes;
        this.handlers['pushLockedZone'] = this.webSocketHandler.pushLockedZone;
        this.handlers['getLockedZones'] = this.webSocketHandler.getLockedZones;
        this.handlers['deleteLockedZone'] = this.webSocketHandler.deleteLockedZone;
        this.handlers['alterLockedZone'] = this.webSocketHandler.alterLockedZone;
        this.handlers['deleteData'] = this.webSocketHandler.deleteData;
        this.handlers['anonymizeData'] = this.webSocketHandler.anonymizeData;
        this.handlers['makeFriendRequest'] = this.webSocketHandler.makeFriendRequest;
        this.handlers['sendMessage'] = this.webSocketHandler.sendMessage;
        this.handlers['uploadTrack'] = this.webSocketHandler.uploadTrack;
        this.handlers['deleteMessage'] = this.webSocketHandler.deleteMessage;
        this.handlers['deleteAccount'] = this.webSocketHandler.deleteAccount;
        this.handlers['donateTrack'] = this.webSocketHandler.donateTrack;
        this.handlers['sendSweepstakeCredentials'] = this.webSocketHandler.sendSweepstakeCredentials;
        this.handlers['confirmNotification'] = this.webSocketHandler.confirmNotification;

        /*
         * Admin Configurations
         */
        this.handlers['getInductionLoops'] = this.webSocketHandler.getInductionLoops;
        this.handlers['getInductionLoopTypes'] = this.webSocketHandler.getInductionLoopTypes;
        this.handlers['getInductionLoopGroups'] = this.webSocketHandler.getInductionLoopGroups;
        this.handlers['createInductionLoop'] = this.webSocketHandler.createInductionLoop;
        this.handlers['getBluetoothSensors'] = this.webSocketHandler.getBluetoothSensors;
        this.handlers['getWifiRouters'] = this.webSocketHandler.getWifiRouters;
        this.handlers['uploadCSV'] = this.webSocketHandler.uploadCSV;
        this.handlers['calculateBluetoothRatio'] = this.webSocketHandler.calculateBluetoothRatio;
        this.handlers['loadActions'] = this.webSocketHandler.loadActions;
        this.handlers['getAllUsers'] = this.webSocketHandler.getAllUsers;
        this.handlers['getAllCommunities'] = this.webSocketHandler.getAllCommunities;
        this.handlers['calculateBluetoothTracks'] = this.webSocketHandler.calculateBluetoothTracks;
        this.handlers['getMotionData'] = this.webSocketHandler.getMotionData;
    }

    /**
     * Start web socket with appropriate start parameters
     * @param startParameter Possible properties
     * - port, Port to listen to
     * - logLevel, for socket.io
     * - onConnect, Callback to be invoked when an connection was established
     * - onStart, Callback to be invoked when web socket is started
     */
    WebSocketCtrl.prototype.start = function (startParameter) {
        var _this = this;

        var deferred = this.q.defer();
        try {
            //webSocketServer = this.http.createServer(function (req, res) {
            //    res.end(String(new Date().getTime()));
            //});
            //webSocketServer.listen(startParameter.port);
            //webSocket = _this.socketio.listen(webSocketServer);
            this.webSocket = _this.socketio.listen(startParameter.port);
            this.webSocket.set('log level', 0);

            console.log('webSocketCtrl.js: starting ws', startParameter.port);

            this.webSocket.sockets.on('connection', function (socket) {
                console.log('webSocketCtrl.js: connected client to ws');
                _this.clients[socket.id] = socket;
                _this.clientCount++;

                socket.on('disconnect', function () {
                    delete _this.clients[socket.id];
                    _this.clientCount--;
                });

                _this._.each(_this.handlers, function (value, key) {
                    console.log('this.webSocketCtrl.js: ', value, key);
                    socket.on(key, value);
                });

                typeof startParameter.onConnect === 'function' && startParameter.onConnect(socket);

                _this.logger.info('Web socket connection established. I am server.');
            });

            module.exports.emit = this.webSocket.sockets.emit;

            _this.logger.info('Web socket connection ready.');

            deferred.resolve();
        } catch (e) {
            deferred.reject(e);
        }

        return deferred.promise;
    };

    WebSocketCtrl.prototype.stop = function () {
        var _this = this;

        var deferred = this.q.defer();
        this.webSocket.server.close(function () {
            console.log('webSocketCtrl.js: ws closed');
            deferred.resolve();
        });
        return deferred.promise;
    };

    return WebSocketCtrl;
})();


