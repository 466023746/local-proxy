module.exports = function filterRequest(requestUrl, res) {
    if (requestUrl.indexOf('/msdownload/') != -1) {
        console.log('filter request', requestUrl);
        res.writeHead(403);
        res.end();
        return false
    }
    return true
}