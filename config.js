/**
 * Created by loutao on 2017/3/14.
 */

const url = require('url')
const path = require('path')
const fs = require('fs')
const localPath = '/Users/challenget/Documents/kaola-community-web/src/main/resources/web/dist/'

module.exports = {
    rules: [
        {
            // http://community.kaola.com/web/js/app.96b82519fcfa4ace1c7e.js
            // Users/challenget/Documents/kaola-community-web/src/main/resources/web/dist/web/js/app.fccad70d558b786f1b13.js
            test: '**/*/web/js/*',      // can be node-glob or regexp
            async fn(remoteUrl) {       // should return a path
                let obj = url.parse(remoteUrl)
                let {pathname} = obj
                let basename = path.basename(pathname)
                let jsFileName = basename.split('.')[0]
                let dir = path.join(localPath, path.dirname(pathname))
                let files = await new Promise(resolve => {
                    fs.readdir(dir, (err, files) => resolve(files))
                })

                for (let file of files) {
                    if (file.indexOf(jsFileName) > -1) {
                        return path.join(dir, file)
                    }
                }
            }
        }
    ]
}

