const socket = new WebSocket('ws://localhost:3000');
let playerId = null;
let players = {};
let isDev = false;

const movementKeys = {
  up: false,
  down: false,
  left: false,
  right: false,
};

document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'w' || key === 'arrowup') movementKeys.up = true;
  if (key === 's' || key === 'arrowdown') movementKeys.down = true;
  if (key === 'a' || key === 'arrowleft') movementKeys.left = true;
  if (key === 'd' || key === 'arrowright') movementKeys.right = true;
});

document.addEventListener('keyup', (e) => {
  const key = e.key.toLowerCase();
  if (key === 'w' || key === 'arrowup') movementKeys.up = false;
  if (key === 's' || key === 'arrowdown') movementKeys.down = false;
  if (key === 'a' || key === 'arrowleft') movementKeys.left = false;
  if (key === 'd' || key === 'arrowright') movementKeys.right = false;
});

setInterval(() => {
  if (playerId && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      type: 'movementState',
      keys: movementKeys
    }));
  }
}, 1000 / 30);

socket.addEventListener('open', () => {
  console.log('Connected to server');
});

socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'id') {
    playerId = data.id;
  }

  if (data.type === 'update') {
    players = data.players;
    draw();
  }

  if (data.type === 'chat') {
    addChatMessage(data);
  }
});

function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (message) {
    socket.send(JSON.stringify({ type: 'chat', message }));
    input.value = '';
  }
}

function addChatMessage(data) {
  const chatBox = document.getElementById('chat-box');
  const msgDiv = document.createElement('div');

  msgDiv.textContent = data.isBroadcast
    ? `[Broadcast]: ${data.message}`
    : `${data.name}: ${data.message}`;

  if (data.isBroadcast) {
    msgDiv.style.color = 'orange';
    msgDiv.style.fontWeight = 'bold';
  } else if (data.name === 'CharmedZ') {
    msgDiv.style.color = 'red';
  }

  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function registerUsername() {
  const input = document.getElementById('username-input');
  const username = input.value.trim();
  if (username) {
    const isDeveloper = username.includes('#1627');
    isDev = isDeveloper;
    socket.send(JSON.stringify({
      type: 'register',
      name: username
    }));

    document.getElementById('username-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';

    if (isDev) updateDevPanel();
  }
}

function updateDevPanel() {
  const panel = document.getElementById('dev-panel');
  panel.innerHTML = '';

  const title = document.createElement('h3');
  title.textContent = 'Developer Panel';
  panel.appendChild(title);

  const broadcastInput = document.createElement('input');
  broadcastInput.placeholder = 'Broadcast message';
  panel.appendChild(broadcastInput);

  const broadcastBtn = document.createElement('button');
  broadcastBtn.textContent = 'Broadcast';
  broadcastBtn.onclick = () => {
    socket.send(JSON.stringify({
      type: 'devCommand',
      command: 'broadcast',
      message: broadcastInput.value
    }));
    broadcastInput.value = '';
  };
  panel.appendChild(broadcastBtn);

  const kickInput = document.createElement('input');
  kickInput.placeholder = 'Player ID to kick';
  panel.appendChild(kickInput);

  const kickBtn = document.createElement('button');
  kickBtn.textContent = 'Kick';
  kickBtn.onclick = () => {
    socket.send(JSON.stringify({
      type: 'devCommand',
      command: 'kick',
      targetId: kickInput.value
    }));
    kickInput.value = '';
  };
  panel.appendChild(kickBtn);

  const teleportBtn = document.createElement('button');
  teleportBtn.textContent = 'Teleport to Center';
  teleportBtn.onclick = () => {
    socket.send(JSON.stringify({
      type: 'devCommand',
      command: 'teleport',
      targetId: playerId,
      x: 300,
      y: 300
    }));
  };
  panel.appendChild(teleportBtn);

  const speedBtn = document.createElement('button');
  speedBtn.textContent = 'Speed x2.5';
  speedBtn.onclick = () => {
    socket.send(JSON.stringify({
      type: 'devCommand',
      command: 'setSpeedMultiplier',
      targetId: playerId,
      multiplier: 2.5
    }));
  };
  panel.appendChild(speedBtn);

  const normalSpeedBtn = document.createElement('button');
  normalSpeedBtn.textContent = 'Normal Speed';
  normalSpeedBtn.onclick = () => {
    socket.send(JSON.stringify({
      type: 'devCommand',
      command: 'setSpeedMultiplier',
      targetId: playerId,
      multiplier: 1
    }));
  };
  panel.appendChild(normalSpeedBtn);
}

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (const id in players) {
    const player = players[id];
    const isCurrent = id === playerId;
    const color = isCurrent ? 'blue' : 'black';

    if (player.isDev) {
      // Draw triangle
      ctx.fillStyle = 'red';
      ctx.beginPath();
      ctx.moveTo(player.x, player.y - 10);
      ctx.lineTo(player.x - 10, player.y + 10);
      ctx.lineTo(player.x + 10, player.y + 10);
      ctx.closePath();
      ctx.fill();
    } else {
      // Draw circle
      ctx.beginPath();
      ctx.arc(player.x, player.y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    }

    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.name, player.x, player.y - 15);
  }
}

window.sendChatMessage = sendChatMessage;
window.registerUsername = registerUsername;

