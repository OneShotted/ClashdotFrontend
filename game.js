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

startButton.onclick = () => {
  const input = usernameInput.value.trim();
  if (input) {
    if (input.includes('#')) {
      const [name, key] = input.split('#');
      if (key === '1627') {
        isDev = true;
      }
      playerName = name;
    } else {
      playerName = input;
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
    socket.send(JSON.stringify({ type: 'register', name: playerName, isDev }));
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'id') {
      playerId = data.id;
    } else if (data.type === 'update') {
      allPlayers = data.players;
    } else if (data.type === 'chat') {
      const msg = document.createElement('div');
      msg.textContent = `${data.name}: ${data.message}`;
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

document.addEventListener('keydown', (e) => {
  if (!playerId || !socket || socket.readyState !== WebSocket.OPEN) return;
  const key = e.key.toLowerCase();

  const movement = {
    'arrowup': 'up', 'w': 'up',
    'arrowdown': 'down', 's': 'down',
    'arrowleft': 'left', 'a': 'left',
    'arrowright': 'right', 'd': 'right'
  };

  if (movement[key]) {
    socket.send(JSON.stringify({ type: 'move', key: movement[key] }));
  }
});

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
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fillStyle = id === playerId ? 'blue' : 'red';
    ctx.fill();

    ctx.fillStyle = 'black';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.name, x, y - 30);
  }

  requestAnimationFrame(draw);
}

draw();

// Dev Panel Functions
function teleport() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'dev', action: 'teleport', x: Math.random() * 1000, y: Math.random() * 1000 }));
  }
}

function kickPlayer() {
  const name = document.getElementById('kick-name').value;
  if (name) {
    socket.send(JSON.stringify({ type: 'dev', action: 'kick', targetName: name }));
  }
}

function broadcast() {
  const message = document.getElementById('broadcast-msg').value;
  if (message) {
    socket.send(JSON.stringify({ type: 'dev', action: 'broadcast', message }));
  }
}

