const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const chatLog = document.getElementById('chat-log');
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat');

let playerName = prompt("Enter your username:");
if (!playerName) playerName = "Player" + Math.floor(Math.random() * 1000);

const socket = new WebSocket('wss://websocket-1-xib5.onrender.com');

let playerId = null;
let players = {};

socket.onopen = () => {
  socket.send(JSON.stringify({ type: 'register', name: playerName }));
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'init') {
    playerId = data.id;
  } else if (data.type === 'state') {
    players = data.players;
  } else if (data.type === 'chat') {
    const chatEntry = document.createElement('div');
    chatEntry.textContent = `${data.name}: ${data.message}`;
    chatLog.appendChild(chatEntry);
    chatLog.scrollTop = chatLog.scrollHeight;
  }
};

sendChatBtn.onclick = () => {
  const message = chatInput.value.trim();
  if (message && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'chat', message }));
    chatInput.value = '';
  }
};

const player = { x: 300, y: 300, radius: 20, speed: 8 };

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') player.y -= player.speed;
  if (e.key === 'ArrowDown') player.y += player.speed;
  if (e.key === 'ArrowLeft') player.x -= player.speed;
  if (e.key === 'ArrowRight') player.x += player.speed;

  socket.send(JSON.stringify({ type: 'move', x: player.x, y: player.y }));
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const camX = player.x - canvas.width / 2;
  const camY = player.y - canvas.height / 2;

  // Draw other players
  for (const id in players) {
    const p = players[id];
    const screenX = p.x - camX;
    const screenY = p.y - camY;
    ctx.beginPath();
    ctx.arc(screenX, screenY, 20, 0, Math.PI * 2);
    ctx.fillStyle = id === playerId ? 'blue' : 'red';
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.name, screenX, screenY - 25);
  }

  requestAnimationFrame(draw);
}

draw();
