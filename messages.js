'use strict';

let io = require('./index');
let users = {};

io.on('connection', (socket) => {
    var username;
    // socket.on('chat message', (msg) => {
    //     socket.broadcast.emit('');
    //     io.emit('chat message', msg);
    // });
    //
    // socket.on('disconnect', () => {
    //     console.log('someone disconnected');
    // });
    socket.on('login', (data, cb) => {
        username = data.name;
        users[username] = username;

        cb(true);
        printUsers(io.engine.clientsCount);
        io.emit('new_user', users);
    });

    socket.on('disconnect', () => {
        console.log('disconnect');
        delete users[username];

        printUsers(io.engine.clientsCount);
        // need to determine which user to drop
    });
});

function printUsers(clientCount) {
    console.log(users);
    console.log(clientCount + '\n');
}
