const express = require('express');
const app = express();
const path = require('path');
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');

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

io.on('connection', (socket) => {
    socket.on('disconnect', () => {
        console.log('The user at ' + socket.id + ' disconnected.');
        //Remove from list of clients
        let index = findWithAttr(clients, 'id', socket.id);
        clients.splice(index, 1);
        io.emit('updateUsers', clients);
    });

    console.log('A user at ' + socket.id + ' connected.');
    io.emit('updateUsers', clients);
    clients.push({
        id: socket.id,
        name: null,
        story: null,
        points: 0,
    });
    
    socket.on('gameStart', () => {
        if (clients.length != 1) {
            io.emit('wakeUp');
            io.emit('sendTheme', themes[Math.floor(Math.random()*themes.length)]);
        }
    });

    socket.on('name', (name) => {
        let index = findWithAttr(clients, 'id', socket.id);
        clients[index].name = name;
        io.emit('updateUsers', clients);
    });

    socket.on('story', (story) => {
        let index = findWithAttr(clients, 'id', socket.id);
        clients[index].story = story;
        usersComplete+=1;
        const namedClients = getNamedClients(clients);
        if (usersComplete==namedClients.length) {
            io.emit('storyComplete', clients);
            usersComplete = 0;
        }
    });

    socket.on('points', id => {
        let index = findWithAttr(clients, 'id', id);
        clients[index].points += 1;
        io.emit('updateUsers', clients);
    });
});

http.listen(process.env.PORT || 3001, function() {
    console.log('Now listening on port 3001');
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