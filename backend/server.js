"use strict";

const express = require('express');
const app = express();
const path = require('path');
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const fs = require('fs');
const events = require('../src/events');

class Client {
    constructor(id, name, story, points) {
        this.id = id;
        this.name = name;
        this.story = story;
        this.points = points;
    }
}

function HandleConnections() {
    let clients = [];
    let usersComplete = 0;

    io.on(events.ServerEvents.CONNECTION, (socket) => {
        socket.on(events.ClientEvents.DISCONNECT, () => {
            console.log(`${socket.id} disconnected.`);
            //Remove from list of clients
            let index = FindByProperty(clients, 'id', socket.id);
            clients.splice(index, 1);
            io.emit(events.ServerEvents.UPDATE_USERS, clients);
        });

        console.log(`${socket.id} connected.`);
        io.emit(events.ServerEvents.UPDATE_USERS, clients);
        clients.push(new Client(
            socket.id,
            null,
            null,
            0
        ));
        
        socket.on(events.ClientEvents.GAME_START, () => {
            if (clients.length != 1) {
                io.emit(events.ServerEvents.WAKE_UP);
                io.emit(events.ServerEvents.SEND_THEME, themes[Math.floor(Math.random()*themes.length)]);
            }
        });

        socket.on(events.ClientEvents.NAME, (name) => {
            let index = FindByProperty(clients, 'id', socket.id);
            clients[index].name = name;
            io.emit(events.ServerEvents.UPDATE_USERS, clients);
        });

        socket.on(events.ClientEvents.STORY, (story) => {
            let index = FindByProperty(clients, 'id', socket.id);
            clients[index].story = story;
            usersComplete+=1;
            const namedClients = GetNamedClients(clients);
            if (usersComplete==namedClients.length) {
                io.emit(events.ServerEvents.STORY_COMPLETE, clients);
                usersComplete = 0;
            }
        });

        socket.on(events.ClientEvents.POINTS, id => {
            let index = FindByProperty(clients, 'id', id);
            clients[index].points += 1;
            io.emit(events.ServerEvents.UPDATE_USERS, clients);
        });
    });
}

function Main() {
    const static_path = path.join(__dirname, '../build');
    const themes_path = path.join(__dirname, './themes.json');

    let themes = [];
    fs.readFile(themes_path, 'utf-8', (error, data) => {
        if(error) {
            throw new Error("Could not load themes.json");
        } else {
            themes = JSON.parse(data);
        }
    });
    
    app.use(express.static(static_path));

    app.get('/', function(req, res) {
        res.send("<h1>If you've reached this page it means something broke!</h1>");
    });

    http.listen(5000, function() {
        console.log('The server is now listening.');
    });

    HandleConnections();
}

Main();

function GetNamedClients(clients) {
    return clients.filter(c => c.name !== null);
}

function FindByProperty(array, attr, value) {
    for(let i = 0; i < array.length; i++) {
        if(array[i][attr] === value) {
            return i;
        }
    }
    return -1;
}