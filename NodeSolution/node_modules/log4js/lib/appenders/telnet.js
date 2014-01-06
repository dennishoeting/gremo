/*
 * Requirements
 */
var layouts = require('../layouts'),    // layouts
    net = require('net');               // TCP Connection Lib

/*
 * Vars
 */
var server,         // Server instance
    sockets = [],   // Sockets
    port = 23,      // Default port
    onReady = undefined;

/*
 * Log Function
 */
var telnetLog = function (msg) {
    try {
        for (var i = 0; i < sockets.length; i++) {
            if (sockets[i].writable) {
                sockets[i].write(msg+ '\n');
            } else {
                sockets.splice(i, 1);
            }
        }
    } catch (e) {
        sockets.splice(i, 1);
        console.log('#### Exception in telnet logger:', e);
    }
};

/*
 * Const
 */
function telnetAppender(layout) {
    // Set Layout
    layout = layout || layouts.colouredLayout;

    // Create Server and listen to port
    try {
        server = net.createServer(function (socket) {
            // Add to clients
            sockets.push(socket);

            // Delete from clients on disconnect
            socket.on('close', function () {
                var pos = sockets.indexOf(socket);
                sockets.splice(pos, 1);
                socket.destroy();
            });
        }).listen(port);

        onReady.apply(undefined, [server]);
    } catch (e) {
        server.close(function () {
            console.log('telnet.js: Telnet-Server closed.');
        });
    }

    // Return functionality
    return function (loggingEvent) {
        telnetLog(layout(loggingEvent));
    };
}

/*
 * Configuration
 */
function configure(config) {
    // Configure Layout
    var layout;
    if (config.layout) {
        layout = layouts.layout(config.layout.type, config.layout);
    }

    // Configure Port (standard is 23)
    if (config.port) {
        port = config.port;
    }

    if(config.onReady) {
        onReady = config.onReady;
    }

    // Return instance
    return telnetAppender(layout);
}

/*
 * Export
 */
exports.appender = telnetAppender;
exports.configure = configure;
