const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const WebSocket = require('ws');
const url = require('url');
const Cookies = require('cookies');
const controller = require('./controller');
const templating = require('./templating');

const isProduction = process.env.NODE_ENV === 'production';

const app = new Koa();

// log request URL
app.use(async (ctx, next) => {
    console.log(`Process ${ctx.request.method} ${ctx.request.url}`);
    var
        start = new Date().getTime(),
        execTime;
    await next();
    execTime = new Date().getTime() - start;
    ctx.response.set('X-Response-Time', `${execTime}`);
});

// parse user from cookies
app.use(async (ctx, next) => {
    ctx.state.user = parseUser(ctx.cookies.get('name') || '');
    await next();
});

// 生产环境静态文件是由部署在最前面的反向代理服务器处理的, node程序不需要处理静态文件
// 在开发环境下我们希望koa能顺带处理静态文件
if(!isProduction) {
    let staticFiles = require('./static-files');
    app.use(staticFiles('/static/', __dirname + '/static'));
}

app.use(bodyParser());

// 集成nunjucks
app.use(templating('views', {
    noCache: !isProduction,
    watch: !isProduction
}))

// add router middleware
app.use(controller());

let server = app.listen(3000);

function parseUser(obj) {
    if(!obj) {
        return;
    }
    console.log('try parse: ' + obj);
    let s = '';
    if(typeof obj === 'string') {
        s = obj;
    } else if(obj.headers) {
        let cookies = new Cookies(obj, null);
        s = cookies.get('name');
    }
    if(s) {
        try {
            let user = JSON.parse(Buffer.from(s, 'base64').toString());
            console.log(`User: ${user.name}, ID: ${user.id}`);
            return user;
        } catch(e) {
            // ignore
        }
    }
}

function createWebSocketServer(server, onConnection, onMessage, onClose, onError) {
    let wss = new WebSocket.Server({
        server: server
    });
    wss.broadcast = function broadcast(data) {
        wss.clients.forEach(function (client) {
            client.send(data);
        });
    };
    onConnection = onConnection || function() {
        console.log('[WebSocket] connected.');
    };
    onMessage = onMessage || function(msg) {
        console.log('[WebSocket] message received: ' + msg);
    };
    onClose = onClose || function(code, message) {
        console.log(`[WebSocket] closed: ${code} - ${message}`);
    };
    onError = onError || function(error) {
        console.log('[WebSocket] error: ' + error);
    };
    wss.on('connection', function(ws, req) {
        ws.upgradeReq = req;
        let location = url.parse(ws.upgradeReq.url, true);
        console.log('[WebSocketServer] connection: ' + location.href);
        ws.on('message', onMessage);
        ws.on('close', onClose);
        ws.on('error', onError);
        if(location.pathname !== '/ws/chat') {
            // close ws
            ws.close(4000, 'Invalid URL');
        }
        // check user
        let user = parseUser(ws.upgradeReq);
        if(!user) {
            ws.close(4001, 'Invalid user');
        }
        ws.user = user;
        ws.wss = wss;
        onConnection.apply(ws);
    });
    console.log('WebSocketServer was attached.');
    return wss;
}

var messageIndex = 0;

function createMessage(type, user, data) {
    messageIndex++;
    return JSON.stringify({
        id: messageIndex,
        type: type,
        user: user,
        data: data,
    });
}

function onConnect() {
    let user = this.user;
    let msg = createMessage('join', user, `${user.name} joined.`);
    this.wss.broadcast(msg);
    // build user list;
    let users = Array.from(this.wss.clients).map(function(client) {
        return client.user;
    });
    this.send(createMessage('list', user, users));
}

function onMessage(message) {
    console.log(message);
    if(message && message.trim()) {
        let msg = createMessage('chat', this.user, message.trim());
        this.wss.broadcast(msg);
    }
}

function onClose() {
    let user = this.user;
    let msg = createMessage('left', user, `${user.name} is left.`);
    this.wss.broadcast(msg);
}

app.wss = createWebSocketServer(server, onConnect, onMessage, onClose);

console.log('app started at port 3000...');
