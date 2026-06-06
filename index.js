/**
░▄▀▄░█▀▄░█▀▄░█▀▀░█▀▀░▀▀█░▀█▀░█▀▀░▀█▀
░█▀▀░█▀▄░█▀▄░█▀▀░█▀▀░▄▀░░░█░░▀▀█░░█░
░░▀░░▀▀░░▀░▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░░▀░                                                      
 * @file index.js
 * @author Breezist
 * @since June 5th, 2026
 * @description The entry-point file for demonstrating http server creation and using WebSockets.  
 */
import {httpServer} from '#http/server.js';

const app = new httpServer();
app.static(`./public`);

app.use((req, res, next) => {
    console.log(`Hello from a middleware, ${req.method} ${req.url}!`);
    next();
});

app.get(`/cookies`, async(req, res) => {
    res.status(200).send(JSON.stringify(req.cookies));
});

app.get(`/setcookies`, async(req, res) => {
    res.setCookie(`foo`, `bar`);
    res.status(200).send(JSON.stringify(req.cookies))
});

app.post(`/login`, (req, res) => {
    console.log(req.session)
    const {username, password} = req.body;
    if (!username || !password) {
      return res.status(400).send(`Missing properties`);
    }
    res.send(`Hello, ${username}! This is where the application would do its login hocus-pocus`);
    req.session.username = username;
});

app.get(`/json`, async(req, res) => {
    res.status(200).send({"foo": "bar"});
});

app.get(`/html`, async(req, res) => {
    res.status(200).sendFile(`public/index.html`)
});

app.subdomain(`test`, test => {
    test.get(`/`, (req, res) => res.send(`You are at the 'test' subdomain!`));
});

app.on(`ws:connect`, ws => {
    ws.send(`Hello, ${ws.id}!`)
    ws.on(`message`, data => {
        console.log(`Message from client:`, data);
    });
    ws.on(`error`, err => {
        console.error(`Websocket error:`, err);
    });
    ws.on(`disconnect`, () => {
        console.log(`Websocket disconnected`);
    });
});

app.listen(3000).on(`listen`, function(port) {  
    console.log(`The server is listening on port ${port}!`)
});