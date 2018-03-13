var fs = require('fs');
var path = require('path');
var url = require('url');
var https = require('https');
var request = require('./request')
var regValidate = require('./regValidate')
var filterRequest = require('./filterRequest')

module.exports = class httpsServer {
    constructor(options) {
        this.options = options || {}
        this.sslOptions = {
            key: fs.readFileSync(path.join(__dirname, './challenget.win.key')),
            cert: fs.readFileSync(path.join(__dirname, './2_challenget.win.crt'))
        }
        this.normalize()
    }

    normalize() {
        this.port = this.options.port || 3001
        this.rules = this.options.rules || []
    }

    start() {
        var self = this

        var httpsServer = https.createServer(this.sslOptions, function (req, res) {
            var reqChunk = [], reqChunkLen = 0;

            req.on('data', function (chunk) {
                reqChunk.push(chunk);
                reqChunkLen += chunk.length;
            });

            req.on('end', async function () {

                var body = Buffer.concat(reqChunk, reqChunkLen);
                var requestUrl = 'https://' + req.headers['host'] + req.url;
                var {tmpPath, tmpHeader, fileType} = await regValidate(requestUrl, self);

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

                                // request(options, body, function (err2, data2, obj) {
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

                    request(options, body, function (err, data, obj) {
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

        httpsServer.listen(this.port, function () {
            console.log('https server listen on %d', self.port)
        });
    }
}