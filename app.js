/**
 * Created by loutao on 2017/3/14.
 */

var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');
var zlib = require('zlib');
var net = require('net');
var https = require('https');
var request = require('./request')
var regValidate = require('./regValidate')
var filterRequest = require('./filterRequest')
var {closeBrowserProxy} = require('set-browser-proxy')

var config = {
    http: {},
    https: {}
};

exports.httpServer = require('./httpServer')(setConfig, getConfig)

exports.httpsServer = require('./httpsServer')(setConfig, getConfig)

function setConfig(options) {
    options = options || {};
    Object.assign(config, options);
};

function getConfig() {
    return config
};

process.on('uncaughtException', function (err) {
    console.log('process error', err);
});

process.on('SIGINT', function () {
    var param = {};
    if (!config.http.autoSetProxy) param.http = false;
    if (!config.https.autoSetProxy) param.https = false;
    closeBrowserProxy(param).then(function () {
        process.exit();
    })
});

