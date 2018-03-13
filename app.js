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

exports.httpServer = require('./httpServer')

exports.httpsServer = require('./httpsServer')

process.on('uncaughtException', function (err) {
    console.log('process error', err);
});

