'use strict';

let io = require('./index');
let xss = require('xss');
let users = {};

io.on('connection', (socket) => {
    var username;

    socket.on('login', (data, cb) => {
        var sanitizedName = xss(data.name);

        if (isValidUsername(sanitizedName)) {
            username = sanitizedName;

            users[username] = {
                username: username,
                message: null
            };

            cb(true);
            printUsers(io.engine.clientsCount);
            io.sockets.emit('all_users', users);
        } else {
            cb(false);
        }
    });

    socket.on('ready', (data) => {
        // Todo: sanitize!
        users[username].message = xss(data.message);
        console.log(data);
        console.log(users);

        checkAllUsersForReady();
    });

    socket.on('get_users', () => {
        io.sockets.emit('users_update', users);
    });

    socket.on('disconnect', () => {
        console.log('disconnect');
        delete users[username];

        printUsers(io.engine.clientsCount);
        io.sockets.emit('users_update', users);
        checkAllUsersForReady();
    });
});

function checkAllUsersForReady() {
    for (var key in users) {
        var message = users[key].message;

        if (typeof(message) === 'undefined' || message === null) {
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

function isValidUsername(username) {
    return !!username && typeof(users[username]) === 'undefined';
}
