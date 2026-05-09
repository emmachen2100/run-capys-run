const boardEl = document.querySelector("#board");
const spacesEl = document.querySelector("#spaces");
const spinButton = document.querySelector("#spin-button");
const reverseButton = document.querySelector("#reverse-button");
const newGameButton = document.querySelector("#new-game");
const playerCountSelect = document.querySelector("#player-count");
const turnNameEl = document.querySelector("#turn-name");
const turnTeamEl = document.querySelector("#turn-team");
const teamsEl = document.querySelector("#teams");
const logEl = document.querySelector("#log");
const wheelEl = document.querySelector(".spinner-wheel");
const rulesButton = document.querySelector("#toggle-rules");
const rulesEl = document.querySelector("#rules");

const boardSpaces = [
  { label: "Start", type: "start" },
  { label: "Go back 1", type: "move", move: -1 },
  { label: "+3 points", type: "points", points: 3 },
  { label: "Mystery card", type: "mystery" },
  { label: "Spin again", type: "move", spinAgain: true },
  { label: "Go up 2", type: "move", move: 2 },
  { label: "+5 points", type: "points", points: 5 },
  { label: "Mystery card", type: "mystery" },
  { label: "-5 points and spin again", type: "points", points: -5, spinAgain: true },
  { label: "Save reverse", type: "reverse", saveReverse: true },
  { label: "+2 points", type: "points", points: 2 },
  { label: "Mystery card", type: "mystery" },
  { label: "Go up 3", type: "move", move: 3 },
  { label: "+7 points", type: "points", points: 7 },
  { label: "Mystery card", type: "mystery" },
  { label: "-2 points", type: "points", points: -2 },
  { label: "Reverse", type: "reverse", reverseNow: true },
  { label: "+3 points", type: "points", points: 3 },
  { label: "Mystery card", type: "mystery" },
  { label: "Skip next", type: "move", skipNext: true },
  { label: "+4 points", type: "points", points: 4 },
  { label: "Go back 2", type: "move", move: -2 },
  { label: "Mystery card", type: "mystery" },
  { label: "+6 points", type: "points", points: 6 },
  { label: "Spin again", type: "move", spinAgain: true },
  { label: "-3 points", type: "points", points: -3 },
  { label: "Mystery card", type: "mystery" },
  { label: "Switch places", type: "move", switchPlaces: true },
  { label: "+8 points", type: "points", points: 8 },
  { label: "Mystery card", type: "mystery" },
  { label: "Go back 1", type: "move", move: -1 },
  { label: "Finish", type: "finish" }
];

const cardBlueprints = [
  ...repeatCard(3, { title: "Move forward", text: "Move forward 3 spaces.", apply: (game, player) => movePlayer(game, player, 3, "card") }),
  ...repeatCard(3, { title: "Move backward", text: "Move backward 3 spaces.", apply: (game, player) => movePlayer(game, player, -3, "card") }),
  ...repeatCard(3, { title: "Reverse", text: "Reverse the play order.", apply: (game) => { game.direction *= -1; addLog("Play order reversed."); } }),
  ...repeatCard(3, { title: "Back to start", text: "Go back to start.", apply: (game, player) => { player.position = 0; addLog(`${player.name} went back to start.`); } }),
  ...repeatCard(7, { title: "+ points", text: "Add 5 points to your team.", apply: (game, player) => addPoints(game, player.team, 5) }),
  ...repeatCard(4, { title: "- points", text: "Lose 4 points from your team.", apply: (game, player) => addPoints(game, player.team, -4) }),
  { title: "Skip turn", text: "The next player skips a turn.", apply: (game) => { nextLivingPlayer(game).skip = true; addLog(`${nextLivingPlayer(game).name} will skip a turn.`); } },
  ...repeatCard(3, { title: "Oops card", text: "Slide back to the last mystery card.", apply: (game, player) => moveToPreviousMystery(game, player) }),
  ...repeatCard(2, { title: "Switch points", text: "Switch team scores.", apply: switchPoints }),
  { title: "Double points", text: "Double your team's points.", apply: (game, player) => { game.teams[player.team].score *= 2; addLog(`${teamLabel(player.team)} doubled its points.`); } },
  { title: "Pick 2 more cards", text: "Draw two more mystery cards.", apply: (game, player) => { drawMystery(game, player, true); drawMystery(game, player, true); } },
  { title: "Switch places", text: "Switch places with another player.", apply: switchPlacesWithLeader }
];

let state;

function repeatCard(count, card) {
  return Array.from({ length: count }, () => ({ ...card }));
}

function createGame() {
  const playerCount = Number(playerCountSelect.value);
  const players = Array.from({ length: playerCount }, (_, index) => {
    const team = index % 2 === 0 ? "capys" : "pelicans";
    return {
      id: index,
      name: `Player ${index + 1}`,
      team,
      position: 0,
      finished: false,
      skip: false,
      savedReverse: false
    };
  });

  state = {
    players,
    teams: {
      capys: { score: 0 },
      pelicans: { score: 0 }
    },
    turn: 0,
    direction: 1,
    deck: shuffle(cardBlueprints),
    discard: [],
    busy: false,
    over: false,
    spinRotation: 0
  };

  boardEl.querySelector(".winner-banner")?.remove();
  renderBoard();
  addLog("New game started. Shuffle the mystery cards and spin.");
  updateUi();
}

function renderBoard() {
  spacesEl.innerHTML = "";
  const mobile = window.matchMedia("(max-width: 650px)").matches;
  const cx = 50;
  const cy = mobile ? 50 : 51;
  const rx = mobile ? 38 : 44;
  const ry = mobile ? 44 : 37;
  const startAngle = mobile ? 230 : 220;

  boardSpaces.forEach((space, index) => {
    const angle = startAngle + (index / boardSpaces.length) * 360;
    const radians = angle * Math.PI / 180;
    const x = cx + rx * Math.cos(radians);
    const y = cy + ry * Math.sin(radians);
    const el = document.createElement("div");
    el.className = `space ${space.type}`;
    el.style.setProperty("--x", x.toFixed(2));
    el.style.setProperty("--y", y.toFixed(2));
    el.style.setProperty("--r", `${angle + 90}deg`);
    el.dataset.index = index;
    el.innerHTML = `<span>${space.label}</span><div class="tokens" aria-hidden="true"></div>`;
    spacesEl.appendChild(el);
  });
}

function updateUi() {
  const current = currentPlayer();
  turnNameEl.textContent = current.name;
  turnTeamEl.textContent = `${teamLabel(current.team)} team`;
  turnTeamEl.className = `team-pill ${current.team}`;
  spinButton.disabled = state.busy || state.over;
  reverseButton.disabled = state.busy || state.over || !current.savedReverse;

  document.querySelectorAll(".space").forEach((spaceEl) => {
    const index = Number(spaceEl.dataset.index);
    const tokens = state.players
      .filter((player) => player.position === index && !player.finished)
      .map((player) => `<span class="token ${player.team}">${player.id + 1}</span>`)
      .join("");
    spaceEl.querySelector(".tokens").innerHTML = tokens;
    spaceEl.classList.toggle("active", index === current.position && !current.finished);
  });

  teamsEl.innerHTML = ["capys", "pelicans"].map((team) => {
    const teamPlayers = state.players.filter((player) => player.team === team);
    const players = teamPlayers.map((player) => {
      const place = player.finished ? "Finished" : `Space ${player.position + 1}`;
      const saved = player.savedReverse ? " reverse saved" : "";
      return `<div class="player-row"><span>${player.name}</span><span>${place}${saved}</span></div>`;
    }).join("");
    return `
      <div class="team-row">
        <span class="team-name">${teamLabel(team)}</span>
        <span class="score">${state.teams[team].score}</span>
        ${players}
      </div>
    `;
  }).join("");
}

function currentPlayer() {
  return state.players[state.turn];
}

function nextLivingPlayer(game = state) {
  let index = game.turn;
  for (let step = 0; step < game.players.length; step += 1) {
    index = wrap(index + game.direction, game.players.length);
    if (!game.players[index].finished) return game.players[index];
  }
  return currentPlayer();
}

function teamLabel(team) {
  return team === "capys" ? "Capys" : "Pelicans";
}

function addLog(message) {
  const li = document.createElement("li");
  li.textContent = message;
  logEl.prepend(li);
  while (logEl.children.length > 10) {
    logEl.lastElementChild.remove();
  }
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[other]] = [copy[other], copy[index]];
  }
  return copy;
}

function wrap(value, length) {
  return ((value % length) + length) % length;
}

function spin() {
  if (state.busy || state.over) return;
  const player = currentPlayer();
  if (player.skip) {
    player.skip = false;
    addLog(`${player.name} skipped this turn.`);
    endTurn();
    return;
  }

  state.busy = true;
  const result = 1 + Math.floor(Math.random() * 6);
  state.spinRotation += 720 + (6 - result) * 60 + Math.floor(Math.random() * 18);
  wheelEl.style.setProperty("--spin", `${state.spinRotation}deg`);
  addLog(`${player.name} spun ${result}.`);

  setTimeout(() => {
    movePlayer(state, player, result, "spin");
    const keepsTurn = resolveSpace(state, player);
    if (!state.over && !keepsTurn) endTurn();
  }, 760);
}

function movePlayer(game, player, amount, source) {
  if (player.finished) return;
  const finish = boardSpaces.length - 1;
  const next = player.position + amount;
  player.position = Math.max(0, Math.min(finish, next));
  if (player.position === finish) {
    player.finished = true;
    addLog(`${player.name} reached the finish.`);
    checkWinner(game);
    return;
  }
  if (source === "card") {
    addLog(`${player.name} moved to ${boardSpaces[player.position].label}.`);
  }
}

function resolveSpace(game, player) {
  if (player.finished || game.over) return false;
  const space = boardSpaces[player.position];

  if (space.points) addPoints(game, player.team, space.points);
  if (space.saveReverse) {
    player.savedReverse = true;
    addLog(`${player.name} saved a reverse card.`);
  }
  if (space.reverseNow) {
    game.direction *= -1;
    addLog("Play order reversed.");
  }
  if (space.skipNext) {
    nextLivingPlayer(game).skip = true;
    addLog(`${nextLivingPlayer(game).name} will skip a turn.`);
  }
  if (space.switchPlaces) switchPlacesWithLeader(game, player);
  if (space.move) {
    addLog(`${space.label}.`);
    movePlayer(game, player, space.move, "space");
  }
  if (space.mystery) drawMystery(game, player);
  if (space.spinAgain && !game.over) {
    addLog(`${player.name} gets an extra spin.`);
    game.busy = false;
    updateUi();
    return true;
  }
  return false;
}

function drawMystery(game, player, chained = false) {
  if (game.deck.length === 0) {
    game.deck = shuffle(game.discard);
    game.discard = [];
    addLog("Mystery deck reshuffled.");
  }

  const card = game.deck.pop();
  game.discard.push(card);
  addLog(`${player.name} drew ${card.title}: ${card.text}`);
  card.apply(game, player);

  if (!chained && !game.over) {
    const space = boardSpaces[player.position];
    if (!space.mystery && !player.finished) resolveSpace(game, player);
  }
}

function addPoints(game, team, amount) {
  game.teams[team].score += amount;
  const sign = amount > 0 ? "+" : "";
  addLog(`${teamLabel(team)} team gets ${sign}${amount} points.`);
}

function switchPoints(game) {
  const capys = game.teams.capys.score;
  game.teams.capys.score = game.teams.pelicans.score;
  game.teams.pelicans.score = capys;
  addLog("The teams switched points.");
}

function switchPlacesWithLeader(game, player) {
  const candidates = game.players.filter((other) => other.id !== player.id && !other.finished);
  if (candidates.length === 0) return;
  const other = candidates.reduce((leader, next) => next.position > leader.position ? next : leader, candidates[0]);
  [player.position, other.position] = [other.position, player.position];
  addLog(`${player.name} switched places with ${other.name}.`);
}

function moveToPreviousMystery(game, player) {
  for (let index = player.position - 1; index >= 0; index -= 1) {
    if (boardSpaces[index].type === "mystery") {
      player.position = index;
      addLog(`${player.name} slid back to a mystery card.`);
      return;
    }
  }
  player.position = 0;
  addLog(`${player.name} slid back to start.`);
}

function useSavedReverse() {
  const player = currentPlayer();
  if (!player.savedReverse || state.busy || state.over) return;
  player.savedReverse = false;
  state.direction *= -1;
  addLog(`${player.name} used a saved reverse.`);
  endTurn();
}

function endTurn() {
  state.busy = false;
  if (state.over) {
    updateUi();
    return;
  }

  for (let steps = 0; steps < state.players.length; steps += 1) {
    state.turn = wrap(state.turn + state.direction, state.players.length);
    if (!currentPlayer().finished) break;
  }
  updateUi();
}

function checkWinner(game) {
  const playerCount = game.players.length;
  const needed = playerCount === 4 ? 2 : 1;
  const winner = ["capys", "pelicans"].find((team) => {
    return game.players.filter((player) => player.team === team && player.finished).length >= needed;
  });

  if (!winner) return;

  game.over = true;
  const banner = document.createElement("div");
  banner.className = "winner-banner";
  banner.innerHTML = `<h2>${teamLabel(winner)} win</h2><p>Final score: Capys ${game.teams.capys.score}, Pelicans ${game.teams.pelicans.score}</p><button type="button" id="play-again">Play again</button>`;
  boardEl.appendChild(banner);
  banner.querySelector("#play-again").addEventListener("click", createGame);
  addLog(`${teamLabel(winner)} team wins.`);
}

function toggleRules() {
  const next = rulesEl.hidden;
  rulesEl.hidden = !next;
  rulesButton.setAttribute("aria-expanded", String(next));
}

spinButton.addEventListener("click", spin);
reverseButton.addEventListener("click", useSavedReverse);
newGameButton.addEventListener("click", createGame);
playerCountSelect.addEventListener("change", createGame);
rulesButton.addEventListener("click", toggleRules);
window.addEventListener("resize", () => {
  renderBoard();
  updateUi();
});

createGame();
