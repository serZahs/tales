
const ServerEvents = {
    CONNECTION: 'connection',

    // Custom events
    UPDATE_USERS: 'UpdateUsers',
    WAKE_UP: 'WakeUp',
    SEND_THEME: 'SendTheme',
    STORY_COMPLETE: 'StoryComplete'
};

const ClientEvents = {
    DISCONNECT: 'disconnect',

    // Custom events
    GAME_START: 'GameStart',
    NAME: 'Name',
    STORY: 'Story',
    POINTS: 'Points'
};

module.exports = {
    ServerEvents,
    ClientEvents
};