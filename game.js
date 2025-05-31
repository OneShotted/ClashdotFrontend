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
  playerName = usernameInput.value.trim();
  if (playerName) {
    isDev = playerName.includes('#1627');
    usernameScreen.style.display = 'none';
    chatContainer.style.display = 'flex';
    if (isDev) devPanel.style.display = 'block';
    initSocket();
  }
};

function initSocket() {
  socket = new WebSocket('wss://websocket-vavu.onrender.com');

  socket.onopen = () => {
    socket.send(JSON.stringify({ type: 'register', name: playerName }));
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
  if (message && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'chat', message }));
    chatInput.value = '';
  }
};

document.addEventListener('keydown', (e) => {
  if (!playerId || socket.readyState !== WebSocket.OPEN) return;

  const key = e.key.toLowerCase();
  if (['arrowup', 'w'].includes(key)) socket.send(JSON.stringify({ type: 'move', key: 'up' }));
  if (['arrowdown', 's'].includes(key)) socket.send(JSON.stringify({ type: 'move', key: 'down' }));
  if (['arrowleft', 'a'].includes(key)) socket.send(JSON.stringify({ type: 'move', key: 'left' }));
  if (['arrowright', 'd'].includes(key)) socket.send(JSON.stringify({ type: 'move', key: 'right' }));
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

// ----- DEV COMMANDS -----
function sendDevCommand(command, payload = {}) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'devCommand', command, ...payload }));
  }
}

document.getElementById('kick-player-btn').onclick = () => {
  const id = document.getElementById('kick-id').value.trim();
  if (id) sendDevCommand('kick', { targetId: id });
};

document.getElementById('teleport-player-btn').onclick = () => {
  const id = document.getElementById('teleport-id').value.trim();
  const x = parseInt(document.getElementById('teleport-x').value.trim()) || 300;
  const y = parseInt(document.getElementById('teleport-y').value.trim()) || 300;
  if (id) sendDevCommand('teleport', { targetId: id, x, y });
};

document.getElementById('broadcast-btn').onclick = () => {
  const msg = document.getElementById('broadcast-msg').value.trim();
  if (msg) sendDevCommand('broadcast', { message: msg });
};
