const boardEl = document.querySelector("#board");
const spacesEl = document.querySelector("#spaces");
const spinButton = document.querySelector("#spin-button");
const reverseButton = document.querySelector("#reverse-button");
const newGameButton = document.querySelector("#new-game");
const playerCountSelect = document.querySelector("#player-count");
const turnStageEl = document.querySelector("#turn-stage");
const turnNameEl = document.querySelector("#turn-name");
const turnTeamEl = document.querySelector("#turn-team");
const turnHelpEl = document.querySelector("#turn-help");
const teamsEl = document.querySelector("#teams");
const logEl = document.querySelector("#log");
const wheelEl = document.querySelector(".spinner-wheel");
const rulesButton = document.querySelector("#toggle-rules");
const rulesEl = document.querySelector("#rules");
const earCharactersEl = document.querySelector("#ear-characters");
const mysteryEarEl = document.querySelector("#mystery-ear");
const powerStatusEl = document.querySelector("#power-status");
const powerUpButton = document.querySelector("#power-up");
const powerDownButton = document.querySelector("#power-down");

const boardSpaces = [
  { label: "Start", type: "start" },
  { label: "+3", type: "points", points: 3 },
  { label: "Mystery", type: "mystery" },
  { label: "", type: "plain" },
  { label: "Go up 2", type: "move", move: 2 },
  { label: "+5", type: "points", points: 5 },
  { label: "", type: "plain" },
  { label: "Mystery", type: "mystery" },
  { label: "Save reverse", type: "save-reverse", saveReverse: true },
  { label: "-2", type: "points", points: -2 },
  { label: "Spin again", type: "move", spinAgain: true },
  { label: "Mystery", type: "mystery" },
  { label: "", type: "plain" },
  { label: "+4", type: "points", points: 4 },
  { label: "Go back 2", type: "move", move: -2 },
  { label: "", type: "plain" },
  { label: "Reverse", type: "reverse", reverseNow: true },
  { label: "+6", type: "points", points: 6 },
  { label: "Mystery", type: "mystery" },
  { label: "Skip next", type: "move", skipNext: true },
  { label: "+7", type: "points", points: 7 },
  { label: "", type: "plain" },
  { label: "Mystery", type: "mystery" },
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
  { title: "Skip turn", text: "The next player skips a turn.", apply: (game) => { const next = nextLivingPlayer(game); next.skip = true; addLog(`${next.name} will skip a turn.`); } },
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
    return {
      id: index,
      name: `Player ${index + 1}`,
      team: "unassigned",
      position: 0,
      finished: false,
      skip: false,
      savedReverse: false
    };
  });

  state = {
    phase: "setup",
    players,
    setupTurn: 0,
    setupRolls: Array(playerCount).fill(null),
    teams: {
      capys: { score: 0, spentPowers: 0 },
      pelicans: { score: 0, spentPowers: 0 }
    },
    turn: 0,
    direction: 1,
    deck: shuffle(cardBlueprints),
    discard: [],
    lastCard: null,
    busy: false,
    over: false,
    spinRotation: 0
  };

  boardEl.querySelector(".winner-banner")?.remove();
  renderBoard();
  resetLog();
  addLog("Spin to decide teams. Highest spin becomes the Capys team.");
  updateUi();
}

function renderBoard() {
  spacesEl.innerHTML = "";
  const mobile = window.matchMedia("(max-width: 650px)").matches;
  const track = buildTrackGeometry(mobile);
  const svg = createSvgElement("svg");
  svg.classList.add("track-svg");
  svg.setAttribute("viewBox", "0 0 1000 700");
  svg.setAttribute("preserveAspectRatio", "none");
  spacesEl.appendChild(svg);
  svg.appendChild(createCapyDefs());

  boardSpaces.forEach((space, index) => {
    const start = track.start + track.span * index / boardSpaces.length;
    const end = track.start + track.span * (index + 1) / boardSpaces.length;
    const mid = (start + end) / 2;
    const innerStart = faceCurvePoint(track, start);
    const innerMid = faceCurvePoint(track, mid);
    const innerEnd = faceCurvePoint(track, end);
    const outerStart = growFromFace(track, start, track.thickness);
    const outerMid = growFromFace(track, mid, track.thickness);
    const outerEnd = growFromFace(track, end, track.thickness);
    const label = growFromFace(track, mid, track.labelOffset);
    const token = growFromFace(track, mid, track.tokenOffset);
    const type = space.type === "save-reverse" ? "reverse save-reverse" : space.type;

    const group = createSvgElement("g");
    group.classList.add("space", ...type.split(" "));
    group.dataset.index = index;

    const path = createSvgElement("path");
    path.classList.add("space-path");
    path.setAttribute("d", [
      `M ${innerStart.x} ${innerStart.y}`,
      `Q ${innerMid.x} ${innerMid.y} ${innerEnd.x} ${innerEnd.y}`,
      `L ${outerEnd.x} ${outerEnd.y}`,
      `Q ${outerMid.x} ${outerMid.y} ${outerStart.x} ${outerStart.y}`,
      "Z"
    ].join(" "));

    const text = createSvgElement("text");
    text.classList.add("space-label");
    text.setAttribute("x", label.x);
    text.setAttribute("y", label.y);
    appendSpaceLabel(text, space.label);

    const tokenHost = createSvgElement("foreignObject");
    tokenHost.classList.add("tokens-host");
    tokenHost.setAttribute("x", token.x - 38);
    tokenHost.setAttribute("y", token.y - 21);
    tokenHost.setAttribute("width", 76);
    tokenHost.setAttribute("height", 42);
    const tokens = document.createElement("div");
    tokens.className = "tokens";
    tokens.setAttribute("aria-hidden", "true");
    tokenHost.appendChild(tokens);

    group.append(path, text, tokenHost);
    svg.appendChild(group);
  });

  svg.appendChild(createSvgCapyFace(track));
}

function buildTrackGeometry(mobile) {
  return {
    start: 226,
    span: -272,
    center: mobile ? { x: 500, y: 382 } : { x: 500, y: 382 },
    face: mobile
      ? { cx: 500, cy: 392, rx: 430, ry: 158, sidePinch: 65 }
      : { cx: 500, cy: 388, rx: 354, ry: 210, sidePinch: 60 },
    faceTopY: mobile ? 286 : 177,
    thickness: mobile ? 98 : 104,
    labelOffset: mobile ? 54 : 58,
    tokenOffset: mobile ? 76 : 80
  };
}

function createSvgElement(tagName) {
  return document.createElementNS("http://www.w3.org/2000/svg", tagName);
}

function createCapyDefs() {
  const defs = createSvgElement("defs");
  const pattern = createSvgElement("pattern");
  pattern.setAttribute("id", "capy-stripes");
  pattern.setAttribute("patternUnits", "userSpaceOnUse");
  pattern.setAttribute("width", 17);
  pattern.setAttribute("height", 17);
  pattern.setAttribute("patternTransform", "rotate(13)");

  const stripe = createSvgElement("rect");
  stripe.setAttribute("x", 0);
  stripe.setAttribute("y", 0);
  stripe.setAttribute("width", 5);
  stripe.setAttribute("height", 17);
  pattern.appendChild(stripe);
  defs.appendChild(pattern);
  return defs;
}

function createSvgCapyFace(track) {
  const group = createSvgElement("g");
  group.classList.add("svg-capy-face");

  const face = createSvgElement("path");
  face.classList.add("svg-capy-face-fill");
  face.setAttribute("d", faceShapePath(track));

  const texture = createSvgElement("path");
  texture.classList.add("svg-capy-face-texture");
  texture.setAttribute("d", faceShapePath(track));

  const leftCheek = createSvgElement("circle");
  leftCheek.classList.add("svg-capy-cheek");
  leftCheek.setAttribute("cx", track.center.x - 135);
  leftCheek.setAttribute("cy", track.center.y + 82);
  leftCheek.setAttribute("r", 45);

  const rightCheek = createSvgElement("circle");
  rightCheek.classList.add("svg-capy-cheek");
  rightCheek.setAttribute("cx", track.center.x + 135);
  rightCheek.setAttribute("cy", track.center.y + 82);
  rightCheek.setAttribute("r", 45);

  group.append(face, texture, leftCheek, rightCheek);
  return group;
}

function faceShapePath(track) {
  const start = faceCurvePoint(track, track.start);
  const end = faceCurvePoint(track, track.start + track.span);
  const commands = [`M ${start.x} ${start.y}`];

  for (let index = 0; index < boardSpaces.length; index += 1) {
    const segmentStart = track.start + track.span * index / boardSpaces.length;
    const segmentEnd = track.start + track.span * (index + 1) / boardSpaces.length;
    const mid = faceCurvePoint(track, (segmentStart + segmentEnd) / 2);
    const next = faceCurvePoint(track, segmentEnd);
    commands.push(`Q ${mid.x} ${mid.y} ${next.x} ${next.y}`);
  }

  commands.push(
    `C ${end.x - 12} ${track.faceTopY + 44} 640 ${track.faceTopY} 500 ${track.faceTopY}`,
    `C 360 ${track.faceTopY} ${start.x + 12} ${track.faceTopY + 44} ${start.x} ${start.y}`,
    "Z"
  );
  return commands.join(" ");
}

function appendSpaceLabel(textEl, label) {
  if (!label) return;
  const words = label.split(" ");
  if (words.length === 1 || label.length <= 8) {
    textEl.textContent = label;
    return;
  }

  words.forEach((word, index) => {
    const line = createSvgElement("tspan");
    line.setAttribute("x", textEl.getAttribute("x"));
    line.setAttribute("dy", index === 0 ? `${(1 - words.length) * 0.55}em` : "1.1em");
    line.textContent = word;
    textEl.appendChild(line);
  });
}

function faceCurvePoint(track, degrees) {
  return trackPoint(track.face, degrees);
}

function growFromFace(track, degrees, amount) {
  const point = faceCurvePoint(track, degrees);
  const dx = point.x - track.center.x;
  const dy = point.y - track.center.y;
  const distance = Math.hypot(dx, dy) || 1;
  return {
    x: roundPoint(point.x + dx / distance * amount),
    y: roundPoint(point.y + dy / distance * amount)
  };
}

function trackPoint(curve, degrees) {
  const radians = degrees * Math.PI / 180;
  const sidePinch = (curve.sidePinch || 0) * Math.abs(Math.cos(radians)) ** 8;
  const rx = curve.rx - sidePinch;
  return {
    x: roundPoint(curve.cx + rx * Math.cos(radians)),
    y: roundPoint(curve.cy + curve.ry * Math.sin(radians))
  };
}

function roundPoint(value) {
  return Math.round(value * 100) / 100;
}

function updateUi() {
  const current = currentPlayer();
  const setup = state.phase === "setup";
  turnStageEl.textContent = setup ? "Team picker" : "Current turn";
  turnNameEl.textContent = current.name;
  turnTeamEl.textContent = setup ? setupRollLabel() : `${teamLabel(current.team)} team`;
  turnTeamEl.className = `team-pill ${setup ? "unassigned" : current.team}`;
  turnHelpEl.textContent = setup ? setupHelpText() : "Move counter-clockwise around the capybara. Use powers before you spin.";
  spinButton.textContent = setup ? "Spin for teams" : "Spin";
  spinButton.disabled = state.busy || state.over;
  reverseButton.disabled = setup || state.busy || state.over || !current.savedReverse;

  updateSpaces(current);
  updateTeams();
  updateEarCharacters();
  updateMysteryEar();
  updatePowerButtons();
}

function updateSpaces(current) {
  document.querySelectorAll(".space").forEach((spaceEl) => {
    const index = Number(spaceEl.dataset.index);
    const tokens = state.players
      .filter((player) => player.position === index && !player.finished && state.phase === "race")
      .map((player) => `<span class="token ${player.team}">${player.id + 1}</span>`)
      .join("");
    spaceEl.querySelector(".tokens").innerHTML = tokens;
    spaceEl.classList.toggle("active", state.phase === "race" && index === current.position && !current.finished);
  });
}

function updateTeams() {
  const setupRows = state.players.map((player) => {
    const roll = state.setupRolls[player.id];
    const detail = roll === null ? "Needs spin" : `Spun ${roll}`;
    return `<div class="player-row"><span>${player.name}</span><span>${detail}</span></div>`;
  }).join("");

  if (state.phase === "setup") {
    teamsEl.innerHTML = `<div class="team-row"><span class="team-name">Team picker</span><span class="score">${state.setupTurn + 1}/${state.players.length}</span>${setupRows}</div>`;
    return;
  }

  teamsEl.innerHTML = ["capys", "pelicans"].map((team) => {
    const teamPlayers = state.players.filter((player) => player.team === team);
    const players = teamPlayers.map((player) => {
      const place = player.finished ? "Finished" : `Space ${player.position + 1}`;
      const saved = player.savedReverse ? " reverse saved" : "";
      return `<div class="player-row"><span>${player.name}</span><span>${place}${saved}</span></div>`;
    }).join("");
    const powers = availablePowers(team);
    return `
      <div class="team-row">
        <span class="team-name">${teamLabel(team)}</span>
        <span class="score">${state.teams[team].score}</span>
        <div class="player-row"><span>15 point powers</span><span>${powers}</span></div>
        ${players}
      </div>
    `;
  }).join("");
}

function updateEarCharacters() {
  earCharactersEl.innerHTML = state.players.map((player) => {
    return `<span class="ear-token ${player.team}" title="${player.name}">${player.id + 1}</span>`;
  }).join("");
}

function updateMysteryEar() {
  const label = state.lastCard ? state.lastCard.title : "?";
  mysteryEarEl.innerHTML = `<span>${label}</span><small>${state.deck.length} left</small>`;
}

function updatePowerButtons() {
  if (state.phase !== "race" || state.over) {
    powerStatusEl.textContent = "Earn 15 points to unlock a move.";
    powerUpButton.disabled = true;
    powerDownButton.disabled = true;
    return;
  }

  const player = currentPlayer();
  const powers = availablePowers(player.team);
  powerStatusEl.textContent = powers > 0
    ? `${teamLabel(player.team)} has ${powers} power ready.`
    : `${teamLabel(player.team)} needs ${pointsUntilPower(player.team)} more points.`;
  powerUpButton.disabled = state.busy || powers <= 0;
  powerDownButton.disabled = state.busy || powers <= 0 || !mostAdvancedOpponent(player.team);
}

function currentPlayer() {
  return state.players[state.phase === "setup" ? state.setupTurn : state.turn];
}

function setupRollLabel() {
  const player = currentPlayer();
  const roll = state.setupRolls[player.id];
  return roll === null ? "No spin yet" : `Spun ${roll}`;
}

function setupHelpText() {
  if (state.players.length === 2) {
    return "Each player spins once. Highest spin becomes the Capys team.";
  }
  return "Players 1 and 2 add spins, players 3 and 4 add spins. Highest total becomes the Capys team.";
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
  if (team === "capys") return "Capys";
  if (team === "pelicans") return "Pelicans";
  return "Not picked";
}

function resetLog() {
  logEl.innerHTML = "";
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
  if (state.phase === "setup") {
    setupSpin();
    return;
  }
  raceSpin();
}

function setupSpin() {
  if (state.busy || state.over) return;
  state.busy = true;
  const player = currentPlayer();
  const result = spinWheel();
  addLog(`${player.name} spun ${result} for teams.`);

  setTimeout(() => {
    state.setupRolls[player.id] = result;
    state.setupTurn += 1;
    state.busy = false;
    if (state.setupTurn >= state.players.length) {
      finishTeamPicker();
    }
    updateUi();
  }, 760);
}

function finishTeamPicker() {
  if (state.players.length === 2) {
    const [first, second] = state.setupRolls;
    if (first === second) {
      state.setupTurn = 0;
      state.setupRolls = Array(state.players.length).fill(null);
      addLog("Tie spin. Spin again to decide teams.");
      return;
    }
    assignTeams(first > second ? [0] : [1]);
  } else {
    const firstPair = state.setupRolls[0] + state.setupRolls[1];
    const secondPair = state.setupRolls[2] + state.setupRolls[3];
    if (firstPair === secondPair) {
      state.setupTurn = 0;
      state.setupRolls = Array(state.players.length).fill(null);
      addLog("Tie total. Everyone spins again.");
      return;
    }
    assignTeams(firstPair > secondPair ? [0, 1] : [2, 3]);
  }

  state.phase = "race";
  state.turn = state.players.findIndex((player) => player.team === "capys");
  addLog("The Capys team starts. Move counter-clockwise.");
}

function assignTeams(capyIds) {
  state.players.forEach((player) => {
    player.team = capyIds.includes(player.id) ? "capys" : "pelicans";
  });
  const capys = capyIds.map((id) => `Player ${id + 1}`).join(" and ");
  addLog(`${capys} become the Capys team.`);
}

function raceSpin() {
  if (state.busy || state.over) return;
  const player = currentPlayer();
  if (player.skip) {
    player.skip = false;
    addLog(`${player.name} skipped this turn.`);
    endTurn();
    return;
  }

  state.busy = true;
  const result = spinWheel();
  addLog(`${player.name} spun ${result}.`);

  setTimeout(() => {
    movePlayer(state, player, result, "spin");
    const keepsTurn = resolveSpace(state, player);
    if (!state.over && !keepsTurn) endTurn();
  }, 760);
}

function spinWheel() {
  const result = 1 + Math.floor(Math.random() * 6);
  state.spinRotation += 720 + (6 - result) * 60 + Math.floor(Math.random() * 18);
  wheelEl.style.setProperty("--spin", `${state.spinRotation}deg`);
  return result;
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
  if (source === "card" || source === "power") {
    addLog(`${player.name} moved to space ${player.position + 1}.`);
  }
}

function resolveSpace(game, player) {
  if (player.finished || game.over) return false;
  const space = boardSpaces[player.position];

  if (space.points) addPoints(game, player.team, space.points);
  if (space.saveReverse) {
    player.savedReverse = true;
    addLog(`${player.name} saved a reverse square.`);
  }
  if (space.reverseNow) {
    game.direction *= -1;
    addLog("Play order reversed.");
  }
  if (space.skipNext) {
    const next = nextLivingPlayer(game);
    next.skip = true;
    addLog(`${next.name} will skip a turn.`);
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
  game.lastCard = card;
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

function availablePowers(team) {
  if (!state.teams[team]) return 0;
  return Math.max(0, Math.floor(state.teams[team].score / 15) - state.teams[team].spentPowers);
}

function pointsUntilPower(team) {
  const score = Math.max(0, state.teams[team].score);
  const next = (Math.floor(score / 15) + 1) * 15;
  return next - score;
}

function spendPower(team) {
  state.teams[team].spentPowers += 1;
}

function usePowerUp() {
  if (state.phase !== "race" || state.busy || state.over) return;
  const player = currentPlayer();
  if (availablePowers(player.team) <= 0) return;
  spendPower(player.team);
  addLog(`${teamLabel(player.team)} used 15 points to move ${player.name} up 5.`);
  movePlayer(state, player, 5, "power");
  updateUi();
}

function usePowerDown() {
  if (state.phase !== "race" || state.busy || state.over) return;
  const player = currentPlayer();
  if (availablePowers(player.team) <= 0) return;
  const opponent = mostAdvancedOpponent(player.team);
  if (!opponent) return;
  spendPower(player.team);
  addLog(`${teamLabel(player.team)} used 15 points to move ${opponent.name} down 5.`);
  movePlayer(state, opponent, -5, "power");
  updateUi();
}

function mostAdvancedOpponent(team) {
  const opponents = state.players.filter((player) => player.team !== team && !player.finished);
  if (opponents.length === 0) return null;
  return opponents.reduce((leader, next) => next.position > leader.position ? next : leader, opponents[0]);
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
  updateUi();
}

function toggleRules() {
  const next = rulesEl.hidden;
  rulesEl.hidden = !next;
  rulesButton.setAttribute("aria-expanded", String(next));
}

spinButton.addEventListener("click", spin);
reverseButton.addEventListener("click", useSavedReverse);
powerUpButton.addEventListener("click", usePowerUp);
powerDownButton.addEventListener("click", usePowerDown);
newGameButton.addEventListener("click", createGame);
playerCountSelect.addEventListener("change", createGame);
rulesButton.addEventListener("click", toggleRules);
window.addEventListener("resize", () => {
  renderBoard();
  updateUi();
});

createGame();
