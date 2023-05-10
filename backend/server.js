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

class GameState {
    constructor(themes, players, players_done) {
        this.themes = themes;
        this.players = players;
        this.players_done = players_done; 
    }
}

function HandleConnections(game_state) {
    let players = game_state.players;

    io.on(events.ServerEvents.CONNECTION, (socket) => {
        socket.on(events.ClientEvents.DISCONNECT, () => {
            console.log(`${socket.id} disconnected.`);
            let index = FindByProperty(players, 'id', socket.id);
            if (index != -1) {
                players.splice(index, 1);
                io.emit(events.ServerEvents.UPDATE_PLAYERS, players);
            }
        });

        console.log(`${socket.id} connected.`);
        if (players.length > 0) {
            io.emit(events.ServerEvents.UPDATE_PLAYERS, players);
        }
        
        socket.on(events.ClientEvents.GAME_START, () => {
            if (players.length > 0) {
                io.emit(events.ServerEvents.WAKE_UP);
                io.emit(events.ServerEvents.SEND_THEME, GetTheme(game_state));
            }
        });

        socket.on(events.ClientEvents.NAME, (name) => {
            let index = FindByProperty(players, 'id', socket.id);
            if (index != -1) {
                players[index].name = name;
            } else {
                players.push(new Client(
                    socket.id,
                    name,
                    null,
                    0
                ));
            }
            io.emit(events.ServerEvents.UPDATE_PLAYERS, players);
        });

        socket.on(events.ClientEvents.STORY, (story) => {
            let index = FindByProperty(players, 'id', socket.id);
            players[index].story = story;
            game_state.players_done++;

            if (game_state.players_done == players.length) {
                io.emit(events.ServerEvents.STORY_COMPLETE, players);
                game_state.players_done = 0;
            }
        });

        socket.on(events.ClientEvents.POINTS, id => {
            let index = FindByProperty(players, 'id', id);
            players[index].points += 1;
            io.emit(events.ServerEvents.UPDATE_PLAYERS, players);
        });

        socket.on(events.ClientEvents.RESET, () => {
            players.forEach(c => {
                c.story = null;
                c.points = 0;
            });
            io.emit(events.ServerEvents.UPDATE_PLAYERS, players);
            io.emit(events.ServerEvents.HOME);
        });
    });
}

function Main() {
    const static_path = path.join(__dirname, '../build');
    const themes_path = path.join(__dirname, './themes.json');

    let game_state = new GameState([], [], 0);

    fs.readFile(themes_path, 'utf-8', (error, data) => {
        if(error) {
            throw new Error("Could not load themes.json");
        } else {
            game_state.themes = JSON.parse(data);
        }
    });
    
    app.use(express.static(static_path));

    app.get('/', function(req, res) {
        res.send("<h1>If you've reached this page it means something broke!</h1>");
    });

    http.listen(5000, function() {
        console.log('The server is now listening.');
    });

    HandleConnections(game_state);
}

Main();

function GetTheme(game_state) {
    let themes = game_state.themes;
    return themes[Math.floor(Math.random()*themes.length)];
}

function FindByProperty(array, attr, value) {
    for(let i = 0; i < array.length; i++) {
        if(array[i][attr] === value) {
            return i;
        }
    }
    return -1;
}