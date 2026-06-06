# Introduction
This repository is a challenge that I, Breezist, put onto myself to see what I could really do with nothing but the built-in Node.js modules! Essentially, the goal was the recreate [Express.js](https://expressjs.com/en/) *with* native WebSocket support! To accomplish this, I extensively used the ``node:http``, ``node:events``, and ``node:crypto`` built-in modules 

# Installation
No external dependencies are needed to run this project! This means that as long as you have a modern version of Node.js installed, you should be able to run this project right out of the box! 

1. Install [Node.js](https://nodejs.org/en/download) version v22.19.0 or above.
2. Download [this repository](https://github.com/Breezist/Recreating-Express.js)'s source! Extract the contents wherever you like.
3. ``cd`` into the extracted directory
4. Run ``npm run start``

# Features
* Dependency-free; this repository was built entirely using Node.js' built-in modules,
* Express.js-style routing; supports the ``GET``, ``POST``, ``PUT``, and ``DELETE`` apis,
* middleware support,
* native websocket support,
* cookie setting and parsing,
* JSON-based body parsing,
* static files,
* session handling,
* and events!
  
# Compatibility
This project was created using the following:
```
Node.js v22.19.0
npm 11.6.1
```

# Examples
```js
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
```

# Testing
I provided some unit tests inside of ``http/testing``. Please run ``npm run test`` to see whether this project is functional!

# License
This repository is under the [MIT License](https://github.com/Breezist/Recreating-Express.js?tab=MIT-1-ov-file)!
