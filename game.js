// ... (previous code declarations are unchanged)

const changelogToggle = document.getElementById('toggle-changelog');
const changelogContent = document.getElementById('changelog-content');

changelogToggle.onclick = () => {
  if (changelogContent.style.display === 'none') {
    changelogContent.style.display = 'block';
  } else {
    changelogContent.style.display = 'none';
  }
};

startButton.onclick = () => {
  playerName = usernameInput.value.trim();
  if (playerName) {
    if (playerName === 'CharmedZ') {
      const enteredCode = prompt('Enter developer code:');
      if (enteredCode === '1627') {
        isDev = true;
      }
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
      if (isDev) updateDevPanel();
    } else if (data.type === 'chat') {
      const msg = document.createElement('div');
      const isDevMsg = data.isDev || data.name === '[DEVELOPER]';
      msg.textContent = `${data.name}: ${data.message}`;
      if (isDevMsg) msg.classList.add('developer-message');
      chatLog.appendChild(msg);
      chatLog.scrollTop = chatLog.scrollHeight;
    }
  };
}

// ... (rest of code unchanged, including sendChatBtn, movement, updateDevPanel, draw)


