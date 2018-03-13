var http = require('http');
var https = require('https');
const dns = require('dns')

module.exports =  function request(options, body, cb, isHttps) {

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
