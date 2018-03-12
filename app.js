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
var dns = require('dns');
var minimatch = require('minimatch')

var config = require('./config');
var port = config.port || 3000
var httpsPort = config.httpsPort || 3001

var httpServer = http.createServer(function (req, res) {
    var reqChunk = [], reqChunkLen = 0;

    req.on('data', function (chunk) {
        reqChunk.push(chunk);
        reqChunkLen += chunk.length;
    });

    req.on('end', async function () {

        var body = Buffer.concat(reqChunk, reqChunkLen);
        var requestUrl = req.url;
        var {tmpPath, tmpHeader, fileType} = await regValidate(requestUrl);

        var urlObj = url.parse(requestUrl);
        var options = {
            host: urlObj.hostname,
            port: urlObj.port,
            method: req.method,
            path: urlObj.path,
            headers: req.headers
        };

        if (!filterRequest(requestUrl, res)) {
            return
        }

        if (tmpPath) {
            console.log('reverse proxy request', requestUrl);

            tmpPath = tmpPath.replace(/\?.*/, '');
            tmpHeader['X-Resource-From'] = 'local';

            var result = [];
            var pathArr = tmpPath.split(',');

            pathArr.forEach(function (item, index) {
                var totalPath = item;

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

    req.on('end', async function () {

        var body = Buffer.concat(reqChunk, reqChunkLen);
        var requestUrl = 'https://' + req.headers['host'] + req.url;
        var {tmpPath, tmpHeader, fileType} = await regValidate(requestUrl);

        var urlObj = url.parse(requestUrl);
        var options = {
            host: urlObj.hostname,
            port: 443,
            method: req.method,
            path: urlObj.path,
            headers: req.headers
        };

        if (!filterRequest(requestUrl, res)) {
            return
        }

        if (tmpPath) {
            console.log('https reverse proxy request', requestUrl);

            tmpPath = tmpPath.replace(/\?.*/, '');
            tmpHeader['X-Resource-From'] = 'local';

            var result = [];
            var pathArr = tmpPath.split(',');

            pathArr.forEach(function (item, index) {
                var totalPath = item;

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

            handleResult(null, buffer, res);
        });

        res.on('error', function (err) {
            console.log('response error', err);
            handleResult(err, null, res);
        });
    });

    req.on('error', function (err) {
        console.log('request error', err);
        if (err.message == 'socket hang up') req.abort();
        handleResult(err, null, req);
    });

    if (body) {
        req.write(body);
    }
    req.end();

    function handleResult(err, data, res) {
        dns.lookup(options.host, function (err2, address, family) {
            var header = res.headers || (res.headers = {});

            header['X-Resource-Ip'] = address || '';
            if (err) header['X-Resource-Error'] = err.message;
            cb(err, data, res);
        })
    }
}

async function regValidate(requestUrl) {
    var tmpPath, tmpHeader, fileType
    var rules = config.rules

    for (var options of rules) {
        var rule = options['test']
        var func = options['fn']
        if (typeof rule == 'string') {
            rule = minimatch.makeRe(rule)
        }
        if (rule.test(requestUrl)) {
            tmpPath = await func.call(config, requestUrl)
            tmpHeader = {
                'Content-Type': mimeType(tmpPath),
                'Access-Control-Allow-Origin': '*'
            }
            fileType = path.extname(tmpPath).substr(1)
            break
        }
    }

    return {tmpPath, tmpHeader, fileType}
}

function mimeType(url) {
    if (url.match(/\.html/)) {
        return 'text/html;charset=UTF-8'
    } else if (url.match(/\.js/)) {
        return 'application/javascript; charset=utf-8'
    } else if (url.match(/\.css/)) {
        return 'text/css; charset=utf-8'
    } else if (url.match(/\.(woff|ttf|eot|otf)/)) {
        return 'text/plain'
    } else if (url.match(/\.png/)) {
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

function filterRequest(requestUrl, res) {
    if (requestUrl.indexOf('/msdownload/') != -1) {
        console.log('filter request', requestUrl);
        res.writeHead(403);
        res.end();
        return false
    }
    return true
}

process.on('uncaughtException', function (err) {
    console.log('process error', err);
});

httpServer.listen(port, function () {
    console.log('http server listen on %d', port)
});

httpsServer.listen(httpsPort, function () {
    console.log('https server listen on %d', httpsPort)
});