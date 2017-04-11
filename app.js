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

var config = require('./config');
var port = config.port,
    localPath = config.localPath;

var httpServer = http.createServer(function (req, res) {
    var reqChunk = [], reqChunkLen = 0;

    req.on('data', function (chunk) {
        reqChunk.push(chunk);
        reqChunkLen += chunk.length;
    });

    req.on('end', function () {

        var body = Buffer.concat(reqChunk, reqChunkLen);
        var requestUrl = req.url;
        var {tmpPath, tmpHeader, fileType, prefix} = regValidate(requestUrl);

        var urlObj = url.parse(requestUrl);
        var options = {
            host: urlObj.hostname,
            port: urlObj.port,
            method: req.method,
            path: urlObj.path,
            headers: req.headers
        };

        if (tmpPath) {
            console.log('reverse proxy request', requestUrl);

            tmpPath = tmpPath.replace(/\?.*/, '');
            tmpHeader['X-Resource-From'] = 'local';

            var result = [];
            var pathArr = tmpPath.split(',');

            pathArr.forEach(function (item, index) {
                var totalPath = path.join(localPath, prefix, fileType == 'js' ? 'js' :
                    fileType == 'css' ? 'css' : fileType == 'img' ? 'images' :
                        'css', item);

                fs.readFile(totalPath, function (err, data) {
                    if (err) {
                        console.log('readFile error', err);
                        tmpHeader['X-Resource-Not-Found'] = totalPath;
                        res.writeHead(404, tmpHeader);
                        res.end();

                        // _request(options, body, function (err2, data2, obj) {
                        //     if (err2) {
                        //         res.statusCode = obj.statusCode || 400;
                        //         res.statusMessage = obj.statusMessage;
                        //         res.end();
                        //     } else {
                        //         result[index] = data2;
                        //         check();
                        //     }
                        // })
                    } else {
                        result[index] = data;
                        check();
                    }
                })
            });

            function check() {
                var len = 0, list = [];
                result.forEach(function (item) {
                    if (item) {
                        if (fileType == 'js' || fileType == 'css') {
                            var crlf = Buffer.from('\r\n');
                            var tmpLen = item.length + crlf.length;
                            list.push(Buffer.concat([item, crlf], tmpLen));
                            len += tmpLen;
                        } else {
                            list.push(item);
                            len += item.length;
                        }
                    }
                });

                if (list.length == pathArr.length) {
                    var data = Buffer.concat(list, len);

                    res.writeHead(200, tmpHeader);
                    res.write(data);
                    res.end();
                }
            }

        } else {
            console.log('proxy request', requestUrl);

            _request(options, body, function (err, data, obj) {
                var header = obj.headers || {};

                header['X-Resource-From'] = 'origin';

                if (err) {
                    res.writeHead(obj.statusCode || 400, header);
                    res.end();
                } else {
                    res.writeHead(obj.statusCode, header);
                    res.write(data);
                    res.end();
                }
            });
        }

    });
});

httpServer.on('connect', function (req, socket, head) {
    var options = {
        port: 443
    };

    var socketProxy = new net.Socket();
    socketProxy.connect(options, function () {
        socket.write('HTTP/' + req.httpVersion + '200 Connection established\r\n\r\n');
    });

    socket.pipe(socketProxy);
    socketProxy.pipe(socket);
});

var sslOptions = {
    key: fs.readFileSync('./challenget.win.key'),
    cert: fs.readFileSync('./2_challenget.win.crt')
};
var httpsServer = https.createServer(sslOptions, function (req, res) {
    var reqChunk = [], reqChunkLen = 0;

    req.on('data', function (chunk) {
        reqChunk.push(chunk);
        reqChunkLen += chunk.length;
    });

    req.on('end', function () {

        var body = Buffer.concat(reqChunk, reqChunkLen);
        var requestUrl = 'https://' + req.headers['host'] + req.url;
        var {tmpPath, tmpHeader, fileType, prefix} = regValidate(requestUrl);

        var urlObj = url.parse(requestUrl);
        var options = {
            host: urlObj.hostname,
            port: 443,
            method: req.method,
            path: urlObj.path,
            headers: req.headers
        };

        if (tmpPath) {
            console.log('https reverse proxy request', requestUrl);

            tmpPath = tmpPath.replace(/\?.*/, '');
            tmpHeader['X-Resource-From'] = 'local';

            var result = [];
            var pathArr = tmpPath.split(',');

            pathArr.forEach(function (item, index) {
                var totalPath = path.join(localPath, prefix, fileType == 'js' ? 'js' :
                    fileType == 'css' ? 'css' : fileType == 'img' ? 'images' :
                        'css', item);

                fs.readFile(totalPath, function (err, data) {
                    if (err) {
                        console.log('readFile error', err);
                        tmpHeader['X-Resource-Not-Found'] = totalPath;
                        res.writeHead(404, tmpHeader);
                        res.end();

                        // _request(options, body, function (err2, data2, obj) {
                        //     if (err2) {
                        //         res.statusCode = obj.statusCode || 400;
                        //         res.statusMessage = obj.statusMessage;
                        //         res.end();
                        //     } else {
                        //         result[index] = data2;
                        //         check();
                        //     }
                        // })
                    } else {
                        result[index] = data;
                        check();
                    }
                })
            });

            function check() {
                var len = 0, list = [];
                result.forEach(function (item) {
                    if (item) {
                        if (fileType == 'js' || fileType == 'css') {
                            var crlf = Buffer.from('\r\n');
                            var tmpLen = item.length + crlf.length;
                            list.push(Buffer.concat([item, crlf], tmpLen));
                            len += tmpLen;
                        } else {
                            list.push(item);
                            len += item.length;
                        }
                    }
                });

                if (list.length == pathArr.length) {
                    var data = Buffer.concat(list, len);

                    res.writeHead(200, tmpHeader);
                    res.write(data);
                    res.end();
                }
            }

        } else {
            console.log('https proxy request', requestUrl);

            _request(options, body, function (err, data, obj) {
                var header = obj.headers || {};

                header['X-Resource-From'] = 'origin';

                if (err) {
                    res.writeHead(obj.statusCode || 400, header);
                    res.end();
                } else {
                    res.writeHead(obj.statusCode, header);
                    res.write(data);
                    res.end();
                }
            }, true);
        }

    });
});

function _request(options, body, cb, isHttps) {

    var req = (isHttps ? https : http).request(options, function (res) {
        // var header = res.headers;
        // var contentEncoding = header['content-encoding'];
        var list = [], len = 0;

        res.on('data', function (chunk) {
            list.push(chunk);
            len += chunk.length;
        });

        res.on('end', function () {
            var buffer = Buffer.concat(list, len);

            // switch (contentEncoding) {
            //     case 'gzip':
            //         buffer = zlib.gunzipSync(buffer);
            //         break;
            //     case 'deflate':
            //         buffer = zlib.inflateSync(buffer);
            //         break;
            // }

            cb(null, buffer, res);
        });

        res.on('error', function (err) {
            console.log('response error', err);
            cb(err, null, res);
        })
    });

    req.on('error', function (err) {
        console.log('request error', err);
        cb(err, null, req);
    });

    if (body) {
        req.write(body);
    }
    req.end();
}

function regValidate(requestUrl) {
    var jsReg1 = /\.\w+\/j\/\d+\//,
        jsReg2 = /\/site\/js\//,
        jsReg3 = /\/mj\/\d+\//,
        jsReg4 = /\/site\/m2015\/js\//;
    var cssReg1 = /\.\w+\/s\/\d+\/.+\.css/,
        cssReg2 = /\/ms\/\d+\/.+\.css/;
    var imgReg1 = /\.\w+\/img\/\d+\//,
        imgReg2 = /\/site\/images\//,
        imgReg3 = /\/site\/m2015\/images\//;
    var fontReg1 = /\/s\/\d+\/.+\.(woff|ttf|eot|otf)/;
    var fileType, tmpPath, tmpHeader, prefix = '';

    if (jsReg1.test(requestUrl)) {
        fileType = 'js';
        tmpPath = requestUrl.replace(/.*\/\d+\//, '');
        tmpHeader = {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        };
    } else if (jsReg2.test(requestUrl)) {
        fileType = 'js';
        tmpPath = requestUrl.replace(/.*\/site\/js\//, '');
        tmpHeader = {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        };
    } else if (jsReg3.test(requestUrl)) {
        fileType = 'js';
        tmpPath = requestUrl.replace(/.*\/mj\/\d+\//, '');
        tmpHeader = {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        };
        prefix = 'm2015';
    } else if (jsReg4.test(requestUrl)) {
        fileType = 'js';
        tmpPath = requestUrl.replace(/.*\/site\/m2015\/js\//, '');
        tmpHeader = {
            'Content-Type': 'application/javascript; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        };
        prefix = 'm2015';
    } else if (cssReg1.test(requestUrl)) {
        fileType = 'css';
        tmpPath = requestUrl.replace(/.*\/\d+\//, '');
        tmpHeader = {
            'Content-Type': 'text/css; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        };
    } else if (cssReg2.test(requestUrl)) {
        fileType = 'css';
        tmpPath = requestUrl.replace(/.*\/\d+\//, '');
        tmpHeader = {
            'Content-Type': 'text/css; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        };
        prefix = 'm2015';
    } else if (imgReg1.test(requestUrl)) {
        fileType = 'img';
        tmpPath = requestUrl.replace(/.*\/\d+\//, '');
        tmpHeader = {
            'Content-Type': getImageContentType(requestUrl),
            'Access-Control-Allow-Origin': '*'
        };
    } else if (imgReg2.test(requestUrl)) {
        fileType = 'img';
        tmpPath = requestUrl.replace(/.*\/site\/images\//, '');
        tmpHeader = {
            'Content-Type': getImageContentType(requestUrl),
            'Access-Control-Allow-Origin': '*'
        };
    } else if (imgReg3.test(requestUrl)) {
        fileType = 'img';
        tmpPath = requestUrl.replace(/.*\/site\/m2015\/images\//, '');
        tmpHeader = {
            'Content-Type': getImageContentType(requestUrl),
            'Access-Control-Allow-Origin': '*'
        };
        prefix = 'm2015';
    } else if (fontReg1.test(requestUrl)) {
        fileType = 'font';
        tmpPath = requestUrl.replace(/.*\/\d+\//, '');
        tmpHeader = {
            'Content-Type': 'text/plain; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        };
    }

    return {fileType, tmpPath, tmpHeader, prefix}
}

function getImageContentType(url) {
    if (url.match(/\.png/)) {
        return 'image/png'
    } else if (url.match(/\.(jpg|jpeg)/)) {
        return 'image/jpeg'
    } else if (url.match(/\.gif/)) {
        return 'image/gif'
    } else if (url.match(/\.svg/)) {
        return 'image/svg+xml'
    } else if (url.match(/\.tiff/)) {
        return 'image/tiff'
    }
}

process.on('uncaughtException', function (err) {
    console.log('process error', err);
});

httpServer.listen(port, function () {
    console.log('http server listen on %d', port)
});

httpsServer.listen(443, function () {
    console.log('https server listen on %d', 443)
});