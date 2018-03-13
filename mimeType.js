module.exports = function mimeType(url) {
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
