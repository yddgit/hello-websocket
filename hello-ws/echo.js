const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
const wss = new WebSocketServer({
    port: 3000
});

wss.on('connection', function (ws) {
    console.log(`[SERVER] connection()`);
    ws.on('message', function (message) {
        console.log(`[SERVER] Received: ${message}`);
        ws.send(`ECHO: ${message}`, (error) => {
            if(error) {
                console.log(`[SERVER] error: ${error}`);
            }
        });
    });
});

console.log('ws server started as port 3000');
