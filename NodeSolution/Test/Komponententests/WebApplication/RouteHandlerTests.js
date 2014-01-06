/**
 * User: DennisHoeting
 * Date: 22.05.13
 * Time: 08:10
 *
 * $
 */
suite('Route Handler Tests', function () {
    var assert = require('node-assertthat');
    var log4js = require('log4js');
    log4js.configure({
        appenders: [
            {type: 'console'},
            {type: 'file', filename: 'logs/test.log', category: 'Test.js'}
        ]
    });
    var logger = log4js.getLogger('Test.js')
    logger.setLevel('INFO');

    var req = undefined, res = undefined;
    var RH = require('./../../../WebApplication/handlers/routeHdl').RouteHandler;
    var routeHandler = undefined;
    var current;

    var USERID = 1, USERCODE = 't357c0d3';

    setup(function () {
        var _clientCodesPerId = {};
        _clientCodesPerId[USERID]=USERCODE;
        routeHandler = new RH({
            sharedjs: {renderTags: function () {current.sharedRendered=true;}},
            loginjs: {renderTags: function () {current.loginRendered=true;}},
            openloginjs: {renderTags: function () {current.openLoginRendered=true;}},
            loginlibjs: {renderTags: function () {current.loginLibRendered=true;}},
            mainjs: {renderTags: function () {current.mainRendered=true;}},
            mainlibjs: {renderTags: function () {current.mainLibRendered=true;}},
            adminjs: {renderTags: function () {current.adminRendered=true;}},
            adminlibjs: {renderTags: function () {current.adminLibRendered=true;}},
            clientCodesPerId: _clientCodesPerId,
            logger: logger
        });
        req = {
            isAuthenticated : function () {
                return current.authenticated;
            },
            user : {
                id: USERID
            },
            query : {}
        };
        res = {
            redirect : function (url) {
                current.fakeUrl = url;
            },
            render : function (templateName, templateParams) {
                current.templateName = templateName;
                current.templateParams = templateParams;
            }
        };
        current = {
            authenticated : true,
            fakeUrl : '',
            templateName : '',
            templateParams : undefined,
            sharedRendered : false,
            loginRendered : false,
            openLoginRendered : false,
            mainRendered : false,
            adminRendered : false,
            loginLibRendered : false,
            mainLibRendered : false,
            adminLibRendered : false
        };
    });

    test('index-Test', function (done) {
        routeHandler.index(req, res);
        setTimeout(function () {
            assert.that(current.fakeUrl, is.equalTo('/verify'));
            done();
        }, 10);
    });

    test('verify-Test', function (done) {
        routeHandler.verify(req, res);
        setTimeout(function () {
            assert.that(current.fakeUrl, is.equalTo('/main?id=' + req.user.id));
            done();
        }, 10);
    });

    test('verify-Test-negative', function (done) {
        req.user.id = undefined;
        routeHandler.verify(req, res);
        setTimeout(function () {
            assert.that(current.fakeUrl, is.equalTo('/openLogin'));
            done();
        }, 10);
    });

    test('verify-Test-negative2', function (done) {
        current.authenticated = false;
        routeHandler.verify(req, res);
        setTimeout(function () {
            assert.that(current.fakeUrl, is.equalTo('/openLogin'));
            done();
        }, 10);
    });

    test('login-Test', function (done) {
        routeHandler.login(req, res);
        setTimeout(function () {
            assert.that(current.fakeUrl, is.equalTo('/openLogin'));
            done();
        }, 10);
    });

    test('login-Test', function (done) {
        routeHandler.openLogin(req, res);
        setTimeout(function () {
            assert.that(current.templateName, is.equalTo('openLogin'));
            assert.that(current.templateParams.title, is.equalTo('Login'));
            assert.that(current.sharedRendered, is.true());
            assert.that(current.openLoginRendered, is.true());
            assert.that(current.loginLibRendered, is.true());
            done();
        }, 10);
    });

    test('loginPartial-Test', function (done) {
        req.params = {
            name : 'something'
        };
        routeHandler.loginPartial(req,res);
        setTimeout(function () {
            assert.that(current.templateName, is.equalTo('login/something'));
            done();
        }, 10);
    });

    test('main-Test', function (done) {
        req.url = '/main';
        routeHandler.main(req,res);
        setTimeout(function () {
            assert.that(current.fakeUrl, is.equalTo('/main?id='+USERCODE));
            done();
        }, 10);
    });

    test('main-Test2', function (done) {
        req.query.id = USERCODE;
        routeHandler.main(req,res);
        setTimeout(function () {
            assert.that(current.templateName, is.equalTo('main'));
            assert.that(current.templateParams.title, is.equalTo('Main'));
            assert.that(current.sharedRendered, is.true());
            assert.that(current.mainRendered, is.true());
            assert.that(current.mainLibRendered, is.true());
            done();
        }, 10);
    });

    test('main-Test_negative', function (done) {
        req.url = '/something';
        routeHandler.main(req,res);
        setTimeout(function () {
            assert.that(current.fakeUrl, is.equalTo('/main?id='+USERCODE));
            done();
        }, 10);
    });

    test('main-Test_negative2', function (done) {
        current.authenticated = false;
        routeHandler.main(req,res);
        setTimeout(function () {
            assert.that(current.fakeUrl, is.equalTo('/verify'));
            done();
        }, 10);
    });

    test('mainPartial-Test', function (done) {
        req.params = {
            name : 'something'
        };
        routeHandler.mainPartial(req,res);
        setTimeout(function () {
            assert.that(current.templateName, is.equalTo('main/something'));
            done();
        }, 10);
    });

    test('admin-Test', function (done) {
        routeHandler.admin(req, res);
        setTimeout(function () {
            assert.that(current.templateName, is.equalTo('admin'));
            assert.that(current.templateParams.title, is.equalTo('Admin'));
            assert.that(current.sharedRendered, is.true());
            assert.that(current.adminRendered, is.true());
            assert.that(current.adminLibRendered, is.true());
            done();
        }, 10);
    });

    test('adminPartial-Test', function (done) {
        req.params = {
            name : 'something'
        };
        routeHandler.adminPartial(req,res);
        setTimeout(function () {
            assert.that(current.templateName, is.equalTo('admin/something'));
            done();
        }, 10);
    });
});