const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
const wss = new WebSocketServer({
    port: 3000
});
// 在connection事件中, 回调函数会传入一个WebSocket实例表示这个WebSocket连接
// 这里响应connection事件时并未检查请求的路径，因此客户端可以写任意的路径。实际应用中需要根据不同的路径实现不同的功能
wss.on('connection', function (ws) {
    console.log(`[SERVER] connection()`);
    // 对于每个WebSocket连接都要对它绑定某些事件方法来处理不同的事件
    // 这里是响应message事件
    ws.on('message', function (message) {
        console.log(`[SERVER] Received: ${message}`);
        setTimeout(() => {
            if(ws.readyState !== 3) {
                ws.send(`What's your name?`, (error) => {
                    if(error) {
                        console.log(`[SERVER] error: ${error}`);
                    }
                });
            } else {
                wss.close();
            }
        }, 1000);
    });
});

console.log('ws server started at port 3000...');

// client test

let count = 0;
const ws = new WebSocket('ws://localhost:3000/ws/chat');

// 打开连接后立刻发送一条消息
ws.on('open', function () {
    console.log(`[CLIENT] open()`);
    ws.send('Hello!');
});

// 响应收到的消息
ws.on('message', function (message) {
    console.log(`[CLIENT] Received: ${message}`);
    count++;
    if(count > 3) {
        ws.send('Goodbye');
        ws.close();
    } else {
        setTimeout(() => {
            ws.send(`Hello, I'm MR. No.${count}!`);
        }, 1000);
    }
});
