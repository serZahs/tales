import { useEffect, useState } from 'react';
import './App.css';
import socketIOClient from 'socket.io-client';
const socket = socketIOClient(process.env.REACT_APP_BACKEND_URL + ':' + process.env.REACT_APP_PORT);


function SideBar() {
    let [clients, setClients] = useState([]);
    useEffect(() => {
        socket.on('updateUsers', clients => {
            setClients(clients);
        });
    });
    const namedClients = clients.filter(c => c.name !== null);
    const listItems = namedClients.map(c =>
        <li key={c.id}>
            <div className='player-name'>{c.name}</div>
            {c.points > 0 ? 
                <div className='points'>{c.points}</div> 
                : 
                <div className='points'>0</div>
            }
        </li>
    );
    return (
        <div className='sidebar'>
            <h2>Online</h2>
            {listItems.length != 0 ?
                <ul className='players'>{listItems}</ul>
                :
                <p style={{textAlign:'center'}}>Nobody is ready to play yet.</p>
            }
        </div>
    );
}

function StartGame() {
    function handleClick() {
        socket.emit('gameStart');
    }
    return (
        <input type="button" value="Start" onClick={handleClick} className='button-primary' />
    );
}

function NameForm() {
    let [name, setName] = useState('');
    function handleChange(event) {
        setName(event.target.value);
    }
    function handleSubmit(event) {
        socket.emit('name', name);
        event.preventDefault();
    }
    return (
        <form onSubmit={handleSubmit} className='name-form'>
            <label className='label'>Enter a name:</label>
            <input type='text' value={name} onChange={handleChange} className='text-input' 
                required placeholder='LettuceForLunch' maxLength='18' />
            <input type='submit' value='Join' className='button-voting' />
        </form>
    );
}

function Theme() {
    let [theme, setTheme] = useState(null);
    useEffect(() => {
        socket.on('sendTheme', (data) => {
            setTheme(data);
        });
    });

    return (
        <div className='theme-section'>
            <h1>Theme:</h1>
            <div className='theme'>{theme}</div>
            
        </div>
    );
}

function StoryForm() {
    let [value, setValue] = useState('');
    let [disabled, setDisabled] = useState(false);
    function handleChange(event) {
        setValue(event.target.value);
    }
    function handleSubmit(event) {
        socket.emit('story', value);
        setDisabled(true);
        event.preventDefault();
    }
    return (
        <form onSubmit={handleSubmit} className='story-form'>
            <label className='label'>Exercise your imagination here:</label>
            {!disabled ? 
                <textarea value={value} onChange={handleChange} className='text-area' required />
                :
                <textarea value={value} onChange={handleChange} className='text-area' disabled />
            }
            <input type="submit" className='button-primary' />
        </form>
    )
}

function Voting({ clients, newRound }) {
    let [disabled, setDisabled] = useState(false);
    useEffect(() => {
        socket.on('wakeUp', () => {
            newRound();
        });
    });

    function handleVoteClick(id) {
        setDisabled(true);
        socket.emit('points', id);
    }
    function handleNewRoundClick() {
        socket.emit('gameStart');
    }
    return (
        <div className='voting'>
            <h1>Results</h1>
            <ul className='results'>
                {clients.filter(c => c.name !== null).map(c => 
                    <li key={c.id}>
                        <div className='story-details'>
                            <label className='label'>{c.name}</label>
                            {!disabled ? 
                                <input type='button' value='Vote' onClick={() => handleVoteClick(c.id)} className='button-voting' />
                                :
                                <input type='button' value='Vote' className='button-voting' disabled />
                            }
                        </div>
                        <p class='story'>{c.story}</p>
                    </li>
                )}
            </ul>
            <input type='button' value='New round' onClick={handleNewRoundClick} className='button-primary' />
        </div>
    );
}

function GameScreen() {
    let [voting, setVoting] = useState(false);
    let [clients, setClients] = useState([]);
    useEffect(() => {
        socket.on('storyComplete', clients => {
            setClients(clients);
            startVoting();
        });
        socket.on('wakeUp', () => {
            newRound();
        });
    });
    function newRound() {
        setVoting(false);
    }
    function startVoting() {
        setVoting(true);
    }
    if (voting) {
        return (
            <div className='game'>
                <Voting clients={clients} newRound={newRound} />
            </div> 
        );
    } else {
        return (
            <div className='game'>
                <Theme />
                <StoryForm />
            </div>
        );
    }
}

function HomeScreen() {
    return (
        <div className='home'>
            <h1 className='title'>Tales</h1>
            <h2 className='subtitle'>A Storytelling game</h2>
            <div className='home-content'>
                <NameForm />
                <div className='rules'>
                    <h2>How to Play</h2>
                    <div>
                        <p>
                            It's all about trying to write the funniest story.
                            Everyone gets the same theme, so your storytelling abilities
                            are what matter.
                        </p>
                        <p>
                            Start by picking a name. 
                            At least two players need to have joined to start a game.
                        </p>
                    </div>
                </div>
            </div>
            <StartGame />
        </div>
    );
}

function MainScreen({ gameHidden }) {
    return (
        <div className='main'>
            {gameHidden ? <HomeScreen /> : <GameScreen />}
        </div>
    );
}

export default function MyApp() {
    let [gameHidden, setGameHidden] = useState(true);
    useEffect(() => {
        socket.on('wakeUp', () => {
            setGameHidden(false);
        });
    });
    return (
        <div className='container'>
            <SideBar />
            <MainScreen gameHidden={gameHidden} />
        </div>
    );
}