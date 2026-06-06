/**
░▄▀▄░█▀▄░█▀▄░█▀▀░█▀▀░▀▀█░▀█▀░█▀▀░▀█▀
░█▀▀░█▀▄░█▀▄░█▀▀░█▀▀░▄▀░░░█░░▀▀█░░█░
░░▀░░▀▀░░▀░▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░░▀░                                                      
 * @file websockets.js
 * @author Breezist
 * @since June 5th, 2026
 * @description A core file responsible for the creation of Websocket clients!
 * @exports handleWebSocketUpgrade, websocketTools
 */
import crypto from 'node:crypto';

let websocketGuid = `258EAFA5-E914-47DA-95CA-C5AB0DC85B11` // RFC6455, https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.websockets.protocol.handshakehelpers.createresponsekey

function generateAcceptValue(secWebSocketKey) {
    return crypto.createHash(`sha1`)
        .update(`${secWebSocketKey}${websocketGuid}`, `binary`)
        .digest(`base64`);
}

/**
 * @param {String} secWebSocketKey - The key sent by the client during upgrade.
 * @returns {String} A base64-encoded SHA1 hash used to validate the handshake.
 */
function createWebSocketConnection(socket) {
    const ws = new webSocketConnection(socket);
    return ws;
}

/**
 * @param {Socket} socket - The raw TCP socket after upgrade.
 * @returns {webSocketConnection} A wrapped WebSocket connection instance.
 */
export function handleWebSocketUpgrade(server, emitter) {
    server.on(`upgrade`, (req, socket, head) => {
        const key = req.headers[`sec-websocket-key`];
        const upgrade = req.headers[`upgrade`];

        if (!key || upgrade.toLowerCase() !== `websocket`) {
            socket.destroy();
            return;
        }

        const acceptKey = generateAcceptValue(key);
        const headers = [
            `HTTP/1.1 101`, `Upgrade: websocket`,
            `Connection: Upgrade`, `Sec-WebSocket-Accept: ${acceptKey}`
        ];

        socket.write(headers.join(`\r\n`) + `\r\n\r\n`);
        const ws = createWebSocketConnection(socket);
        emitter.emit(`ws:connect`, ws);
    });
}


/**
 * @param {Server} server - The HTTP server to attach upgrade listeners to.
 * @param {EventEmitter} emitter - Emits `ws:connect` when a client connects.
 */
export const webSocketTools = {
    /**
     * @param {Object} server - The server instance containing websocketMap.
     * @param {String} id - The WebSocket client's unique ID.
     * @param {String|Object} message - The message to send.
     * @returns {Boolean} Whether the message was successfully delivered.
     */
    sendTo(server, id, message) {
        const ws = server.websocketMap.get(id);
        if (!ws) return false;
        ws.send(message);
        return true;
    },

    /**
     * @param {Object} server - The server instance containing a Set of websockets.
     * @param {String|Object} message - The message to broadcast.
     */
    broadcast(server, message) {
        for (const ws of server.websockets) {
            ws.send(message);
        }
    },

    /**
     * @param {Object} server - The server instance.
     * @param {String} id - The ID of the client to exclude.
     * @param {String|Object} message - The message to broadcast.
     */
    broadcastExcept(server, id, message) {
        for (const ws of server.websockets) {
            if (ws.id !== id) {
                ws.send(message);
            }
        }
    }
}

/**
 * @class webSocketConnection
 */
class webSocketConnection {
    /**
    * @param {Socket} socket - The raw TCP socket.
    */
    constructor(socket) {
        this.socket = socket;
        this.handlers = {message: [], close: [], error: [], disconnect: []};
        this.id = crypto.randomUUID().toString();
        this.socket.on(`data`, this.handleData.bind(this));
        this.socket.on(`close`, () => this.emit(`disconnect`));
        this.socket.on(`error`, err => this.emit(`error`, err));
    }

    /**
     * @param {'message'|'close'|'error'|'disconnect'} event - The event name.
     * @param {Function} handler - The callback to invoke.
     */
    on(event, handler) {
        if (this.handlers[event]) {
            this.handlers[event].push(handler);
        }
    }

    /**
     * @param {String} event - The event name.
     * @param {any} data - Optional event data.
     */
    emit(event, data) {
        if (this.handlers[event]) {
            for (const fn of this.handlers[event]) fn(data);
        }
    }

    /**
     * @param {String|Object} message - The message to send.
     */
    send(message) {
        const msgBuffer = Buffer.from(String(message));
        const frame = createFrame(msgBuffer);
        this.socket.write(frame);
    }

    close() {
        this.socket.end();
    }

    /**
     * @param {Buffer} buffer - The raw frame buffer.
     */
    handleData(buffer) {
        const msg = parseFrame(buffer);
        if (!msg) return;
        if (msg.type === `close`) {
            this.socket.end();
            return;
        }

        if (msg.type === `text`) {
            let data = msg.data;
            try {
                data = JSON.parse(data);
                console.log(data)
            } catch {}

            this.emit(`message`, data);
        }
    }
}

/**
 * @param {Buffer} payload - The message payload.
 */
function createFrame(payload) {
    const payloadLen = payload.length;
    const frame = [];
    frame.push(0x81);
    if (payloadLen <= 125) {
        frame.push(payloadLen);
    } else if (payloadLen < 65536) {
        frame.push(126, (payloadLen >> 8) & 0xff, payloadLen & 0xff);
    } else {
        throw new Error(`Payload too large`);
    }
    return Buffer.concat([Buffer.from(frame), payload]);
}

/**
 * @param {Buffer} buffer - The raw frame buffer.
 */
function parseFrame(buffer) {
    if (buffer.length < 2) return null;

    const firstByte = buffer[0];
    const secondByte = buffer[1];

    const opcode = firstByte & 0x0f;
    const isMasked = (secondByte & 0x80) === 0x80;
    let payloadLen = secondByte & 0x7f;
    let offset = 2;

    if (payloadLen === 126) {
        payloadLen = (buffer[2] << 8) | buffer[3];
        offset += 2;
    } else if (payloadLen === 127) {
        return null;
    }

    let maskingKey;
    if (isMasked) {
        maskingKey = buffer.slice(offset, offset + 4);
        offset += 4;
    }

    const payload = buffer.slice(offset, offset + payloadLen);

    if (isMasked) {
        for (let i = 0; i < payload.length; i++) {
            payload[i] ^= maskingKey[i % 4];
        }
    }

    switch (opcode) {
        case 0x1: 
            return {type: `text`, data: payload.toString(`utf8`)};
            break;
        case 0x8:
            return {type: `close`};
            break;
        default:
            return null;
            break;
    }
}
