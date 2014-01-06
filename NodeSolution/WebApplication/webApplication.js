/**
 * User: DennisHoeting
 * Date: 08.05.13
 * Time: 11:05
 *
 * $
 */


var http = require('http');
var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var socketio = require('socket.io');
var socketioClient = require('socket.io-client');
var piler = require('piler');
var logger = require('log4js').getLogger('webApplication.js');
logger.setLevel('INFO');
var q = require('q');

var smtpCtrl = new (require('./controllers/smtpCtrl').SMTPController)({
    emailjs: require('emailjs'),
    q: q,
    logger: logger
});
var cryptoCtrl = new (require('./controllers/cryptoCtrl').CryptoController)({
    crypto: require('crypto')
});

var RouteHandler = require('./handlers/routeHdl').RouteHandler;
var APIHandler = require('./handlers/apiHdl').APIHandler;
var WebSocketHandler = require('./handlers/webSocketHdl').WebSocketHandler;

module.exports.WebApplication = (function () {
    var startParameter;

    function WebApplication(params) {
        startParameter = params;
    }

    var clientCount = 0;

    /*
     * Web socket client
     */
    var webSocketClient = undefined;

    /*
     * Ser socket server
     */
    var httpServer = undefined;
    var webSocketServer = undefined;
    /*
     * Store connected clients
     */
    var clients = {};
    /*
     * Map ID -> Code
     */
    var clientCodesPerId = {};
    /*
     * Map Code -> Id
     */
    var clientIdsPerCode = {};


    /*
     * User serialization
     */
    passport.serializeUser(function (user, done) {
        return done(null, user);
    });

    /*
     * User deserialization
     */
    passport.deserializeUser(function (user, done) {
        return done(false, user);
    });

    /*
     * Configura Local Strategy Authentification
     */
    passport.use(new LocalStrategy(function (username, password, done) {
        // Ask main server
        webSocketClient.emit('login', {username: username, password: password}, function (err, user) {
            if (!user) {
                return done(new Error('Authentification failed.'), false);
            } else {
                return done(null, user);
            }
        });
    }));

    /*
     * Shared JS Manager
     */
    var sharedScripts = piler.createJSManager({
        outputDirectory: __dirname + '/public',
        urlRoot: '/shared/'
    });
    sharedScripts.addFile('WebApplication/scripts/util.js');
    sharedScripts.addFile('WebApplication/scripts/modules/directives.js');
    sharedScripts.addFile('WebApplication/scripts/modules/filters.js');
    sharedScripts.addFile('WebApplication/scripts/modules/htmlGenModule.js');
    sharedScripts.addFile('WebApplication/scripts/modules/mapModule.js');
    sharedScripts.addFile('WebApplication/scripts/modules/socketModule.js');
    sharedScripts.addFile('WebApplication/scripts/modules/alertModule.js');


    /*
     * Main Library Js Manager
     */
    var loginLibs = piler.createJSManager({
        outputDirectory: __dirname + '/public',
        urlRoot: '/lib/'
    });
    loginLibs.addFile('WebApplication/public/lib/angular/angular.min.js');
    loginLibs.addFile('WebApplication/public/lib/jquery-ui/jquery-ui-1.10.3.custom.min.js');
    loginLibs.addFile('WebApplication/public/lib/angular-ui/angular-ui.min.js');
    loginLibs.addFile('WebApplication/public/lib/ui-bootstrap/ui-bootstrap-0.4.0.min.js');
    loginLibs.addFile('WebApplication/public/lib/crypto/sha256-min.js');

    /*
     * Login JS Manager
     */
    var loginScripts = piler.createJSManager({
        outputDirectory: __dirname + '/public',
        urlRoot: '/login/'
    });
    loginScripts.addFile('WebApplication/scripts/loginApp.js');
    loginScripts.addFile('WebApplication/scripts/login/loginCtrl.js');
    loginScripts.addFile('WebApplication/scripts/login/forgotPasswordDialogCtrl.js');
    loginScripts.addFile('WebApplication/scripts/login/feedbackDialogCtrl.js');
    loginScripts.addFile('WebApplication/scripts/login/donateTrackDialogCtrl.js');
    loginScripts.addFile('WebApplication/scripts/login/sweepstakeDialogCtrl.js');
    loginScripts.addFile('WebApplication/scripts/login/disclaimerDialogCtrl.js');
    loginScripts.addFile('WebApplication/scripts/login/contactDialogCtrl.js');

    /*
     * OpenLogin JS Manager
     */
    var openLoginScripts = piler.createJSManager({
        outputDirectory: __dirname + '/public',
        urlRoot: '/openLogin/'
    });
    openLoginScripts.addFile('WebApplication/scripts/openLoginApp.js');
    openLoginScripts.addFile('WebApplication/scripts/login/openLoginCtrl.js');
    openLoginScripts.addFile('WebApplication/scripts/login/feedbackDialogCtrl.js');
    openLoginScripts.addFile('WebApplication/scripts/login/donateTrackDialogCtrl.js');
    openLoginScripts.addFile('WebApplication/scripts/login/sweepstakeDialogCtrl.js');
    openLoginScripts.addFile('WebApplication/scripts/login/disclaimerDialogCtrl.js');
    openLoginScripts.addFile('WebApplication/scripts/login/contactDialogCtrl.js');
    openLoginScripts.addFile('WebApplication/scripts/login/faqDialogCtrl.js');

    /*
     * Admin Library Js Manager
     */
    var adminLibs = piler.createJSManager({
        outputDirectory: __dirname + '/public',
        urlRoot: '/lib/'
    });
    adminLibs.addUrl('http://openlayers.org/api/OpenLayers.js');
    adminLibs.addFile('WebApplication/public/lib/angular/angular.min.js');
    adminLibs.addFile('WebApplication/public/lib/jquery-ui/jquery-ui-1.10.3.custom.min.js');
    adminLibs.addFile('WebApplication/public/lib/angular-ui/angular-ui.min.js');
    adminLibs.addFile('WebApplication/public/lib/ui-bootstrap/ui-bootstrap-0.4.0.min.js');

    /*
     * Admin JS Manager
     */
    var adminScripts = piler.createJSManager({
        outputDirectory: __dirname + '/public',
        urlRoot: '/admin/'
    });
    adminScripts.addFile('WebApplication/scripts/modules/adminSocketModule.js');
    adminScripts.addFile('WebApplication/scripts/modules/adminMapModule.js');
    adminScripts.addFile('WebApplication/scripts/adminApp.js');
    adminScripts.addFile('WebApplication/scripts/admin/adminCtrl.js');
    adminScripts.addFile('WebApplication/scripts/admin/statusCtrl.js');
    adminScripts.addFile('WebApplication/scripts/admin/interfacesCtrl.js');
    adminScripts.addFile('WebApplication/scripts/admin/usersCtrl.js');
    adminScripts.addFile('WebApplication/scripts/admin/communitiesCtrl.js');
    adminScripts.addFile('WebApplication/scripts/admin/tracksCtrl.js');
    adminScripts.addFile('WebApplication/scripts/admin/inductionLoopsCtrl.js');
    adminScripts.addFile('WebApplication/scripts/admin/bluetoothSensorsCtrl.js');
    adminScripts.addFile('WebApplication/scripts/admin/wifiRoutersCtrl.js');
    adminScripts.addFile('WebApplication/scripts/admin/motionCtrl.js');
    adminScripts.addFile('WebApplication/scripts/admin/importInductionloopDataDialogCtrl.js');
    adminScripts.addFile('WebApplication/scripts/admin/createInductionloopDialogCtrl.js');

    /*
     * Main Library Js Manager
     */
    var mainLibs = piler.createJSManager({
        outputDirectory: __dirname + '/public',
        urlRoot: '/lib/'
    });
    mainLibs.addUrl('http://openlayers.org/api/OpenLayers.js');
    mainLibs.addFile('WebApplication/public/lib/angular/angular.min.js');
    mainLibs.addFile('WebApplication/public/lib/jquery-ui/jquery-ui-1.10.3.custom.min.js');
    mainLibs.addFile('WebApplication/public/lib/angular-ui/angular-ui.min.js');
    mainLibs.addFile('WebApplication/public/lib/ui-bootstrap/ui-bootstrap-0.4.0.min.js');
    mainLibs.addFile('WebApplication/public/lib/crypto/sha256-min.js');

    /*
     * Main JS Manager
     */
    var mainScripts = piler.createJSManager({
        outputDirectory: __dirname + '/public',
        urlRoot: '/main/'
    });
    mainScripts.addFile('WebApplication/scripts/modules/mainMapModule.js');
    mainScripts.addFile('WebApplication/scripts/modules/userModule.js');
    mainScripts.addFile('WebApplication/scripts/modules/statisticsModule.js');
    mainScripts.addFile('WebApplication/scripts/modules/actionsModule.js');
    mainScripts.addFile('WebApplication/scripts/modules/messagesModule.js');
    mainScripts.addFile('WebApplication/scripts/modules/fuelModule.js');
    mainScripts.addFile('WebApplication/scripts/mainApp.js');
    mainScripts.addFile('WebApplication/scripts/main/mainCtrl.js');
    mainScripts.addFile('WebApplication/scripts/main/messagesCtrl.js');
    mainScripts.addFile('WebApplication/scripts/main/communityCtrl.js');
    mainScripts.addFile('WebApplication/scripts/main/actionListCtrl.js');
    mainScripts.addFile('WebApplication/scripts/main/actionControlsCtrl.js');
    mainScripts.addFile('WebApplication/scripts/main/actionsCtrl.js');
    mainScripts.addFile('WebApplication/scripts/main/actionMapCtrl.js');
    mainScripts.addFile('WebApplication/scripts/main/actionStatsCtrl.js');
    mainScripts.addFile('WebApplication/scripts/main/communitiesCtrl.js');
    mainScripts.addFile('WebApplication/scripts/main/statisticsCtrl.js');
    mainScripts.addFile('WebApplication/scripts/main/settingsCtrl.js');
    mainScripts.addFile('WebApplication/scripts/main/userCtrl.js');
    mainScripts.addFile('WebApplication/scripts/main/communitySearchDialogCtrl.js');
    mainScripts.addFile('WebApplication/scripts/main/userSearchDialogCtrl.js');
    mainScripts.addFile('WebApplication/scripts/main/communityCreateDialogCtrl.js');
    mainScripts.addFile('WebApplication/scripts/main/lockedZoneDialogCtrl.js');
    mainScripts.addFile('WebApplication/scripts/main/dataDialogCtrl.js');
    mainScripts.addFile('WebApplication/scripts/main/changePasswordDialogCtrl.js');
    mainScripts.addFile('WebApplication/scripts/main/uploadTrackDialogCtrl.js');
    mainScripts.addFile('WebApplication/scripts/main/deleteAccountDialogCtrl.js');
    mainScripts.addFile('WebApplication/scripts/login/feedbackDialogCtrl.js');
    mainScripts.addFile('WebApplication/scripts/login/sweepstakeDialogCtrl.js');
    mainScripts.addFile('WebApplication/scripts/login/disclaimerDialogCtrl.js');
    mainScripts.addFile('WebApplication/scripts/login/contactDialogCtrl.js');

    /*
     * App
     */
    var app = express();
    // CONFIGURATION
    app.configure(function () {
        app.set('views', __dirname + '/views');
        app.set('view engine', 'jade');

        app.use(express.bodyParser());
        app.use(express.favicon());
        app.use(express.cookieParser());

        app.use(express.session({ secret: 'keyboard cat' }));
        app.use(passport.initialize());
        app.use(passport.session());

        app.use(express.static(__dirname + '/public'));
        app.use(app.router);

        // Bind JS Managers
        loginScripts.bind(app);
        openLoginScripts.bind(app);
        loginLibs.bind(app);
        mainScripts.bind(app);
        mainLibs.bind(app);
        adminScripts.bind(app);
        adminLibs.bind(app);
        sharedScripts.bind(app);
    });
    app.configure('development', function () {
        app.use(express.logger());
    });
    app.configure('production', function () {
        //nothing yet
    });

    /**
     * Connect web app to main server with appropriate connect parameter
     *
     * @param connectParameter Possible properties
     * - port, Port to connect to
     * - host, Host to connect to
     * - onConnect, callback to be invoked if connection is established
     * @returns self for chaining
     */
    WebApplication.prototype.connectToWS = function (connectParameter) {
        var deferred = q.defer();
        try {
            var host = connectParameter.host || 'localhost';

            /*
             * Connect to serverApplication
             */

            console.log('webApplication.js: connecting to ws');
            if (!webSocketClient) {
                webSocketClient = socketioClient.connect(host, {
                    port: connectParameter.port
                });
            } else {
                webSocketClient.socket.connect(host, {
                    port: connectParameter.port
                });
            }

            /*
             * On Connection
             */
            webSocketClient.on('connect', function () {
                logger.info('Web socket connection established. I am client.');

                deferred.resolve();
            });
        } catch (e) {
            deferred.reject(e);
        }

        /*
         * Expose exports
         */
        return deferred.promise;
    };


    /**
     * Start web application with appropriate start parameters
     *
     * @param startParameter Possible properties
     * - webSocketPort, Port to listen on
     * - logLevel, log level for socket.io
     * - onStarted, Callback to be invoked when web socket started
     * @returns self for chaining
     */
    WebApplication.prototype.start = function () {
        var deferred = q.defer();
        try {
            /*
             * Create and start server
             */
            httpServer = http.createServer(app);
            httpServer.on('listening', function () {
                logger.info('HTTP server for web socket ready.');
            });
            httpServer.listen(startParameter.webSocketPort);

            /*
             * Start web socket
             */
            webSocketServer = socketio.listen(httpServer);
            logger.info('Web socket initialized');

            // Set log level
            webSocketServer.set('log level', startParameter.logLevel || 0);

            // ROUTES
            var routeHandler = new RouteHandler({
                sharedjs: sharedScripts,
                loginjs: loginScripts,
                openloginjs: openLoginScripts,
                loginlibjs: loginLibs,
                mainjs: mainScripts,
                mainlibjs: mainLibs,
                adminjs: adminScripts,
                adminlibjs: adminLibs,
                clientCodesPerId: clientCodesPerId,
                logger: logger
            });
            app.get('/', routeHandler.index);
            app.get('/verify', routeHandler.verify);

            app.get('/login', routeHandler.login);
            app.get('/login/partial/:name', routeHandler.loginPartial);

            app.get('/openLogin', routeHandler.openLogin);
            app.get('/openLogin/partial/:name', routeHandler.openLoginPartial);

            app.get('/main', routeHandler.main);
            app.get('/main/partial/:name', routeHandler.mainPartial);

            app.get('/admin', express.basicAuth(function (username, password) {
                return (username == "admin" && password == "pass");
            }));
            app.get('/admin', routeHandler.admin);
            app.get('/admin/partial/:name', routeHandler.adminPartial);


            // API
            var apiHandler = new APIHandler({
                webSocketClient: webSocketClient,
                passport: passport,
                cryptCtrl: cryptoCtrl,
                smtpCtrl: smtpCtrl,
                clientCodesPerId: clientCodesPerId,
                clientCodesPerCode: clientIdsPerCode,
                q: q,
                logger: logger
            });
            app.post('/register', apiHandler.register);
            app.post('/openRegister', apiHandler.openRegister);
            app.post('/login', apiHandler.login);
            app.post('/openLogin', apiHandler.openLogin);
            app.use('/activate', apiHandler.activate);
            app.use('/reset', apiHandler.confirmPasswordReset);
            app.use('/logout', apiHandler.logout);
            app.use(apiHandler.fallback);

            /*
             * Register on connection callback
             */
            var webSocketHandler = new WebSocketHandler({
                webSocketClient: webSocketClient,
                clients: clients,
                clientCodesPerId: clientCodesPerId,
                clientCodesPerCode: clientIdsPerCode,
                smtpCtrl: smtpCtrl,
                cryptCtrl: cryptoCtrl,
                logger: logger
            });

            /*
             * Register handlers
             */
            webSocketServer.sockets.on('connection', function (socket) {
                socket.on('disconnect', function () {
                    if (socket) {
                        delete clients[socket.userId];
                        exports.clientCount--;
                    }
                });
                socket.on('sendFeedback', webSocketHandler.sendFeedback.bind(undefined, socket));
                socket.on('sendContact', webSocketHandler.sendContact.bind(undefined, socket));

                socket.on('identification', webSocketHandler.identification.bind(undefined, socket));
                socket.on('getFullUser', webSocketHandler.getFullUser.bind(undefined, socket));
                socket.on('getUserFriends', webSocketHandler.getUserFriends.bind(undefined, socket));
                socket.on('getUserFriend', webSocketHandler.getUserFriend.bind(undefined, socket));
                socket.on('getFueltypes', webSocketHandler.getFueltypes.bind(undefined, socket));
                socket.on('saveUser', webSocketHandler.saveUser.bind(undefined, socket));
                socket.on('resetPassword', webSocketHandler.resetPassword.bind(undefined, socket));
                socket.on('changePassword', webSocketHandler.changePassword.bind(undefined, socket));
                socket.on('getActionList', webSocketHandler.getActionList.bind(undefined, socket));
                socket.on('getActionData', webSocketHandler.getActionData.bind(undefined, socket));
                socket.on('getLeaderboard', webSocketHandler.getLeaderboard.bind(undefined, socket));
                socket.on('getGroupLeaderboard', webSocketHandler.getGroupLeaderboard.bind(undefined, socket));
                socket.on('getMessages', webSocketHandler.getMessages.bind(undefined, socket));
                socket.on('markMessageAsRead', webSocketHandler.markMessageAsRead.bind(undefined, socket));
                socket.on('joinCommunity', webSocketHandler.joinCommunity.bind(undefined, socket));
                socket.on('leaveCommunity', webSocketHandler.leaveCommunity.bind(undefined, socket));
                socket.on('acceptJoinRequest', webSocketHandler.acceptJoinRequest.bind(undefined, socket));
                socket.on('rejectJoinRequest', webSocketHandler.rejectJoinRequest.bind(undefined, socket));
                socket.on('getUserCommunities', webSocketHandler.getUserCommunities.bind(undefined, socket));
                socket.on('getCommunity', webSocketHandler.getCommunity.bind(undefined, socket));
                socket.on('getCommunityList', webSocketHandler.getCommunityList.bind(undefined, socket));
                socket.on('getUserList', webSocketHandler.getUserList.bind(undefined, socket));
                socket.on('getCommunityTypes', webSocketHandler.getCommunityTypes.bind(undefined, socket));
                socket.on('addCommunity', webSocketHandler.addCommunity.bind(undefined, socket));
                socket.on('pushLockedZone', webSocketHandler.pushLockedZone.bind(undefined, socket));
                socket.on('getLockedZones', webSocketHandler.getLockedZones.bind(undefined, socket));
                socket.on('deleteLockedZone', webSocketHandler.deleteLockedZone.bind(undefined, socket));
                socket.on('alterLockedZone', webSocketHandler.alterLockedZone.bind(undefined, socket));
                socket.on('deleteData', webSocketHandler.deleteData.bind(undefined, socket));
                socket.on('anonymizeData', webSocketHandler.anonymizeData.bind(undefined, socket));
                socket.on('makeFriendRequest', webSocketHandler.makeFriendRequest.bind(undefined, socket));
                socket.on('sendMessage', webSocketHandler.sendMessage.bind(undefined, socket));
                socket.on('uploadTrack', webSocketHandler.uploadTrack.bind(undefined, socket));
                socket.on('deleteMessage', webSocketHandler.deleteMessage.bind(undefined, socket));
                socket.on('deleteAccount', webSocketHandler.deleteAccount.bind(undefined, socket));
                socket.on('donateTrack', webSocketHandler.donateTrack.bind(undefined, socket));
                socket.on('sendSweepstakeCredentials', webSocketHandler.sendSweepstakeCredentials.bind(undefined, socket));
                socket.on('confirmNotification', webSocketHandler.confirmNotification.bind(undefined, socket));


                // Admin-Stuff
                socket.on('getInductionLoops', webSocketHandler.getInductionLoops.bind(undefined, socket));
                socket.on('getInductionLoopTypes', webSocketHandler.getInductionLoopTypes.bind(undefined, socket));
                socket.on('getInductionLoopGroups', webSocketHandler.getInductionLoopGroups.bind(undefined, socket));
                socket.on('createInductionLoop', webSocketHandler.createInductionLoop.bind(undefined, socket));
                socket.on('getBluetoothSensors', webSocketHandler.getBluetoothSensors.bind(undefined, socket));
                socket.on('uploadCSV', webSocketHandler.uploadCSV.bind(undefined, socket));
                socket.on('calculateBluetoothRatio', webSocketHandler.calculateBluetoothRatio.bind(undefined, socket));
                socket.on('loadActions', webSocketHandler.loadActions.bind(undefined, socket));
                socket.on('getOnlineUsers', webSocketHandler.getOnlineUsers.bind(undefined, socket));
                socket.on('getAllUsers', webSocketHandler.getAllUsers.bind(undefined, socket));
                socket.on('getAllCommunities', webSocketHandler.getAllCommunities.bind(undefined, socket));
                socket.on('getWifiRouters', webSocketHandler.getWifiRouters.bind(undefined, socket));
                socket.on('calculateBluetoothTracks', webSocketHandler.calculateBluetoothTracks.bind(undefined, socket));
                socket.on('getMotionData', webSocketHandler.getMotionData.bind(undefined, socket));
            });

            logger.info('Web application started.');

            deferred.resolve();
        } catch (e) {
            deferred.reject(e);
        }

        return deferred.promise;
    };


    WebApplication.prototype.stop = function () {
        var deferred = q.defer();

        try {
            logger.info('Stopping web application.');

            if (webSocketClient) {
                webSocketClient.disconnect();
            }

            if (webSocketServer && webSocketServer.server) {
                webSocketServer.server.close();
            }

            deferred.resolve();
        } catch (e) {
            logger.info('Error while shutting down web application:', e);
            deferred.resolve();
        }

        return deferred.promise;
    };

    return WebApplication;
}());