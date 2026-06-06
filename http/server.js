/**
░▄▀▄░█▀▄░█▀▄░█▀▀░█▀▀░▀▀█░▀█▀░█▀▀░▀█▀
░█▀▀░█▀▄░█▀▄░█▀▀░█▀▀░▄▀░░░█░░▀▀█░░█░
░░▀░░▀▀░░▀░▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░░▀░                                                      
 * @file server.js
 * @author Breezist
 * @since June 5th, 2026
 * @description The server.js file is the file that handles all-things server related.
 * @exports httpServer
 */
import http from 'node:http';
import url from 'node:url';
import path from 'node:path';

import fs from 'node:fs';
import assert from 'node:assert';
import {EventEmitter} from 'node:events';

import {parseJson} from '#util/jsonParser.js';
import {parseCookies, setCookie} from '#util/cookies.js';
import {loadSession} from '#util/sessions.js';
import {tryStatic} from '#util/static.js';
import {getMime} from '#util/mime.js';

import {matchRoute, matchSubdomain} from '#core/router.js';
import {handleWebSocketUpgrade, webSocketTools} from '#core/websockets.js';

/**
 * @callback routeHandler
 * @param {IncomingMessage} req - The client's request to enter a page
 * @param {ServerResponse} res - The server's response to the request
 */

/**
 * @class httpServer
 * @description The httpServer class is responsible for the creation of Express.js-like http servers. The difference primarily being that these support WebSockets natively.
 */
export class httpServer extends EventEmitter {
    /**
     * Costructs a new httpServer object.
     */
    constructor() {
        super();
        this.server = http.createServer(this.handleRequest.bind(this));
        this.routes = {GET: [], POST: [], PUT: [], DELETE: []};
        this.middlewares = []; this.staticDirs = []; this.sessions = {};

        this.websockets = new Set();
        this.websocketMap = new Map();

        this.subdomains = {};

        handleWebSocketUpgrade(this.server, this);

        this.on(`ws:connect`, ws => {
            this.websockets.add(ws);
            this.websocketMap.set(ws.id, ws);
            ws.on(`disconnect`, () => {
                this.websockets.delete(ws);
                this.websocketMap.delete(ws.id);
            });
        });

        this.on(`error`, (err, req, res) => {
            console.error(err);
            res.status(500).send(`Internal Server Error`);
        });
    }

    /*
        HTTP Features
    */
    /**
     * @param {Function} middleware - The middleware to use in the server application.
     */
    use(middleware) {
        assert.strictEqual(typeof middleware, `function`, `Middleware must be a function`);
        this.middlewares.push(middleware)
    };

    get(path, handler) {this.routes.GET.push({path, handler})};
    post(path, handler) {this.routes.POST.push({path, handler})};
    put(path, handler) {this.routes.PUT.push({path, handler})};
    delete(path, handler) {this.routes.DELETE.push({path, handler})}
    static(dir) {this.staticDirs.push(dir)};

    subdomain(name, callback) {
        if (!this.subdomains[name]) {
            this.subdomains[name] = {GET: [], POST: [], PUT: [], DELETE: []};
        }

        const router = {
            get: (path, handler) => this.subdomains[name].GET.push({path, handler}),
            post: (path, handler) => this.subdomains[name].POST.push({path, handler}),
            put: (path, handler) => this.subdomains[name].PUT.push({path, handler}),
            delete: (path, handler) => this.subdomains[name].DELETE.push({path, handler}),
        };

        callback(router);
    }

    /*
        WebSocket Features
    */
    sendTo(id, message) {return webSocketTools.sendTo(this, id, message)}
    broadcast(message) {return webSocketTools.broadcast(this, message)}
    broadcastExcept(id, message) {return webSocketTools.broadcastExcept(this, id, message)}

    /**
     * @param {Number} port - The port to listen to. 
     * @returns The server, emits `listen` when ready.
     */
    listen(port = 3000) {
        assert.ok(this.server, `The server must exist before it can listen!`);
        return this.server.listen(port, () => {
            this.server.emit(`listen`, port);
        });
    }
    
    /**
     * @param {http.IncomingMessage} req - The client's request.
     * @param {http.ServerResponse} res - The response from the server. 
     */
    async handleRequest(req, res) {
        const host = req.headers.host || ``;
        const parts = host.split(`.`);
        req.subdomain = parts.length > 2 ? parts[0] : null;

        res.status = code => (res.statusCode = code, res);
        res.send = data => {
            if (typeof data === `object`) {
                res.setHeader(`Content-Type`, `application/json`);
                res.end(JSON.stringify(data));
            } else res.end(String(data));
        };

        res.setCookie = (key, value, options = {}) => {
            setCookie(res, key, value, options);
        };

        res.sendFile = filePath => {
            const stream = fs.createReadStream(filePath);
            stream.on(`error`, () => res.status(404).end(`File not found`));
            res.setHeader(`Content-Type`, getMime(path.extname(filePath).slice(1)));
            stream.pipe(res);
        };

        res.json = obj => {
            res.setHeader(`Content-Type`, `application/json`);
            res.end(JSON.stringify(obj));
        };

        const parsed = url.parse(req.url, true);
        req.pathname = parsed.pathname;
        req.query = parsed.query;

        req.cookies = parseCookies(req);
        loadSession(req, res, this.sessions);
        if ([`POST`, `PUT`, `PATCH`].includes(req.method)) {
            await parseJson(req);
        }

        let i = 0;
        const next = () => {
            if (i < this.middlewares.length) {
                const middleware = this.middlewares[i++];
                let called = false;
                return middleware(req, res, () => {
                    if (called) return;
                    called = true;
                    next();
                });
            }

            const subKey = matchSubdomain(req.subdomain, this.subdomains);
            if (subKey) {
                const subRoutes = this.subdomains[subKey];
                const route = matchRoute(subRoutes, req.method, req.pathname);

                if (route) {
                    req.params = route.params;
                    return Promise.resolve(route.handler(req, res)).catch(err => {
                        this.emit(`error`, err, req, res);
                    });
                }
            }

            const route = matchRoute(this.routes, req.method, req.pathname);
            if (route) {
                req.params = route.params;
                return Promise.resolve(route.handler(req, res)).catch(err => {
                    this.emit(`error`, err, req, res);
                });
            }
            if (tryStatic(req, res, this.staticDirs)) return;
            return res.status(404).end(`Not found!`);
        };

        next();
    }
}