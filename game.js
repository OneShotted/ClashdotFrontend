const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let socket;
let playerId = null;
let allPlayers = {};
let playerName = '';

const usernameScreen = document.getElementById('username-screen');
const usernameInput = document.getElementById('username-input');
const startButton = document.getElementById('start-button');
const chatContainer = document.getElementById('chat-container');
const chatLog = document.getElementById('chat-log');
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat');

// Username screen logic
startButton.onclick = () => {
  playerName = usernameInput.value.trim();
  if (playerName) {
    usernameScreen.style.display = 'none';
    chatContainer.style.display = 'flex';
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
  if (message && socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'chat', message }));
    chatInput.value = '';
  }
};

// Movement
document.addEventListener('keydown', (e) => {
  if (!playerId || !socket || socket.readyState !== WebSocket.OPEN) return;
  if (document.activeElement === chatInput) return;

  const key = e.key.toLowerCase();

  if (key === 'arrowup' || key === 'w') {
    socket.send(JSON.stringify({ type: 'move', key: 'up' }));
  } else if (key === 'arrowdown' || key === 's') {
    socket.send(JSON.stringify({ type: 'move', key: 'down' }));
  } else if (key === 'arrowleft' || key === 'a') {
    socket.send(JSON.stringify({ type: 'move', key: 'left' }));
  } else if (key === 'arrowright' || key === 'd') {
    socket.send(JSON.stringify({ type: 'move', key: 'right' }));
  }
});

// Draw grid background
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

// Main game loop
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
