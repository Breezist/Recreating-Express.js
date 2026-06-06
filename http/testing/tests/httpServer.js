/**
░▄▀▄░█▀▄░█▀▄░█▀▀░█▀▀░▀▀█░▀█▀░█▀▀░▀█▀
░█▀▀░█▀▄░█▀▄░█▀▀░█▀▀░▄▀░░░█░░▀▀█░░█░
░░▀░░▀▀░░▀░▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░░▀░                                                      
 * @file httpServer.js
 * @author Breezist
 * @since June 5th, 2026
 * @description A unit tester responsible for ensuring http server creation runs `smoooooth-operata!`
 */
console.group(`httpServer.js`);

import assert from 'node:assert';
import {describe, it} from 'node:test';
import http, { Server } from 'node:http';
import {performance} from 'node:perf_hooks';

import {httpServer} from '#http/server.js';

let start = performance.now();

describe(`server creation`, () => {
    it(`should create a server instance`, () => {
        let app = new httpServer();
        assert.ok(app.server, `app.server should exist`);
        assert.ok(app.server instanceof Server, `app.server should be an instance of Server`);
    });

    it(`should initialize core properties`, () => {
        let app = new httpServer();
        assert.ok(Array.isArray(app.middlewares));
        assert.ok(Array.isArray(app.routes.GET));
        assert.ok(app.websockets instanceof Set);
    });
});

describe(`http`, () => {
    it(`should match GET routes`, async () => {
        let app = new httpServer();
        let hit = false;
        app.get(`/test`, (req, res) => { hit = true; res.end(); });
        const req = new http.IncomingMessage();
        req.method = `GET`; req.url = `/test`;
        const res = new http.ServerResponse(req);
        res.end = () => {};
        await app.handleRequest(req, res);
        assert.ok(hit);
    });
    
    it(`should extract route params`, async () => {
        const app = new httpServer();
        let receivedParams = null;

        app.get(`/user/:id`, (req, res) => {
            receivedParams = req.params;
            res.end();
        });

        const req = new http.IncomingMessage();
        req.method = `GET`;
        req.url = `/user/123`;

        const res = new http.ServerResponse(req);
        res.end = () => {};

        await app.handleRequest(req, res);

        assert.deepStrictEqual(receivedParams, { id: `123` });
    });

    it(`should run middlewares in order`, async () => {
        const app = new httpServer();
        const calls = [];
        app.use((req, res, next) => { calls.push(1); next(); });
        app.use((req, res, next) => { calls.push(2); next(); });

        const req = new http.IncomingMessage();
        const res = new http.ServerResponse(req);
        res.end = () => {};

        process.nextTick(() => {
            req.emit('end');
        });

        await app.handleRequest(req, res);
        assert.deepStrictEqual(calls, [1, 2]);
    });
});

describe(`subdomains`, () => {
    it(`should match subdomain GET routes`, async () => {
        const app = new httpServer();
        let hit = false;

        app.subdomain(`api`, api => {
            api.get(`/test`, (req, res) => {
                hit = true;
                res.end();
            });
        });

        const req = new http.IncomingMessage();
        req.method = `GET`;
        req.url = `/test`;
        req.headers = { host: `api.example.com` };

        const res = new http.ServerResponse(req);
        res.end = () => {};
        await app.handleRequest(req, res);
        assert.ok(hit, `Subdomain route should have been hit`);
    });

    it(`should not match subdomain routes on main domain`, async () => {
        const app = new httpServer();
        let hit = false;
        app.subdomain(`api`, api => {
            api.get(`/test`, (req, res) => {
                hit = true;
                res.end();
            });
        });

        const req = new http.IncomingMessage();
        req.method = `GET`;
        req.url = `/test`;
        req.headers = { host: `example.com` }; // no subdomain

        const res = new http.ServerResponse(req);
        res.end = () => {};

        await app.handleRequest(req, res);

        assert.strictEqual(hit, false, `Subdomain route should NOT match on main domain`);
    });

    it(`should fall back to normal routes when subdomain route not found`, async () => {
        const app = new httpServer();
        let hit = false;
        app.get(`/test`, (req, res) => {
            hit = true;
            res.end();
        });

        const req = new http.IncomingMessage();
        req.method = `GET`;
        req.url = `/test`;
        req.headers = { host: `api.example.com` };
        const res = new http.ServerResponse(req);
        res.end = () => {};
        await app.handleRequest(req, res);
        assert.ok(hit, `Normal route should be used when subdomain route missing`);
    });
});

describe(`websockets`, () => {
    it(`should broadcast messages to all websockets`, () => {
        const app = new httpServer();
        const ws1 = { send: msg => ws1.msg = msg };
        const ws2 = { send: msg => ws2.msg = msg };
        app.websockets.add(ws1);
        app.websockets.add(ws2);
        app.broadcast(`hello`);
        assert.strictEqual(ws1.msg, `hello`);
        assert.strictEqual(ws2.msg, `hello`);
    });
});

describe(`server listening`, () => {
    it(`should listen on a port`, () => {
        const app = new httpServer();
        app.listen(0);
        app.server.on(`listening`, () => {
            app.server.close();
        });
    });
});

function assertBetween(value, min, max, msg) {
  assert.ok(value >= min && value <= max, msg);
};

describe(`response time`, () => {
  it(`should measure total test time`, () => {
    return new Promise(resolve => {
      const start = performance.now();

      const app = new httpServer();
      app.get('/ping', (req, res) => res.end('pong'));

      app.listen(0);
      app.server.on('listening', () => {
        const port = app.server.address().port;

        http.get(`http://localhost:${port}/ping`, res => {
          res.on('data', () => {});
          res.on('end', () => {
            const end = performance.now();
            const total = end - start;
            assertBetween(total, 16, 23, `Hello!`);
            app.server.close(() => resolve());
          });
        });
      });
    });
  });
});

console.groupEnd();