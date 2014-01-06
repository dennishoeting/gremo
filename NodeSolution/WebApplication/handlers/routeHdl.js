/**
 * User: DennisHoeting
 * Date: 09.05.13
 * Time: 12:36
 *
 * $
 */

module.exports.RouteHandler = (function () {
    var sharedjs = undefined;
    var loginjs = undefined;
    var openloginjs = undefined;
    var loginlibjs = undefined;
    var mainjs = undefined;
    var mainlibjs = undefined;
    var adminjs = undefined;
    var adminlibjs = undefined;
    var clientCodesPerId = undefined;
    var logger = undefined;

    function RouteHandler(configs) {
        sharedjs = configs.sharedjs;
        loginjs = configs.loginjs;
        openloginjs = configs.openloginjs;
        loginlibjs = configs.loginlibjs;
        mainjs = configs.mainjs;
        mainlibjs = configs.mainlibjs;
        adminjs = configs.adminjs;
        adminlibjs = configs.adminlibjs
        clientCodesPerId = configs.clientCodesPerId;
        logger = configs.logger;
    }

    RouteHandler.prototype.index = function (req, res) {
        res.redirect('/verify');
    };

    RouteHandler.prototype.verify = function (req, res) {
        var targetUrl;
        if (req.isAuthenticated() && !isNaN(req.user.id)) {
            targetUrl = '/main?id=' + req.user.id;
            if(req.query.dest) {
                targetUrl += '&dest='+req.query.dest;
            }
        } else {
            //targetUrl = '/login';     //FIXME: messwoche
            targetUrl = '/openLogin';
            if(req.query.dest) {
                targetUrl += '?dest='+req.query.dest;
            }
        }
        res.redirect(targetUrl);
    };

    RouteHandler.prototype.login = function (req, res) {
        res.redirect('/openLogin');
        /*                              //FIXME: messwoche
        res.render('login', {
            title: 'Login',
            sharedjs: sharedjs.renderTags(),
            loginjs: loginjs.renderTags(),
            loginlibjs: loginlibjs.renderTags()
        });
        */
    };

    RouteHandler.prototype.loginPartial = function (req, res) {
        res.render('login/' + req.params.name);
    };

    RouteHandler.prototype.openLogin = function (req, res) {
        res.render('openLogin', {
            title: 'Login',
            sharedjs: sharedjs.renderTags(),
            loginjs: openloginjs.renderTags(),
            loginlibjs: loginlibjs.renderTags()
        });
    };

    RouteHandler.prototype.openLoginPartial = function (req, res) {
        res.render('login/' + req.params.name);
    };

    RouteHandler.prototype.main = function (req, res) {
        var targetUrl;
        if (req.isAuthenticated() && !isNaN(req.user.id)) {
            if (req.query.id == clientCodesPerId[req.user.id]) {
                res.render('main', {
                    title: 'Main',
                    sharedjs: sharedjs.renderTags(),
                    mainjs: mainjs.renderTags(),
                    mainlibjs: mainlibjs.renderTags()
                });
            } else {
                targetUrl = '/main?id=' + clientCodesPerId[req.user.id];
                if(req.query.dest) {
                    targetUrl += '&dest='+req.query.dest;
                }
                res.redirect(targetUrl);
            }
        } else {
            targetUrl = '/verify';
            if(req.query.dest) {
                targetUrl += '?dest='+req.query.dest;
            }
            res.redirect(targetUrl);
        }
    };

    RouteHandler.prototype.mainPartial = function (req, res) {
        res.render('main/' + req.params.name);
    };

    RouteHandler.prototype.admin = function (req, res) {
        res.render('admin', {
            title: 'Admin',
            sharedjs: sharedjs.renderTags(),
            adminjs: adminjs.renderTags(),
            adminlibjs: adminlibjs.renderTags()
        });
    };

    RouteHandler.prototype.adminPartial = function (req, res) {
        res.render('admin/' + req.params.name);
    };

    return RouteHandler;
})();