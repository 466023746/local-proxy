var minimatch = require('minimatch')
var path = require('path')
var mimeType = require('./mimeType')

module.exports = async function regValidate(requestUrl, server) {
    var tmpPath, tmpHeader, fileType
    var rules = server.rules

    for (var options of rules) {
        var rule = options['test']
        var func = options['fn']
        if (typeof rule == 'string') {
            rule = minimatch.makeRe(rule)
        }
        if (rule.test(requestUrl)) {
            tmpPath = await func.call(server, requestUrl)
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