const express = require('express');
const app = express();
const path = require('path');
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const events = require('../src/events');

var clients = []; 

var usersComplete = 0;

let themes;
fs.readFile(path.join(__dirname, './themes.json'), 'utf-8', (error, data) => {
    if(error) {
        console.log("Error loading themes.json");
    } else {
        themes = JSON.parse(data);
    }
});

app.use(express.static(path.join(__dirname, '../build')));

app.get('/', function(req, res) {
    res.send("<h1>If you've reached this page it means something broke!</h1>");
});

io.on(events.ServerEvents.CONNECTION, (socket) => {
    socket.on(events.ClientEvents.DISCONNECT, () => {
        console.log('The user at ' + socket.id + ' disconnected.');
        //Remove from list of clients
        let index = findWithAttr(clients, 'id', socket.id);
        clients.splice(index, 1);
        io.emit(events.ServerEvents.UPDATE_USERS, clients);
    });

    console.log('A user at ' + socket.id + ' connected.');
    io.emit(events.ServerEvents.UPDATE_USERS, clients);
    clients.push({
        id: socket.id,
        name: null,
        story: null,
        points: 0,
    });
    
    socket.on(events.ClientEvents.GAME_START, () => {
        if (clients.length != 1) {
            io.emit(events.ServerEvents.WAKE_UP);
            io.emit(events.ServerEvents.SEND_THEME, themes[Math.floor(Math.random()*themes.length)]);
        }
    });

    socket.on(events.ClientEvents.NAME, (name) => {
        let index = findWithAttr(clients, 'id', socket.id);
        clients[index].name = name;
        io.emit(events.ServerEvents.UPDATE_USERS, clients);
    });

    socket.on(events.ClientEvents.STORY, (story) => {
        let index = findWithAttr(clients, 'id', socket.id);
        clients[index].story = story;
        usersComplete+=1;
        const namedClients = getNamedClients(clients);
        if (usersComplete==namedClients.length) {
            io.emit(events.ServerEvents.STORY_COMPLETE, clients);
            usersComplete = 0;
        }
    });

    socket.on(events.ClientEvents.POINTS, id => {
        let index = findWithAttr(clients, 'id', id);
        clients[index].points += 1;
        io.emit(events.ServerEvents.UPDATE_USERS, clients);
    });
});

http.listen(5000, function() {
    console.log('The server is now listening.');
});

function getNamedClients(clients) {
    return clients.filter(c => c.name !== null);
}

// https://stackoverflow.com/questions/7176908/how-to-get-index-of-object-by-its-property-in-javascript/54015295
const findWithAttr = (array, attr, value) => {
    for(var i = 0; i < array.length; i += 1) {
        if(array[i][attr] === value) {
            return i;
        }
    }
    return -1;
}