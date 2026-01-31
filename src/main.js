import './fb.js';
import './style.css';

// This entry point ensures styles are loaded and the game script runs.
console.log("Flappy Bird Loaded");

// Handle potential SPA Fallback for Settings Page
if (window.location.pathname === '/game/setting') {
    window.location.href = '/game/setting/';
}
