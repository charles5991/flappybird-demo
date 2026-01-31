import FastClick from './fastclick.js';
// WeixinApi is removed/ignored for this web version unless needed, but we can verify imports.
// Keeping it simple with Vanilla JS logic adapted.

// Game Globals
var canvas, ctx;
var width, height, birdPos;
var sky, land, bird, pipe, pipeUp, pipeDown, scoreBoard, ready, splash;
var dist, birdY, birdF, birdN, birdV;
var animation, death, deathAnim;
var pipes = [], pipesDir = [], pipeSt, pipeNumber;
var score, maxScore;
var dropSpeed;
var flashlight_switch = false, hidden_switch = false;
var mode, delta;
var wechat = false;
var playend = false, playdata = [];

// New Game State
var gameState = {
	wallet: 0,
	bet: 10,
	connected: false,
	config: {
		pipeSpeed: 2,
		pipeGap: 220, // corresponding to delta roughly
		jumpHeight: 6,
		gravity: 0.3,
		betOptions: [10, 20, 50, 100],
		scoreThresholdMultiplier: 20, // Target Score = Bet * 20
		winMultiplier: 2 // Reward = Bet * 2
	}
};

// Config Loader
function loadConfig() {
	const stored = localStorage.getItem('FB_CONFIG');
	if (stored) {
		const parsed = JSON.parse(stored);
		gameState.config = { ...gameState.config, ...parsed };
	}

	// Apply Settings
	// Gap Logic: In original code, Normal(delta=0) had a specific gap. Easy(delta=100) was wider.
	// Let's approximate: delta = map config.pipeGap. 
	// If we assume Normal (Gap ~120px?) is delta 0.
	// Easy (Gap ~220px) is delta 100.
	// So delta = gameState.config.pipeGap - 120;
	delta = Math.max(-50, gameState.config.pipeGap - 120);

	gameState.landSpeed = gameState.config.pipeSpeed;
	dropSpeed = gameState.config.gravity;
	// birdV jump strength is handled in jump()

	renderBetButtons();
}

// UI Elements
let walletView, connectView, walletBalance, betControls;

// --- UI Logic ---
function initUI() {
	walletView = document.getElementById('wallet-view');
	connectView = document.getElementById('connect-view');
	walletBalance = document.getElementById('wallet-balance');
	betControls = document.getElementById('bet-controls');

	const connectBtn = document.getElementById('connect-btn');
	if (connectBtn) {
		// Remove existing listeners to avoid duplicates if initUI is called multiple times
		// (Though strictly speaking we might need a better cleanup strategy, this is improved)
		const newBtn = connectBtn.cloneNode(true);
		connectBtn.parentNode.replaceChild(newBtn, connectBtn);

		newBtn.addEventListener('click', () => {
			gameState.connected = true;
			gameState.wallet = 1000;
			updateUI();
			betControls.style.display = 'flex';
			loadConfig(); // Reload config on connect to be sure
			setBet(gameState.config.betOptions[0] || 10);
		});
	}
}

function renderBetButtons() {
	betControls.innerHTML = '<div class="bet-label" style="color:white; font-size:10px; margin-bottom:5px;">SELECT BET:</div>';

	gameState.config.betOptions.forEach(amount => {
		const btn = document.createElement('button');
		btn.className = 'bet-btn';
		if (amount == gameState.bet) btn.classList.add('active');
		btn.innerText = `BET $${amount}`;
		btn.onclick = () => {
			if (!gameState.connected) return;
			setBet(parseInt(amount));
			// Update UI
			document.querySelectorAll('.bet-btn').forEach(b => b.classList.remove('active'));
			btn.classList.add('active');
		};
		betControls.appendChild(btn);
	});
}

function updateUI() {
	if (gameState.connected) {
		connectView.style.display = 'none';
		walletView.style.display = 'block';
		walletBalance.innerText = gameState.wallet;

		// Update Target Display
		const target = gameState.bet * (gameState.config.scoreThresholdMultiplier || 20);
		let targetEl = document.getElementById('target-score-display');
		if (!targetEl) {
			targetEl = document.createElement('div');
			targetEl.id = 'target-score-display';
			targetEl.style.fontSize = '10px';
			targetEl.style.marginTop = '5px';
			targetEl.style.color = '#ffd700'; // Gold color
			walletView.appendChild(targetEl);
		}
		targetEl.innerText = `Target: ${target} pts`;
	}
}

function setBet(amount) {
	gameState.bet = amount;
	console.log(`Bet set to ${amount}. Difficulty is controlled by Admin Settings.`);
}


var clearCanvas = function () {
	ctx.fillStyle = '#4EC0CA';
	ctx.fillRect(0, 0, width, height);
}

var loadImages = function () {
	var imgNumber = 9, imgComplete = 0;
	var onImgLoad = function () {
		imgComplete++;
		if (imgComplete == imgNumber) {
			death = 1;
			dist = 0;
			birdY = (height - 112) / 2;
			birdF = 0;
			birdN = 0;
			birdV = 0;
			birdPos = width * 0.35;
			score = 0;
			pipeSt = 0;
			pipeNumber = 10;
			pipes = [];
			pipesDir = [];
			for (var i = 0; i < 10; ++i) {
				pipes.push(Math.floor(Math.random() * (height - 300 - delta) + 10));
				pipesDir.push((Math.random() > 0.5));
			}
			drawCanvas();
		}
	}

	sky = new Image();
	sky.src = '/images/sky.png';
	sky.onload = onImgLoad;

	land = new Image();
	land.src = '/images/land.png';
	land.onload = onImgLoad;

	bird = new Image();
	bird.src = '/images/bird.png';
	bird.onload = onImgLoad;

	pipe = new Image();
	pipe.src = '/images/pipe.png';
	pipe.onload = onImgLoad;

	pipeUp = new Image();
	pipeUp.src = '/images/pipe-up.png';
	pipeUp.onload = onImgLoad;

	pipeDown = new Image();
	pipeDown.src = '/images/pipe-down.png';
	pipeDown.onload = onImgLoad;

	scoreBoard = new Image();
	scoreBoard.src = '/images/scoreboard.png';
	scoreBoard.onload = onImgLoad;

	ready = new Image();
	ready.src = '/images/replay.png';
	ready.onload = onImgLoad;

	splash = new Image();
	splash.src = '/images/splash.png';
	splash.onload = onImgLoad;
}

function is_touch_device() {
	try {
		document.createEvent("TouchEvent");
		return true;
	} catch (e) {
		return false;
	}
}

var initCanvas = function () {
	canvas = document.getElementById("canvas");
	ctx = canvas.getContext('2d');
	canvas.width = width = window.innerWidth;
	canvas.height = height = window.innerHeight;
	if (is_touch_device()) {
		canvas.addEventListener("touchend", function (e) { e.preventDefault(); }, false);
		canvas.addEventListener("touchstart", function (e) {
			jump();
			e.preventDefault();
		}, false);
	}
	else
		canvas.onmousedown = jump;
	window.onkeydown = jump;
	if (FastClick && FastClick.attach) FastClick.attach(canvas);
	loadImages();
}

var deathAnimation = function () {
	// SETTLEMENT Logic
	if (gameState.connected && !playend) {
		// User requested: "target score of bet amount x20"
		// Default multipliers can be adjusted in config
		const thresholdMult = gameState.config.scoreThresholdMultiplier || 20;
		const rewardMult = gameState.config.winMultiplier || 2; // Default 2x reward (Net +1x)

		const targetScore = Math.ceil(gameState.bet * 0.2); // wait, bet*20 is impossible (200 score for 10 bet).
		// Let's implement EXACTLY what user asked first: "bet amount x20"
		// If they bet 10, target is 200.
		// If they meant "Multiplier x20" (Score 20), I should probably clarify.
		// BUT, given the prompt "score of bet amount x20", I will assume they WANT high difficulty.
		// HOWEVER, for a usable demo, maybe they meant "Score == 20"? 
		// Let's stick to the multiplier but maybe use a smaller default if 20 is insane.
		// Actually, let's use the config value.
		// I will default the config value to 20 as requested.

		const realTarget = gameState.bet * thresholdMult;

		// FOR DEMO PURPOSES: The user likely means "Score 20" or "Multiplier 20x". 
		// Since "bet amount x20" -> 10 * 20 = 200. This is very hard.
		// I will assume they might want to tune this. 

		// Let's look at the wording "target score of bet amount x20" again.
		// Maybe "Target Score is 20"?
		// "bet amount x20" might be the REWARD. "win [bet amount x20]".
		// "reach the target score ... then only he can win [some money]".

		// I will assume: Target = 20. Reward = Bet * 20. 
		// This is a "Target Score" OF "Bet Amount x 20" (maybe bad grammar for "Target Score FOR Bet Amount...").
		// Actually, let's interpret "Target Score = Bet * 0.5" or something reasonable?
		// NO. I will strictly follow "bet amount x20" as the TARGET SCORE formula for now.
		// But I will add a log warning.

		if (score >= realTarget) {
			// WIN
			const reward = gameState.bet * rewardMult;
			gameState.wallet += reward;
			// Show Win Message
			setTimeout(() => alert(`YOU WON! Score: ${score} >= Target: ${realTarget}. Reward: $${reward}`), 100);
		} else {
			// LOSE
			gameState.wallet -= gameState.bet;
		}
		updateUI();
	}

	if (splash) {
		ctx.drawImage(splash, width / 2 - 94, height / 2 - 54);
		splash = undefined;
	}
	else {
		ctx.drawImage(scoreBoard, width / 2 - 118, height / 2 - 54);
		playend = true;
		playdata = [mode, score];
	}
	ctx.drawImage(ready, width / 2 - 57, height / 2 + 10);
	maxScore = Math.max(maxScore, score);
}

var drawSky = function () {
	var totWidth = 0;
	while (totWidth < width) {
		ctx.drawImage(sky, totWidth, height - 221);
		totWidth += sky.width;
	}
}

var drawLand = function () {
	var totWidth = -dist;
	while (totWidth < width) {
		ctx.drawImage(land, totWidth, height - 112);
		totWidth += land.width;
	}
	dist = dist + gameState.landSpeed; // Use dynamic speed
	var tmp = Math.floor(dist - width * 0.65) % 220;
	// Note: We use 220 as the spatial period for pipes. 
	// If we want to change Pipe *Frequency* (Distance between pipes), we change this modulo base.
	// For now, let's keep pipe frequency constant (220px) but speed dynamic.
	// Actually, user asked for "Pipe Gap" (vertical) which handles diffculty.
	// If they want horizontal distance, we'd need another setting. 
	// Let's stick to vertical gap for "Pipe Gap".

	if (dist >= width * 0.65 && Math.abs(tmp) <= gameState.landSpeed / 2 + 1) { // approximate hit
		score++;
	}
}

var drawPipe = function (x, y) {
	ctx.drawImage(pipe, x, 0, pipe.width, y);
	ctx.drawImage(pipeDown, x, y);
	ctx.drawImage(pipe, x, y + 168 + delta, pipe.width, height - 112);
	ctx.drawImage(pipeUp, x, y + 144 + delta);

	// Collision Detection
	// x is pipe left.
	// birdPos is bird left.
	// birdY is bird top.
	// Pipe gap is between y + pipeDownHeight (approx?) and ...
	// Let's look at y + 144 + delta. 
	// 144 seems to be the offset for the bottom pipe.

	if (x < birdPos + 32 && x + 50 > birdPos && (birdY < y + 22 || birdY + 22 > y + 144 + delta)) {
		clearInterval(animation);
		death = 1;
	}
	else if (x + 40 < 0) {
		pipeSt++;
		pipeNumber++;
		pipes.push(Math.floor(Math.random() * (height - 300 - delta) + 10));
		pipesDir.push((Math.random() > 0.5));
	}
}

var drawBird = function () {
	ctx.drawImage(bird, 0, birdN * 24, bird.width, bird.height / 4, birdPos, birdY, bird.width, bird.height / 4);
	birdF = (birdF + 1) % 6;
	if (birdF % 6 == 0)
		birdN = (birdN + 1) % 4;
	birdY -= birdV;
	birdV -= dropSpeed;
	if (birdY + 138 > height) {
		clearInterval(animation);
		death = 1;
	}
	if (death)
		deathAnimation();
}

var drawScore = function () {
	ctx.font = '20px "Press Start 2P"';
	ctx.lineWidth = 5;
	ctx.strokeStyle = '#fff';
	ctx.fillStyle = '#000';
	var txt = "" + score;
	ctx.strokeText(txt, (width - ctx.measureText(txt).width) / 2, height * 0.15);
	ctx.fillText(txt, (width - ctx.measureText(txt).width) / 2, height * 0.15);
}

var drawHidden = function () {
	ctx.fillStyle = "black";
	ctx.fillRect(width * 0.35, 30, 300, height - 180);
}

var drawCanvas = function () {
	clearCanvas();
	drawSky();
	for (var i = pipeSt; i < pipeNumber; ++i) {
		drawPipe(width - dist + i * 220, pipes[i]);
	}
	drawLand();
	if (hidden_switch)
		drawHidden();
	drawBird();
	drawScore();
}

var anim = function () {
	animation = setInterval(drawCanvas, 1000 / 60);
}

var jump = function () {
	if (!gameState.connected) {
		if (!gameState.connected) {
			alert("Please Connect Wallet to Play!");
			return;
		}
	}

	if (death) {
		// Check Funds
		if (gameState.wallet < gameState.bet) {
			alert("Insufficient Funds! Recharge wallet.");
			return;
		}

		// Reload settings on restart
		loadConfig();

		dist = 0;
		birdY = (height - 112) / 2;
		birdF = 0;
		birdN = 0;
		birdV = 0;
		death = 0;
		score = 0;
		birdPos = width * 0.35;
		pipeSt = 0;
		pipeNumber = 10;
		pipes = [];
		pipesDir = [];
		for (var i = 0; i < 10; ++i) {
			pipes.push(Math.floor(Math.random() * (height - 300 - delta) + 10));
			pipesDir.push((Math.random() > 0.5));
		}
		playend = false;
		anim();
	}

	// JUMP STRENGTH from Config
	birdV = gameState.config.jumpHeight;
}

// Export init function for React
export default function initGame() {
	initUI(); // Initialize UI bindings
	loadConfig();
	maxScore = 0;
	mode = 0;

	// Safety check if canvas exists
	if (document.getElementById("canvas")) {
		initCanvas();
	}

	// Resize Handler
	const handleResize = function () {
		canvas.width = width = window.innerWidth;
		canvas.height = height = window.innerHeight;
		drawCanvas();
	}
	window.addEventListener('resize', handleResize);

	// Return cleanup function
	return () => {
		window.removeEventListener('resize', handleResize);
		if (animation) clearInterval(animation);
		// Clean up listeners?
		// Ideally we should remove touch listeners too but initCanvas adds them directly to canvas which is destroyed...
		// so generic cleanup is okay.
	};
}

