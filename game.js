const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let socket;
let playerId = null;
let allPlayers = {};
let playerName = '';
let isDev = false;

const usernameScreen = document.getElementById('username-screen');
const usernameInput = document.getElementById('username-input');
const startButton = document.getElementById('start-button');
const chatContainer = document.getElementById('chat-container');
const chatLog = document.getElementById('chat-log');
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat');

const devPanel = document.getElementById('dev-panel');
const devPlayerList = document.getElementById('dev-player-list');
const broadcastInput = document.getElementById('broadcast-input');
const broadcastBtn = document.getElementById('broadcast-btn');

startButton.onclick = () => {
  const rawName = usernameInput.value.trim();
  if (rawName) {
    if (rawName.includes('#1627')) {
      isDev = true;
      playerName = rawName.replace('#1627', '');
    } else {
      playerName = rawName;
    }

    usernameScreen.style.display = 'none';
    chatContainer.style.display = 'flex';
    if (isDev) devPanel.style.display = 'block';
    initSocket();
  }
};

function initSocket() {
  socket = new WebSocket('wss://websocket-vavu.onrender.com');

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'register', name: playerName + (isDev ? '#1627' : '') }));
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'id') {
      playerId = data.id;
    } else if (data.type === 'update') {
      allPlayers = data.players;
      if (isDev) updateDevPanel();
    } else if (data.type === 'chat') {
      const msg = document.createElement('div');
      if (data.isBroadcast) {
        msg.classList.add('red-message');
        msg.textContent = data.message;
      } else {
        msg.textContent = `${data.name}: ${data.message}`;
      }
      chatLog.appendChild(msg);
      chatLog.scrollTop = chatLog.scrollHeight;
    }
  };
}

sendChatBtn.onclick = () => {
  const message = chatInput.value.trim();
  if (message && socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'chat', message }));
    chatInput.value = '';
  }
};

function updateDevPanel() {
  devPlayerList.innerHTML = '';
  for (const id in allPlayers) {
    const p = allPlayers[id];
    const div = document.createElement('div');
    div.textContent = `${p.name} (${id})`;

    const kickBtn = document.createElement('button');
    kickBtn.textContent = 'Kick';
    kickBtn.onclick = () => {
      socket.send(JSON.stringify({ type: 'devCommand', command: 'kick', targetId: id }));
    };

    const tpBtn = document.createElement('button');
    tpBtn.textContent = 'TP';
    tpBtn.onclick = () => {
      socket.send(JSON.stringify({ type: 'devCommand', command: 'teleport', targetId: id, x: 100, y: 100 }));
    };

    div.appendChild(kickBtn);
    div.appendChild(tpBtn);
    devPlayerList.appendChild(div);
  }
}

broadcastBtn.onclick = () => {
  const msg = broadcastInput.value.trim();
  if (msg) {
    socket.send(JSON.stringify({ type: 'devCommand', command: 'broadcast', message: msg }));
    broadcastInput.value = '';
  }
};

// Key state tracking
const keys = { up: false, down: false, left: false, right: false };

document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'arrowup' || key === 'w') keys.up = true;
  if (key === 'arrowdown' || key === 's') keys.down = true;
  if (key === 'arrowleft' || key === 'a') keys.left = true;
  if (key === 'arrowright' || key === 'd') keys.right = true;
});

document.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'arrowup' || key === 'w') keys.up = false;
  if (key === 'arrowdown' || key === 's') keys.down = false;
  if (key === 'arrowleft' || key === 'a') keys.left = false;
  if (key === 'arrowright' || key === 'd') keys.right = false;
});

function gameLoop() {
  if (playerId && socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'movementState',
      keys
    }));
  }
  requestAnimationFrame(gameLoop);
}
gameLoop();

function drawGrid(camX, camY) {
  const gridSize = 50;
  ctx.strokeStyle = '#c3d6be';
  for (let x = -camX % gridSize; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = -camY % gridSize; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!playerId || !allPlayers[playerId]) {
    requestAnimationFrame(draw);
    return;
  }

  const me = allPlayers[playerId];
  const camX = me.x - canvas.width / 2;
  const camY = me.y - canvas.height / 2;

  ctx.fillStyle = '#b7e2b2';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(camX, camY);

  for (const id in allPlayers) {
    const p = allPlayers[id];
    const x = p.x - camX;
    const y = p.y - camY;

    ctx.beginPath();
    if (p.isDev) {
      ctx.moveTo(x, y - 20);
      ctx.lineTo(x - 20, y + 20);
      ctx.lineTo(x + 20, y + 20);
      ctx.closePath();
      ctx.fillStyle = 'blue';
      ctx.fill();
    } else {
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fillStyle = id === playerId ? 'blue' : 'red';
      ctx.fill();
    }

    ctx.fillStyle = 'black';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.name, x, y - 30);
  }

  requestAnimationFrame(draw);
}
draw();


