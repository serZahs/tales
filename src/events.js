
const ServerEvents = {
    CONNECTION: 'connection',

    // Custom events
    UPDATE_PLAYERS: 'UpdatePlayers',
    WAKE_UP: 'WakeUp',
    SEND_THEME: 'SendTheme',
    STORY_COMPLETE: 'StoryComplete',
    HOME: 'Home'
};

const ClientEvents = {
    DISCONNECT: 'disconnect',

    // Custom events
    GAME_START: 'GameStart',
    NAME: 'Name',
    STORY: 'Story',
    POINTS: 'Points',
    RESET: 'Reset'
};

module.exports = {
    ServerEvents,
    ClientEvents
};