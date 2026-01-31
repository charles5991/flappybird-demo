import React, { useEffect } from 'react';
import { history } from 'umi';
import '@/style.css';
import initGame, { setGameUI } from '@/fb.js';

export default function GamePage() {

    useEffect(() => {
        // Inject global window refs that might be needed by legacy FastClick or others
        // Initialize Game
        const cleanup = initGame();
        return cleanup;
    }, []);

    return (
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <canvas id="canvas">Your browser is too old.</canvas>

            <div id="ui-layer">
                <div id="wallet-container" className="interactive">
                    <div id="connect-view">
                        <button id="connect-btn">Connect Wallet</button>
                    </div>
                    <div id="wallet-view" style={{ display: 'none' }}>
                        Wallet: $<span id="wallet-balance">0</span>
                    </div>
                </div>

                <div id="bet-controls" className="interactive" style={{ display: 'none' }}>
                    <div className="bet-label" style={{ color: 'white', fontSize: '10px', marginBottom: '5px' }}>SELECT BET:</div>
                    {/* Dynamic Buttons injected by fb.js or render manual here if we refactor fb.js completely */}
                </div>

                <a
                    onClick={() => history.push('/game/setting')}
                    className="interactive"
                    style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px',
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '10px',
                        textDecoration: 'none',
                        cursor: 'pointer'
                    }}
                >
                    Admin Settings
                </a>
            </div>
        </div>
    );
}
