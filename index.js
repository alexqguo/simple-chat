'use strict';

let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = module.exports = require('socket.io')(http);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.use('/static', express.static('public'));

http.listen(7777, () => {
    console.log('Listening on 7777');
});

require('./messages');
