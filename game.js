const boardEl = document.querySelector("#board");
const spacesEl = document.querySelector("#spaces");
const boardScoresEl = document.querySelector("#board-scores");
const spinnerEl = document.querySelector("#spinner");
const spinnerPlayerTokenEl = document.querySelector("#spinner-player-token");
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
const pendingCardEl = document.querySelector("#pending-card");
const pendingCardTitleEl = document.querySelector("#pending-card-title");
const pendingCardTextEl = document.querySelector("#pending-card-text");
const playCardButton = document.querySelector("#play-card");
const mysteryCardPopupEl = document.querySelector("#mystery-card-popup");
const mysteryCardPlayerEl = document.querySelector("#mystery-card-player");
const mysteryCardTitleEl = document.querySelector("#mystery-card-title");
const mysteryCardTextEl = document.querySelector("#mystery-card-text");
const pendingMoveEl = document.querySelector("#pending-move");
const pendingMoveTitleEl = document.querySelector("#pending-move-title");
const pendingMoveHelpEl = document.querySelector("#pending-move-help");

const MOVE_STEP_MS = 240;

const boardSpaces = [
  { label: "Start", type: "start" },
  { label: "Go back 1", type: "move", move: -1 },
  { label: "", type: "plain" },
  { label: "+3 points", type: "points", points: 3 },
  { label: "Mystery card", type: "mystery" },
  { label: "", type: "plain" },
  { label: "Spin again", type: "move", spinAgain: true },
  { label: "Mystery card", type: "mystery" },
  { label: "", type: "plain" },
  { label: "+3 points", type: "points", points: 3 },
  { label: "", type: "plain" },
  { label: "Go up 3 spaces", type: "move", move: 3 },
  { label: "Mystery card", type: "mystery" },
  { label: "", type: "plain" },
  { label: "+7 points", type: "points", points: 7 },
  { label: "Mystery card", type: "mystery" },
  { label: "", type: "plain" },
  { label: "", type: "plain" },
  { label: "-5 points\nspin\nagain", type: "points", points: -5, spinAgain: true },
  { label: "", type: "plain" },
  { label: "", type: "plain" },
  { label: "Mystery card", type: "mystery" },
  { label: "+2 points", type: "points", points: 2 },
  { label: "", type: "plain" },
  { label: "Finish", type: "finish" }
];

const cardBlueprints = [
  ...repeatCard(3, { title: "Move forward", text: "Move forward 3 spaces.", reverseMoveAmount: 3, apply: async (game, player) => movePlayer(game, player, 3, "card") }),
  ...repeatCard(3, { title: "Move backward", text: "Move back 1 space.", reverseMoveAmount: -1, apply: async (game, player) => movePlayer(game, player, -1, "card") }),
  ...repeatCard(3, { title: "Reverse", text: "Save this reverse card for later.", apply: (game, player) => { player.savedReverse = true; addLog(`${player.name} saved a reverse card.`); } }),
  ...repeatCard(3, { title: "Back to start", text: "Go back to start.", apply: async (game, player) => movePlayerTo(game, player, 0, "card") }),
  ...repeatCard(7, { title: "+ points", text: "Add 5 points to your team.", apply: (game, player) => addPoints(game, player.team, 5) }),
  ...repeatCard(4, { title: "- points", text: "Lose 4 points from your team.", apply: (game, player) => addPoints(game, player.team, -4) }),
  { title: "Skip turn", text: "The next player skips a turn.", apply: (game) => { const next = nextLivingPlayer(game); next.skip = true; addLog(`${next.name} will skip a turn.`); } },
  ...repeatCard(3, { title: "Oops card", text: "Nothing happens.", apply: (game, player) => addLog(`${player.name} got an Oops card. Nothing happens.`) }),
  ...repeatCard(2, { title: "Switch points", text: "Switch team scores.", apply: switchPoints }),
  { title: "Double points", text: "Double your team's points.", apply: (game, player) => { game.teams[player.team].score *= 2; addLog(`${teamLabel(player.team)} doubled its points.`); } },
  { title: "Pick 2 more cards", text: "Draw two more mystery cards.", apply: (game) => { game.queuedMysteryDraws += 2; addLog("Two more mystery cards are waiting."); } },
  { title: "Switch places", text: "Switch places with another player.", apply: switchPlacesWithLeader }
];

const MYSTERY_CARD_TOTAL = 32;

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
    usedCards: [],
    pendingCard: null,
    pendingMove: null,
    queuedMysteryDraws: 0,
    lastCard: null,
    busy: false,
    over: false,
    spinRotation: 0
  };

  boardEl.querySelector(".winner-banner")?.remove();
  renderBoard();
  resetLog();
  if (state.deck.length !== MYSTERY_CARD_TOTAL) {
    addLog(`Mystery deck should have ${MYSTERY_CARD_TOTAL} cards, but has ${state.deck.length}.`);
  }
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
    const lift = liftVector(track, mid, track.raiseOffset);
    const type = space.type === "save-reverse" ? "reverse save-reverse" : space.type;

    const group = createSvgElement("g");
    group.classList.add("space", ...type.split(" "));
    group.dataset.index = index;
    group.style.setProperty("--raise-x", `${lift.x}px`);
    group.style.setProperty("--raise-y", `${lift.y}px`);
    group.setAttribute("aria-label", spaceTooltip(space, index));

    const title = createSvgElement("title");
    title.textContent = spaceTooltip(space, index);

    const pathData = [
      `M ${innerStart.x} ${innerStart.y}`,
      `Q ${innerMid.x} ${innerMid.y} ${innerEnd.x} ${innerEnd.y}`,
      `L ${outerEnd.x} ${outerEnd.y}`,
      `Q ${outerMid.x} ${outerMid.y} ${outerStart.x} ${outerStart.y}`,
      "Z"
    ].join(" ");

    const shadow = createSvgElement("path");
    shadow.classList.add("space-raise-shadow");
    shadow.setAttribute("d", pathData);

    const buttonLayer = createSvgElement("g");
    buttonLayer.classList.add("space-button-layer");

    const path = createSvgElement("path");
    path.classList.add("space-path");
    path.setAttribute("d", pathData);

    const text = createSvgElement("text");
    text.classList.add("space-label");
    text.setAttribute("x", label.x);
    text.setAttribute("y", label.y);
    appendSpaceLabel(text, space.label);

    const tokens = createSvgElement("g");
    tokens.classList.add("svg-tokens");
    tokens.setAttribute("aria-hidden", "true");
    tokens.setAttribute("transform", `translate(${token.x} ${token.y})`);
    const tokensTitle = createSvgElement("title");
    tokensTitle.textContent = spaceTooltip(space, index);
    tokens.appendChild(tokensTitle);

    group.addEventListener("click", onSpacePress);
    group.addEventListener("keydown", onSpaceKeydown);
    group.addEventListener("pointerdown", onSpacePointerDown);

    buttonLayer.append(path, text, tokens);
    group.append(title, shadow, buttonLayer);
    svg.appendChild(group);
  });

  svg.appendChild(createSvgCapyFace(track));
}

function buildTrackGeometry(mobile) {
  return {
    start: mobile ? 220 : 220,
    span: mobile ? -260 : -260,
    center: mobile ? { x: 500, y: 380 } : { x: 500, y: 365 },
    face: mobile
      ? { cx: 500, cy: 390, rx: 366, ry: 154, sidePinch: 22 }
      : { cx: 500, cy: 365, rx: 338, ry: 205, sidePinch: 0 },
    faceTopY: mobile ? 292 : 184,
    thickness: mobile ? 118 : 125,
    labelOffset: mobile ? 65 : 68,
    tokenOffset: mobile ? 90 : 95,
    raiseOffset: mobile ? 12 : 14
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
    `C ${end.x - 46} ${track.faceTopY + 28} ${track.center.x + 135} ${track.faceTopY - 4} ${track.center.x} ${track.faceTopY}`,
    `C ${track.center.x - 135} ${track.faceTopY - 4} ${start.x + 46} ${track.faceTopY + 28} ${start.x} ${start.y}`,
    "Z"
  );
  return commands.join(" ");
}

function appendSpaceLabel(textEl, label) {
  if (!label) return;
  if (label.includes("\n")) {
    const lines = label.split("\n");
    lines.forEach((lineText, index) => {
      const line = createSvgElement("tspan");
      line.setAttribute("x", textEl.getAttribute("x"));
      line.setAttribute("dy", index === 0 ? `${(1 - lines.length) * 0.5}em` : "1em");
      line.textContent = lineText;
      textEl.appendChild(line);
    });
    return;
  }

  const words = label.split(" ");
  if (words.length === 1 || label.length <= 8) {
    textEl.textContent = label;
    return;
  }

  words.forEach((word, index) => {
    const line = createSvgElement("tspan");
    line.setAttribute("x", textEl.getAttribute("x"));
    line.setAttribute("dy", index === 0 ? `${(1 - words.length) * 0.5}em` : "1em");
    line.textContent = word;
    textEl.appendChild(line);
  });
}

function spaceTooltip(space, index) {
  return space.label ? space.label.replace(/\n/g, " ") : `Blank space ${index + 1}`;
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

function liftVector(track, degrees, amount) {
  const point = faceCurvePoint(track, degrees);
  const dx = point.x - track.center.x;
  const dy = point.y - track.center.y;
  const distance = Math.hypot(dx, dy) || 1;
  return {
    x: roundPoint(dx / distance * amount),
    y: roundPoint(dy / distance * amount)
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
  const canSpin = !state.busy && !state.over && (!hasPendingAction() || hasPendingSpinAgain());
  spinButton.textContent = setup ? "Spin for teams" : "Spin";
  spinButton.disabled = !canSpin;
  spinnerEl.classList.toggle("is-disabled", !canSpin);
  spinnerEl.classList.toggle("is-spin-ready", canSpin);
  spinnerEl.setAttribute("aria-disabled", String(!canSpin));
  spinnerEl.setAttribute("aria-label", setup ? "Spin for teams" : "Spin");
  spinnerPlayerTokenEl.hidden = !canSpin;
  spinnerPlayerTokenEl.innerHTML = canSpin ? playerTokenHtml(current, "spinner-turn-token") : "";
  const reversePlayer = savedReverseResponder();
  reverseButton.textContent = reversePlayer ? `Use ${reversePlayer.name}'s reverse` : "Use saved reverse";
  reverseButton.disabled = setup || state.over || !reversePlayer;

  updateSpaces(current);
  updateTeams();
  updateBoardScores();
  updateEarCharacters();
  updateMysteryEar();
  updatePowerButtons();
  updatePendingActions();
}

function updateSpaces(current) {
  document.querySelectorAll(".space").forEach((spaceEl) => {
    const index = Number(spaceEl.dataset.index);
    const actionable = isActionableSpace(index);
    const space = boardSpaces[index];
    const occupyingPlayers = state.players
      .filter((player) => player.position === index && !player.finished && state.phase === "race");
    const tokenLayer = spaceEl.querySelector(".svg-tokens");
    const title = tokenLayer.querySelector("title");
    tokenLayer.replaceChildren(title, ...occupyingPlayers.map((player, playerIndex) => {
      return svgPlayerToken(player, playerIndex, occupyingPlayers.length);
    }));
    spaceEl.classList.toggle("active", state.phase === "race" && index === current.position && !current.finished);
    spaceEl.classList.toggle("actionable", actionable);
    spaceEl.setAttribute("tabindex", actionable ? "0" : "-1");
    spaceEl.setAttribute("role", actionable ? "button" : "group");
    spaceEl.setAttribute("aria-label", actionable
      ? `${spaceTooltip(space, index)}. Press this board space to ${actionButtonLabel(state.pendingMove)}.`
      : spaceTooltip(space, index));
  });
}

function isActionableSpace(index) {
  if (!state.pendingMove || state.pendingCard || state.over) return false;
  const player = state.players[state.pendingMove.playerId];
  return Boolean(player && !player.finished && player.position === index);
}

function onSpacePress(event) {
  const index = Number(event.currentTarget.dataset.index);
  if (!isActionableSpace(index)) return;
  event.preventDefault();
  clearPressedSpaces();
  playPendingMove();
}

function onSpaceKeydown(event) {
  if (event.key !== "Enter" && event.key !== " ") return;
  onSpacePress(event);
}

function onSpacePointerDown(event) {
  if (!isActionableSpace(Number(event.currentTarget.dataset.index))) return;
  event.currentTarget.classList.add("is-pressed");
}

function clearPressedSpaces() {
  document.querySelectorAll(".space.is-pressed").forEach((spaceEl) => {
    spaceEl.classList.remove("is-pressed");
  });
}

function svgPlayerToken(player, tokenIndex, tokenCount) {
  const character = playerCharacter(player);
  const offset = tokenOffset(tokenIndex, tokenCount);
  const group = createSvgElement("g");
  group.classList.add("svg-character-token", player.team, character);
  group.setAttribute("transform", `translate(${offset.x} ${offset.y})`);

  const image = createSvgElement("image");
  image.classList.add("svg-character-art");
  const size = svgCharacterSize(character);
  image.setAttribute("href", size.href);
  image.setAttribute("x", -size.width / 2);
  image.setAttribute("y", -size.height / 2);
  image.setAttribute("width", size.width);
  image.setAttribute("height", size.height);
  image.setAttribute("preserveAspectRatio", "xMidYMid meet");

  const marker = createSvgElement("circle");
  marker.classList.add("svg-character-pad");
  marker.setAttribute("r", size.padRadius);

  const badge = createSvgElement("g");
  badge.classList.add("svg-character-badge");
  badge.setAttribute("transform", `translate(${size.badgeX} ${size.badgeY})`);
  const circle = createSvgElement("circle");
  circle.setAttribute("r", 5);
  const label = createSvgElement("text");
  label.textContent = player.id + 1;
  label.setAttribute("dy", "0.33em");
  badge.append(circle, label);

  group.append(marker, image, badge);
  return group;
}

function tokenOffset(tokenIndex, tokenCount) {
  const offsets = {
    1: [{ x: 0, y: 0 }],
    2: [{ x: -8, y: 0 }, { x: 8, y: 0 }],
    3: [{ x: 0, y: -8 }, { x: -8, y: 7 }, { x: 8, y: 7 }],
    4: [{ x: -8, y: -7 }, { x: 8, y: -7 }, { x: -8, y: 7 }, { x: 8, y: 7 }]
  };
  return offsets[tokenCount]?.[tokenIndex] || { x: 0, y: 0 };
}

function svgCharacterSize(character) {
  if (character === "capy-character") {
    return { href: "assets/capy-character.png", width: 34, height: 40, badgeX: 13, badgeY: 13, padRadius: 19 };
  }
  return { href: "assets/pelican-character.png", width: 46, height: 28, badgeX: 15, badgeY: 10, padRadius: 19 };
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

function updateBoardScores() {
  boardScoresEl.hidden = false;

  if (state.phase === "setup") {
    updateSetupBoardScores();
    return;
  }

  const capyPlayers = state.players.filter((player) => player.team === "capys");
  const pelicanPlayers = state.players.filter((player) => player.team === "pelicans");
  const entries = state.players.length === 2
    ? [
        { team: "capys", player: capyPlayers[0], corner: "top-left" },
        { team: "pelicans", player: pelicanPlayers[0], corner: "top-right" }
      ]
    : [
        { team: "capys", player: capyPlayers[0], corner: "top-left" },
        { team: "capys", player: capyPlayers[1], corner: "bottom-left" },
        { team: "pelicans", player: pelicanPlayers[0], corner: "top-right" },
        { team: "pelicans", player: pelicanPlayers[1], corner: "bottom-right" }
      ];

  boardScoresEl.innerHTML = entries
    .filter((entry) => entry.player)
    .map(boardScoreCardHtml)
    .join("");
}

function updateSetupBoardScores() {
  const entries = state.players.length === 2
    ? [
        { player: state.players[0], corner: "top-left" },
        { player: state.players[1], corner: "top-right" }
      ]
    : [
        { player: state.players[0], corner: "top-left" },
        { player: state.players[1], corner: "bottom-left" },
        { player: state.players[2], corner: "top-right" },
        { player: state.players[3], corner: "bottom-right" }
      ];

  boardScoresEl.innerHTML = entries
    .map(setupBoardScoreCardHtml)
    .join("");
}

function setupBoardScoreCardHtml({ player, corner }) {
  const roll = state.setupRolls[player.id];
  const current = player.id === state.setupTurn;
  const status = setupPlayerStatus(player, roll, current);
  const side = state.players.length === 4
    ? player.id < 2 ? "Team pair 1" : "Team pair 2"
    : "Team picker";

  return `
    <div class="board-score-card setup-pick ${corner} ${current ? "current" : ""}">
      <div class="board-score-topline">
        <span class="board-score-identity">
          ${playerTokenHtml(player, "board-score-token")}
          <span>${player.name}</span>
        </span>
        <strong>${roll ?? "-"}</strong>
      </div>
      <div class="board-score-player">${side}</div>
      <div class="board-setup-status">${status}</div>
    </div>
  `;
}

function setupPlayerStatus(player, roll, current) {
  if (roll !== null) return `Spun ${roll}`;
  if (current && state.busy) return "Spinning...";
  if (current) return "Spin now";
  return "Waiting";
}

function boardScoreCardHtml({ team, player, corner }) {
  const score = state.teams[team].score;
  const powers = availablePowers(team);
  const progress = powerProgressPercent(team);
  const powerText = powers > 0 ? `${powers} power ready` : `${pointsUntilPower(team)} to power`;
  const place = player.finished ? "Finished" : `Space ${player.position + 1}`;
  const actionClass = boardScoreActionClass(player);

  return `
    <div class="board-score-card ${corner} ${team} ${actionClass}">
      <div class="board-score-topline">
        <span class="board-score-identity">
          ${playerTokenHtml(player, "board-score-token")}
          <span>${teamLabel(team)}</span>
        </span>
        <strong>${score}</strong>
      </div>
      <div class="board-score-player">${player.name} · ${place}</div>
      <div class="board-power-meter" aria-label="${teamLabel(team)} 15 point power progress">
        <span style="width: ${progress}%"></span>
      </div>
      <div class="board-power-text">${powerText}</div>
    </div>
  `;
}

function boardScoreActionClass(player) {
  if (state.phase !== "race" || state.over || state.pendingCard) return "";
  return state.pendingMove?.playerId === player.id ? "needs-action" : "";
}

function powerProgressPercent(team) {
  if (availablePowers(team) > 0) return 100;
  const score = Math.max(0, state.teams[team].score);
  return Math.round((score % 15) / 15 * 100);
}

function updateEarCharacters() {
  if (state.phase !== "setup") {
    earCharactersEl.innerHTML = "";
    return;
  }

  earCharactersEl.innerHTML = state.players.map((player) => {
    return playerTokenHtml(player, "ear-token");
  }).join("");
}

function playerTokenHtml(player, baseClass) {
  const character = playerCharacter(player);
  return `
    <span class="${baseClass} character-token ${player.team} ${character}" aria-label="${player.name}">
      <span class="character-art" aria-hidden="true"></span>
      <span class="character-number">${player.id + 1}</span>
    </span>
  `;
}

function playerCharacter(player) {
  if (player.team === "capys") return "capy-character";
  if (player.team === "pelicans") return "pelican-character";
  return player.id % 2 === 0 ? "capy-character" : "pelican-character";
}

function updateMysteryEar() {
  const hasCard = Boolean(state.lastCard);
  const label = hasCard ? state.lastCard.title : "?";
  mysteryEarEl.classList.toggle("has-card", hasCard);
  mysteryEarEl.innerHTML = `<span>${label}</span><small>${state.deck.length} left</small>`;
}

function updatePendingActions() {
  if (state.pendingCard) {
    const player = state.players[state.pendingCard.playerId];
    pendingCardEl.hidden = true;
    pendingCardTitleEl.textContent = state.pendingCard.card.title;
    pendingCardTextEl.textContent = state.pendingCard.card.text;
    mysteryCardPopupEl.hidden = false;
    mysteryCardPlayerEl.innerHTML = `
      ${playerTokenHtml(player, "mystery-popup-token")}
      <span>${player.name} drew</span>
    `;
    mysteryCardTitleEl.textContent = state.pendingCard.card.title;
    mysteryCardTextEl.textContent = state.pendingCard.card.text;
  } else {
    pendingCardEl.hidden = true;
    mysteryCardPopupEl.hidden = true;
  }

  if (state.pendingMove) {
    pendingMoveEl.hidden = false;
    pendingMoveTitleEl.textContent = state.pendingMove.label;
    pendingMoveHelpEl.textContent = hasPendingSpinAgain()
      ? "Press the raised board space or spin now."
      : `Press the raised board space to ${actionButtonLabel(state.pendingMove)}.`;
  } else {
    pendingMoveEl.hidden = true;
  }
}

function actionButtonLabel(action) {
  if (action.kind === "move") {
    if (action.amount < 0) return `Move back ${Math.abs(action.amount)}`;
    return `Move ${action.amount}`;
  }
  if (action.kind === "points") return action.label.replace(/\n/g, " ");
  if (action.kind === "spinAgain") return "Spin again";
  return action.label.replace(/\n/g, " ");
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function spin() {
  if (state.phase === "setup") {
    setupSpin();
    return;
  }
  if (hasPendingSpinAgain()) {
    playPendingMove();
    return;
  }
  raceSpin();
}

function setupSpin() {
  if (state.busy || state.over) return;
  state.busy = true;
  updateUi();
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
    const bestRoll = Math.max(...state.setupRolls);
    const winners = state.setupRolls
      .map((roll, index) => roll === bestRoll ? index : null)
      .filter((index) => index !== null);
    if (winners.length !== 1) {
      state.setupTurn = 0;
      state.setupRolls = Array(state.players.length).fill(null);
      addLog("Tie spin. Spin again to decide teams.");
      return;
    }
    assignTeams(winners);
  } else {
    const teamTotals = [
      { total: state.setupRolls[0] + state.setupRolls[1], ids: [0, 1] },
      { total: state.setupRolls[2] + state.setupRolls[3], ids: [2, 3] }
    ];
    if (teamTotals[0].total === teamTotals[1].total) {
      state.setupTurn = 0;
      state.setupRolls = Array(state.players.length).fill(null);
      addLog("Tie total. Everyone spins again.");
      return;
    }
    assignTeams(teamTotals[0].total > teamTotals[1].total ? teamTotals[0].ids : teamTotals[1].ids);
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
  updateUi();
  const result = spinWheel();
  addLog(`${player.name} spun ${result}.`);

  setTimeout(async () => {
    await movePlayer(state, player, result, "spin");
    const keepsTurn = await resolveSpace(state, player);
    if (!state.over && !keepsTurn && !hasPendingAction()) endTurn();
  }, 760);
}

function spinWheel() {
  const result = randomSpinResult();
  const segmentCenter = (result - 1) * 60 + 30;
  const targetRotation = (360 - segmentCenter) % 360;
  const currentRotation = ((state.spinRotation % 360) + 360) % 360;
  const extraTurn = targetRotation >= currentRotation
    ? targetRotation - currentRotation
    : targetRotation + 360 - currentRotation;
  state.spinRotation += 720 + extraTurn;
  wheelEl.style.setProperty("--spin", `${state.spinRotation}deg`);
  return result;
}

function randomSpinResult() {
  if (window.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    const fairLimit = Math.floor(0x100000000 / 6) * 6;
    do {
      window.crypto.getRandomValues(values);
    } while (values[0] >= fairLimit);
    return values[0] % 6 + 1;
  }

  return 1 + Math.floor(Math.random() * 6);
}

async function movePlayer(game, player, amount, source) {
  if (player.finished) return;
  const finish = boardSpaces.length - 1;
  const start = player.position;
  const path = movementPath(start, amount, finish);
  const bounced = amount > 0 && start + amount > finish;

  for (const position of path) {
    player.position = position;
    updateUi();
    await sleep(MOVE_STEP_MS);
  }

  if (player.position === finish) {
    player.finished = true;
    addLog(`${player.name} reached the finish.`);
    checkWinner(game);
    return;
  }
  if (bounced) {
    addLog(`${player.name} bounced back to space ${player.position + 1}.`);
  } else if (source === "card" || source === "power") {
    addLog(`${player.name} moved to space ${player.position + 1}.`);
  }
}

async function movePlayerTo(game, player, target, source) {
  const finish = boardSpaces.length - 1;
  const destination = Math.max(0, Math.min(finish, target));
  await movePlayer(game, player, destination - player.position, source);
}

function movementPath(start, amount, finish) {
  const path = [];
  let position = start;

  if (amount > 0) {
    let direction = 1;
    for (let step = 0; step < amount; step += 1) {
      if (position >= finish) direction = -1;
      position += direction;
      if (position >= finish) {
        position = finish;
        direction = -1;
      }
      path.push(position);
    }
    return path;
  }

  const destination = Math.max(0, start + amount);
  while (position > destination) {
    position -= 1;
    path.push(position);
  }
  return path;
}

async function resolveSpace(game, player) {
  if (player.finished || game.over) return false;
  const space = boardSpaces[player.position];

  if (space.move) {
    return queueSpaceAction(game, player, { kind: "move", amount: space.move, label: space.label });
  }
  if (space.points) {
    return queueSpaceAction(game, player, {
      kind: "points",
      points: space.points,
      spinAgain: Boolean(space.spinAgain),
      label: space.label
    });
  }
  if (isMysterySpace(space)) {
    addLog(`${player.name} landed on ${space.label}.`);
    const drewCard = await drawMystery(game, player);
    return drewCard || hasPendingAction();
  }
  if (space.spinAgain && !game.over) {
    return queueSpaceAction(game, player, { kind: "spinAgain", label: space.label });
  }
  if (space.skipNext) {
    return queueSpaceAction(game, player, { kind: "skipNext", label: space.label });
  }
  if (space.switchPlaces) {
    return queueSpaceAction(game, player, { kind: "switchPlaces", label: space.label });
  }
  return false;
}

function queueSpaceAction(game, player, action) {
  game.busy = false;
  game.pendingMove = {
    playerId: player.id,
    ...action
  };
  addLog(`${player.name} landed on ${action.label.replace(/\n/g, " ")}.`);
  updateUi();
  return true;
}

function isMysterySpace(space) {
  return space?.type === "mystery";
}

async function drawMystery(game, player, chained = false) {
  if (game.deck.length === 0) {
    addLog("No mystery cards are left.");
    return false;
  }

  const card = game.deck.pop();
  game.lastCard = card;
  game.busy = false;
  game.pendingCard = {
    playerId: player.id,
    card,
    startingPosition: player.position,
    chained
  };
  addLog(`${player.name} drew ${card.title}: ${card.text}`);
  updateUi();
  return true;
}

function hasPendingAction() {
  return Boolean(state.pendingCard || state.pendingMove);
}

function hasPendingSpinAgain() {
  return state.pendingMove?.kind === "spinAgain";
}

function savedReverseResponder() {
  if (state.phase !== "race" || state.over || !state.pendingCard) return null;
  const cardPlayer = state.players[state.pendingCard.playerId];
  if (!cardPlayer || !Number.isFinite(state.pendingCard.card.reverseMoveAmount)) return null;
  return state.players.find((player) => {
    return player.team !== cardPlayer.team && player.savedReverse && !player.finished;
  }) || null;
}

async function playPendingCard() {
  const pending = state.pendingCard;
  if (!pending || state.over) return;
  const player = state.players[pending.playerId];
  state.pendingCard = null;
  state.usedCards.push(pending.card);
  if (state.lastCard === pending.card) state.lastCard = null;
  addLog(`${player.name} played ${pending.card.title}.`);
  updateUi();
  await pending.card.apply(state, player);
  await finishPendingAction(player, pending.startingPosition);
}

async function playPendingMove() {
  const pending = state.pendingMove;
  if (!pending || state.over) return;
  const player = state.players[pending.playerId];
  state.pendingMove = null;
  const startingPosition = player.position;
  addLog(`${pending.label.replace(/\n/g, " ")}.`);
  updateUi();
  if (pending.kind === "move") {
    await movePlayer(state, player, pending.amount, "space");
    await finishPendingAction(player, startingPosition);
    return;
  }
  if (pending.kind === "points") {
    addPoints(state, player.team, pending.points);
    if (pending.spinAgain && !state.over) {
      grantExtraSpin(player);
      return;
    }
    await finishPendingAction(player, null);
    return;
  }
  if (pending.kind === "spinAgain") {
    raceSpin();
    return;
  }
  if (pending.kind === "skipNext") {
    const next = nextLivingPlayer(state);
    next.skip = true;
    addLog(`${next.name} will skip a turn.`);
    await finishPendingAction(player, null);
    return;
  }
  if (pending.kind === "switchPlaces") {
    switchPlacesWithLeader(state, player);
  }
  await finishPendingAction(player, null);
}

function grantExtraSpin(player) {
  addLog(`${player.name} gets an extra spin.`);
  state.busy = false;
  updateUi();
}

async function finishPendingAction(player, startingPosition) {
  if (state.over) return;

  if (startingPosition !== null && player.position !== startingPosition && !player.finished) {
    const keepsTurn = await resolveSpace(state, player);
    if (keepsTurn || hasPendingAction() || state.over) return;
  }

  if (state.queuedMysteryDraws > 0) {
    state.queuedMysteryDraws -= 1;
    const drewCard = await drawMystery(state, player, true);
    if (drewCard || hasPendingAction()) return;
  }

  if (!state.over && !hasPendingAction()) endTurn();
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

async function usePowerUp() {
  if (state.phase !== "race" || state.busy || state.over) return;
  const player = currentPlayer();
  if (availablePowers(player.team) <= 0) return;
  state.busy = true;
  spendPower(player.team);
  addLog(`${teamLabel(player.team)} used 15 points to move ${player.name} up 5.`);
  await movePlayer(state, player, 5, "power");
  state.busy = false;
  updateUi();
}

async function usePowerDown() {
  if (state.phase !== "race" || state.busy || state.over) return;
  const player = currentPlayer();
  if (availablePowers(player.team) <= 0) return;
  const opponent = mostAdvancedOpponent(player.team);
  if (!opponent) return;
  state.busy = true;
  spendPower(player.team);
  addLog(`${teamLabel(player.team)} used 15 points to move ${opponent.name} down 5.`);
  await movePlayer(state, opponent, -5, "power");
  state.busy = false;
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
  updateUi();
}

async function useSavedReverse() {
  const pending = state.pendingCard;
  const player = savedReverseResponder();
  if (!pending || !player) return;
  const cardPlayer = state.players[pending.playerId];
  const amount = pending.card.reverseMoveAmount;
  const startingPosition = player.position;
  state.pendingCard = null;
  state.usedCards.push(pending.card);
  if (state.lastCard === pending.card) state.lastCard = null;
  player.savedReverse = false;
  addLog(`${player.name} used a saved reverse on ${cardPlayer.name}'s ${pending.card.title}.`);
  updateUi();
  await movePlayer(state, player, amount, "card");
  await finishPendingAction(player, startingPosition);
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
  const winner = ["capys", "pelicans"].find((team) => {
    return game.players.some((player) => player.team === team && player.finished);
  });

  if (!winner) return;

  game.over = true;
  game.busy = false;
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

function onSpinnerKeydown(event) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  spin();
}

spinButton.addEventListener("click", spin);
spinnerEl.addEventListener("click", spin);
spinnerEl.addEventListener("keydown", onSpinnerKeydown);
reverseButton.addEventListener("click", useSavedReverse);
playCardButton.addEventListener("click", playPendingCard);
mysteryCardPopupEl.addEventListener("click", playPendingCard);
powerUpButton.addEventListener("click", usePowerUp);
powerDownButton.addEventListener("click", usePowerDown);
newGameButton.addEventListener("click", createGame);
playerCountSelect.addEventListener("change", createGame);
rulesButton.addEventListener("click", toggleRules);
window.addEventListener("resize", () => {
  renderBoard();
  updateUi();
});
window.addEventListener("pointerup", clearPressedSpaces);
window.addEventListener("pointercancel", clearPressedSpaces);

createGame();
