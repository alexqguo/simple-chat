'use strict';

let io = require('./index');
let users = {};

io.on('connection', (socket) => {
    var username;

    socket.on('login', (data, cb) => {
        username = data.name;
        users[username] = {
            username: username,
            message: null
        };

        cb(true);
        printUsers(io.engine.clientsCount);
        io.sockets.emit('users_update', users);
    });

    socket.on('ready', (data) => {
        // Todo: sanitize!
        users[username].message = data.message;
        console.log(data);
        console.log(users);

        checkAllUsersForReady();
    });

    socket.on('disconnect', () => {
        console.log('disconnect');
        delete users[username];

        printUsers(io.engine.clientsCount);
        io.sockets.emit('users_update', users);
    });
});

function checkAllUsersForReady() {
    for (var key in users) {
        if (!users[key].message) {
            return;
        }
    }

    releaseUsers();
}

function releaseUsers() {
    // Should really just be messages and not complete user data but oh well, currently that's all there is
    io.sockets.emit('release', users);

    // Clear messages for everyone
    for (var key in users) {
        users[key].message = null;
    }
}

function printUsers(clientCount) {
    console.log(users);
    console.log(clientCount + '\n');
}
