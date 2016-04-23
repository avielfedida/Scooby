'use strict';
/// <reference path="typings/main.d.ts" />
var express = require('express');
var mongoose = require('mongoose');
var socketio = require('socket.io');
var http = require('http');
var fs = require('fs');
var Normalizer = require('./normalizer');
var Vald = require('./vald');
var dbCommunicator_1 = require('./dbCommunicator');
var mongoPASS = new Buffer('bnVtZXJhdG9yNG1l', 'base64');
var app = express();
var server = http.Server(app);
var io = socketio(server);
var dbURI = "mongodb://aviel:" + mongoPASS + "@127.0.0.1:27017/botalk";
var publicBaseDir = __dirname + '/public';
var flags = {
    sleep: false
};
// Simple logger for this router's requests, all requests to this router will first hit this middleware.
app.use(function (req, res, next) {
    console.log('%s %s %s', req.method, req.url, req.path);
    next();
});
app.use(function (req, res, next) {
    if (flags.sleep) {
        res.sendFile(baseWrapper('/sleep.html'));
    }
    else {
        next();
    }
});
//Set our static file directory to public
app.use(express.static(publicBaseDir));
var RegExpAccuracyLevel = 1;
var config = {
    port: 80
};
function baseWrapper(appendThis) {
    return publicBaseDir + appendThis;
}
server.listen(config.port, function () {
    // Start listening...
    console.log("Started listening on port " + config.port + "...");
    var resScheme = new mongoose.Schema({
        reqResType: Number,
        resType: Number,
        id: String
    }, { _id: false });
    var stackScheme = new mongoose.Schema({
        message: String,
        // 0 type for quatations, 1 for dots, 2 for exclamations
        responses: [resScheme]
    }, {
        versionKey: false // http://aaronheckmann.tumblr.com/post/48943525537/mongoose-v3-part-1-versioning
    });
    // MongoDB will take the names of the models and treat them as collections without the Uppercase, for example Stack as stack
    var Stack = mongoose.model('Stack', stackScheme);
    fs.readFile('./questions-words.json', function (err, jsonBuf) {
        if (err || !jsonBuf)
            throw "Unable to load questions-words.json";
        var parseBuffer = JSON.parse(jsonBuf.toString()), qWords = parseBuffer.words, mqWords = parseBuffer.middleWords, dbCom = new dbCommunicator_1.default(mongoose.connection, Stack, qWords, mqWords), callbacks = {
            // ei stands for exsists/inserted, basically just an inserted object
            updateRequestWith: function (ei, socket, type, locals, QueryRegExpObj) {
                // The use or .equals is due to: http://stackoverflow.com/questions/11637353/comparing-mongoose-id-and-strings
                var urwCB = function (res) {
                    console.log("updateRequestWith callback was called.");
                    if (res) {
                        console.log("updateRequestWith equals is: ", (res.reqRes.equals(ei._id)));
                        locals.requestKeeper = res;
                        // Rare case where unknown message just inserted to the database, there was no response to it so 
                        // the engine returned some request and that request happen to be the unknown message just inserted.
                        if (res.reqRes.equals(ei._id))
                            console.log("Same message, just alerted :)");
                        socket.emit('response', res.reqRes.message + Normalizer.getTypeChar(res.reqResType));
                    }
                    else {
                        console.log('Failed to fetch response or request(CAN NEVER HAPPEN)!');
                    }
                };
                dbCom.updateRequestWith(ei, QueryRegExpObj, type, locals, urwCB);
            }
        };
        // I can't use close event as close event will be called only when database already opened and suddenly closed, when I try to reconnect and fail only disconnected event get called.
        // Also error handler will only be called if I started the server and the database is down, disconnected will always be called.
        dbCom.db.on('disconnected', function () {
            console.error("/************ ERROR *************/\n", "Database is down", "\n/********************************/");
            flags.sleep = true;
            console.log('Database disconnected, retry in 5...');
            io.engine.close();
            /*
            The reason I use engine.close and not io.close is because io.close also closes the httpServer(old viewers who visited before db
            crashed will be able to go into the sleep page(as their connection existed before io.close), but new users will get
            ERR_CONNECTION_REFUSED, basically io.close() blocks new connections), and I don't want that, and about the use of io.engine.close()
            the only reason I close the engine is as a mean to alert the user about database error without the need to build
            separate error system for sockets(socket error of any kind) error and database down errors, the idea is that basically the user
            don't need to care about what error was that.
            */
            io.sockets.removeAllListeners("connection");
            /*
            removeAllListeners is used to prevent a case where the client already reload, saw sleep mode screen and after some time
            refreshed the page, the server is back and now there are 2 callbacks for connection event, the reason for using it is simply
            because I will attach a new one within database open event, so to prevent 1 message from the client 2/3..5 from the server I have
            to remove all connection event listeners.
            */
            setTimeout(function () {
                console.log('Reconnection tryout...');
                mongoose.connect(dbURI, { server: { auto_reconnect: false } });
            }, 5000);
        });
        // The reason I use this event is to prevent errors from breaking the server while for example I initiate the server while database is down.
        dbCom.db.on('error', function () { });
        dbCom.db.on('open', function () {
            flags.sleep = false;
            console.log('Database connection established');
            // Once connected, start listen for connections and then messages
            io.on('connection', function (socket) {
                // Locals per connection callback
                var locals = { requestKeeper: null };
                console.log('Socket connection established');
                socket.on('message', function (msg) {
                    // To prevent messages from initiating any kind of process while database is down.
                    if (mongoose.connection.readyState === 0) {
                        return;
                    }
                    console.log('=================Message at(' + new Date + ')=================');
                    // If for some reason client-side script failed to validate the data.
                    if (!Vald.message(msg))
                        throw 'Invalid message received.';
                    var type = Normalizer.getType(msg);
                    var typeEmittedMsg = Normalizer.getMessage(msg);
                    var QueryRegExpObj = Normalizer.createRegExp(typeEmittedMsg, RegExpAccuracyLevel);
                    var QueryRegExp = QueryRegExpObj.regExp;
                    // Is this a question?
                    if (qWords.indexOf(Normalizer.getFirstWord(typeEmittedMsg)) !== -1
                        ||
                            (function (mqWords, typeEmittedMsg) {
                                var regExp = new RegExp(" " + mqWords.join(" | ") + " ");
                                return regExp.test(typeEmittedMsg);
                            })(mqWords, typeEmittedMsg)) {
                        type = 0; // 0 for quatation mark(?)
                    }
                    console.log("TYPE", type);
                    // I'm about to update the request with this response(if there is a request, cloud not for the first time), but I should check if the response entry exists or I should create one.
                    dbCom.exists(typeEmittedMsg, function (exists) {
                        if (exists) {
                            // Ok the response enty is there, now I should update the request entry with that response.
                            callbacks.updateRequestWith(exists, socket, type, locals, QueryRegExpObj);
                        }
                        else {
                            dbCom.save(typeEmittedMsg, function (inserted) {
                                if (inserted) {
                                    // No update
                                    callbacks.updateRequestWith(inserted, socket, type, locals, QueryRegExpObj);
                                }
                                else {
                                    console.log('Failure within insertation');
                                }
                            });
                        }
                    });
                });
                socket.on('disconnect', function () {
                    console.log('Socket disconnected.');
                });
            });
        });
        //Connect to mongo DB database, notice this line appears only after once even was assined.
        // mongoose.connect(dbURI, {server:{auto_reconnect:true, reconnectTries: Number.MAX_VALUE, reconnectInterval: 5000}}); // The db should grabbed from outer config class
        mongoose.connect(dbURI, { server: { auto_reconnect: false } }); // The db should grabbed from outer config class
    });
});
