# proxy-local
proxy static file to local, nonmatched url will through the proxy

# Installation
```bash
npm i proxy-local --save-dev
```

# Usage
1、start your server
```js
const localProxy = require('proxy-local')

const httpRules = [
  {
    // http://www.tt.com/web/js/tt.js => /Users/path/to/file.js
    test: '**/*/web/**/*',      // can be node-glob or regexp
    async fn(remoteUrl) {       // should return a local path
      return '/Users/path/to/file.js'
    }
  }
]

const httpsRules = httpRules

const httpOptions = {
  port: '',             // http port, default 3000
  httpsPort: '',        // https port, default 3001, it must be same to the httpsOptions port
  rules: httpRules
}

const httpsOptions = {
  port: '',             // https port, default 3001
  rules: httpsRules
}

let httpServer = new localProxy.httpServer(httpOptions)
let httpsServer = new localProxy.httpsServer(httpsOptions)

httpServer.start()
httpsServer.start()
```
2、setup your browser proxy
- auto, support an option for auto set proxy
```js
const httpOptions = {
  autoSetProxy: true
}

const httpsOptions = {
    autoSetProxy: true
}
```
- manual, change your browser proxy by yourself
    - http proxy port => httpOptions port
    - https proxy port => httpOptions port ( https should go the http server )

# Note
if you need https local proxy, you also need to open chrome with ignore-certificate-error args
```bash
// windos
chrome --args --ignore-certificate-errors
// mac
open /Applications/Google\ Chrome.app --args --ignore-certificate-errors
```