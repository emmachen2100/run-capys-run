local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local root = ReplicatedStorage:WaitForChild("RunCapysRun")
local Config = require(root.Shared.GameConfig)

local remotes = root:FindFirstChild("Remotes") or Instance.new("Folder")
remotes.Name = "Remotes"
remotes.Parent = root

local function remoteEvent(name)
	local event = remotes:FindFirstChild(name) or Instance.new("RemoteEvent")
	event.Name = name
	event.Parent = remotes
	return event
end

local stateChanged = remoteEvent("StateChanged")
local requestSpin = remoteEvent("RequestSpin")
local requestNewRound = remoteEvent("RequestNewRound")
local requestSavedReverse = remoteEvent("RequestSavedReverse")
local requestPlayCard = remoteEvent("RequestPlayCard")
local requestDeclineReverse = remoteEvent("RequestDeclineReverse")

local boardModel
local spaceParts = {}
local tokenParts = {}
local state
local joinOrder = {}
local joinCounter = 0
local roundCounter = 0

local SPACE_COLORS = {
	start = Color3.fromRGB(248, 220, 154),
	finish = Color3.fromRGB(248, 220, 154),
	mystery = Color3.fromRGB(241, 207, 184),
	points = Color3.fromRGB(246, 239, 217),
	move = Color3.fromRGB(220, 235, 207),
	reverse = Color3.fromRGB(223, 237, 242),
}

local function wrap(value, length)
	return ((value - 1) % length) + 1
end

local function addLog(message)
	table.insert(state.logs, 1, message)
	while #state.logs > 10 do
		table.remove(state.logs)
	end
end

local function shuffle(items)
	local copy = table.clone(items)
	for index = #copy, 2, -1 do
		local other = math.random(index)
		copy[index], copy[other] = copy[other], copy[index]
	end
	return copy
end

local function buildDeck()
	local deck = {}
	for _, card in ipairs(Config.CardBlueprints) do
		for _ = 1, card.count do
			table.insert(deck, card.id)
		end
	end
	return shuffle(deck)
end

local function currentPlayer()
	if not state or #state.players == 0 then
		return nil
	end
	return state.players[state.turnIndex]
end

local function nextLivingPlayer()
	local index = state.turnIndex
	for _ = 1, #state.players do
		index = wrap(index + state.direction, #state.players)
		local playerState = state.players[index]
		if not playerState.finished then
			return playerState
		end
	end
	return currentPlayer()
end

local function teamLabel(teamId)
	return Config.TeamLabel(teamId)
end

local function makePart(parent, name, size, cframe, color)
	local part = Instance.new("Part")
	part.Name = name
	part.Anchored = true
	part.Size = size
	part.CFrame = cframe
	part.Color = color
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	part.Parent = parent
	return part
end

local function addTopLabel(part, text, textSize)
	local gui = Instance.new("SurfaceGui")
	gui.Name = "TopLabel"
	gui.Face = Enum.NormalId.Top
	gui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	gui.PixelsPerStud = 24
	gui.Parent = part

	local label = Instance.new("TextLabel")
	label.BackgroundTransparency = 1
	label.Size = UDim2.fromScale(1, 1)
	label.Font = Enum.Font.FredokaOne
	label.Text = text
	label.TextColor3 = Color3.fromRGB(28, 24, 21)
	label.TextScaled = true
	label.TextSize = textSize
	label.TextWrapped = true
	label.Parent = gui
end

local function boardPosition(index)
	local count = #Config.BoardSpaces
	local angle = math.rad(220 + ((index - 1) / count) * 360)
	local xRadius = 64
	local zRadius = 42
	return Vector3.new(math.cos(angle) * xRadius, 1.1, math.sin(angle) * zRadius), angle
end

local function buildCapyCenter(parent)
	makePart(parent, "CapyBody", Vector3.new(28, 8, 18), CFrame.new(0, 4.5, 0), Color3.fromRGB(216, 163, 123)).Shape = Enum.PartType.Ball
	makePart(parent, "CapyHead", Vector3.new(16, 7, 12), CFrame.new(0, 7, -12), Color3.fromRGB(216, 163, 123)).Shape = Enum.PartType.Ball
	makePart(parent, "CapyNose", Vector3.new(7, 3, 4), CFrame.new(0, 6.8, -18), Color3.fromRGB(242, 225, 207)).Shape = Enum.PartType.Ball
	makePart(parent, "LeftEar", Vector3.new(3, 4, 3), CFrame.new(-6, 11, -12), Color3.fromRGB(184, 121, 80)).Shape = Enum.PartType.Ball
	makePart(parent, "RightEar", Vector3.new(3, 4, 3), CFrame.new(6, 11, -12), Color3.fromRGB(184, 121, 80)).Shape = Enum.PartType.Ball
	makePart(parent, "LeftEye", Vector3.new(1.2, 1.2, 1.2), CFrame.new(-4, 8, -18), Color3.fromRGB(34, 27, 23)).Shape = Enum.PartType.Ball
	makePart(parent, "RightEye", Vector3.new(1.2, 1.2, 1.2), CFrame.new(4, 8, -18), Color3.fromRGB(34, 27, 23)).Shape = Enum.PartType.Ball
end

local function buildBoard()
	if boardModel then
		boardModel:Destroy()
	end

	boardModel = Instance.new("Model")
	boardModel.Name = "RunCapysRunBoard"
	boardModel.Parent = Workspace
	spaceParts = {}
	tokenParts = {}

	local base = makePart(boardModel, "BoardBase", Vector3.new(150, 1, 105), CFrame.new(0, 0, 0), Color3.fromRGB(255, 244, 223))
	base.Material = Enum.Material.SmoothPlastic
	buildCapyCenter(boardModel)

	for index, space in ipairs(Config.BoardSpaces) do
		local position, angle = boardPosition(index)
		local color = SPACE_COLORS[space.type] or Color3.fromRGB(255, 250, 241)
		local part = makePart(
			boardModel,
			string.format("%02d_%s", index, space.type),
			Vector3.new(9, 0.4, 5.8),
			CFrame.new(position) * CFrame.Angles(0, -angle, 0),
			color
		)
		part.Material = Enum.Material.SmoothPlastic
		addTopLabel(part, space.label, 24)
		spaceParts[index] = part
	end
end

local function tokenPosition(playerState)
	local part = spaceParts[playerState.position]
	if not part then
		return CFrame.new(0, 5, 0)
	end

	local offsetIndex = ((playerState.id - 1) % 4)
	local x = (offsetIndex % 2 == 0) and -1.6 or 1.6
	local z = (offsetIndex < 2) and -1.1 or 1.1
	return part.CFrame * CFrame.new(x, 3.4, z)
end

local function updateTokens()
	for _, playerState in ipairs(state.players) do
		local token = tokenParts[playerState.userId]
		if playerState.finished then
			if token then
				token:Destroy()
				tokenParts[playerState.userId] = nil
			end
			continue
		end

		if not token then
			token = makePart(
				boardModel,
				"Token_" .. playerState.name,
				Vector3.new(3, 3, 3),
				tokenPosition(playerState),
				Config.Teams[playerState.team].color
			)
			token.Shape = Enum.PartType.Ball
			token.Material = Enum.Material.SmoothPlastic
			addTopLabel(token, tostring(playerState.id), 20)
			tokenParts[playerState.userId] = token
		end

		TweenService:Create(token, TweenInfo.new(0.25, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
			CFrame = tokenPosition(playerState),
		}):Play()
	end
end

local function publicState()
	local players = {}
	for _, playerState in ipairs(state.players) do
		table.insert(players, {
			id = playerState.id,
			userId = playerState.userId,
			name = playerState.name,
			team = playerState.team,
			position = playerState.position,
			finished = playerState.finished,
			skip = playerState.skip,
			savedReverse = playerState.savedReverse,
		})
	end

	local pendingCard
	if state.pendingCard then
		local card = Config.CardById(state.pendingCard.cardId)
		pendingCard = {
			playerId = state.pendingCard.playerId,
			cardId = state.pendingCard.cardId,
			title = card and card.title or state.pendingCard.cardId,
			text = card and card.text or "",
			reverseText = card and card.reverseText or "",
		}
	end

	return {
		players = players,
		teams = state.teams,
		turnIndex = state.turnIndex,
		direction = state.direction,
		busy = state.busy,
		over = state.over,
		logs = state.logs,
		spinResult = state.spinResult,
		winner = state.winner,
		boardSpaces = Config.BoardSpaces,
		teamInfo = Config.Teams,
		pendingCard = pendingCard,
		pendingReverseChoice = state.pendingReverseChoice,
		deckLeft = #state.deck,
	}
end

local function broadcast()
	updateTokens()
	stateChanged:FireAllClients(publicState())
end

local function checkWinner()
	local needed = (#state.players >= 4) and 2 or 1
	for _, teamId in ipairs({ "capys", "pelicans" }) do
		local finished = 0
		for _, playerState in ipairs(state.players) do
			if playerState.team == teamId and playerState.finished then
				finished += 1
			end
		end

		if finished >= needed then
			state.over = true
			state.winner = teamId
			addLog(teamLabel(teamId) .. " team wins.")
			return
		end
	end
end

local function addPoints(teamId, amount)
	state.teams[teamId].score += amount
	local sign = amount > 0 and "+" or ""
	addLog(teamLabel(teamId) .. " team gets " .. sign .. amount .. " points.")
end

local function movePlayer(playerState, amount, source)
	if playerState.finished then
		return
	end

	local finish = #Config.BoardSpaces
	local position = playerState.position
	if amount > 0 then
		local direction = 1
		for _ = 1, amount do
			if position >= finish then
				direction = -1
			end
			position += direction
			if position >= finish then
				position = finish
				direction = -1
			end
		end
	else
		position = math.max(1, position + amount)
	end

	playerState.position = math.clamp(position, 1, finish)
	if playerState.position == finish then
		playerState.finished = true
		addLog(playerState.name .. " reached the finish.")
		checkWinner()
		return
	end

	if source == "card" then
		addLog(playerState.name .. " moved to " .. Config.BoardSpaces[playerState.position].label .. ".")
	end
end

local function switchPoints()
	state.teams.capys.score, state.teams.pelicans.score = state.teams.pelicans.score, state.teams.capys.score
	addLog("The teams switched points.")
end

local function switchPlacesWithLeader(playerState)
	local leader
	for _, other in ipairs(state.players) do
		if other.userId ~= playerState.userId and not other.finished and (not leader or other.position > leader.position) then
			leader = other
		end
	end

	if not leader then
		return
	end

	playerState.position, leader.position = leader.position, playerState.position
	addLog(playerState.name .. " switched places with " .. leader.name .. ".")
end

local drawMystery
local resolveSpace
local endTurn

local function applyCard(cardId, playerState, reversed)
	if cardId == "MoveForward" then
		movePlayer(playerState, reversed and -3 or 3, "card")
	elseif cardId == "MoveBackward" then
		movePlayer(playerState, reversed and 1 or -1, "card")
	elseif cardId == "Reverse" then
		playerState.savedReverse = true
		addLog(playerState.name .. " saved a reverse card.")
	elseif cardId == "BackToStart" then
		playerState.position = reversed and #Config.BoardSpaces or 1
		addLog(playerState.name .. (reversed and " went to Finish." or " went back to start."))
		if playerState.position == #Config.BoardSpaces then
			playerState.finished = true
			checkWinner()
		end
	elseif cardId == "PlusPoints" then
		addPoints(playerState.team, reversed and -5 or 5)
	elseif cardId == "MinusPoints" then
		addPoints(playerState.team, reversed and 4 or -4)
	elseif cardId == "SkipTurn" then
		local nextPlayer = nextLivingPlayer()
		nextPlayer.skip = true
		addLog(nextPlayer.name .. " will skip a turn.")
	elseif cardId == "Oops" then
		addLog(playerState.name .. " got an Oops card. Nothing happens.")
	elseif cardId == "SwitchPoints" then
		switchPoints()
	elseif cardId == "DoublePoints" then
		if reversed then
			state.teams[playerState.team].score = math.floor(state.teams[playerState.team].score / 2)
			addLog(teamLabel(playerState.team) .. " points were cut in half.")
		else
			state.teams[playerState.team].score *= 2
			addLog(teamLabel(playerState.team) .. " doubled its points.")
		end
	elseif cardId == "PickTwoMoreCards" then
		state.queuedMysteryDraws += 2
		addLog("Two more mystery cards are waiting.")
	elseif cardId == "SwitchPlaces" then
		switchPlacesWithLeader(playerState)
	end
end

drawMystery = function(playerState, chained)
	if #state.deck == 0 then
		addLog("No mystery cards are left.")
		return
	end

	local cardId = table.remove(state.deck)
	local card = Config.CardById(cardId)
	addLog(playerState.name .. " drew " .. card.title .. ": " .. card.text)
	state.pendingCard = {
		playerId = playerState.id,
		cardId = cardId,
		startingPosition = playerState.position,
		chained = chained,
		reverseOffered = false,
	}
	broadcast()
end

local function canReverseCard(cardId)
	local card = Config.CardById(cardId)
	return card and card.reversible
end

local function nextSavedReverseResponder(pending)
	if not pending or not canReverseCard(pending.cardId) then
		return nil
	end

	local cardPlayer = state.players[pending.playerId]
	if not cardPlayer then
		return nil
	end

	for step = 1, #state.players do
		local candidate = state.players[wrap(cardPlayer.id + state.direction * step, #state.players)]
		if candidate.team ~= cardPlayer.team and candidate.savedReverse and not candidate.finished then
			return candidate
		end
	end

	return nil
end

local function completePendingCard(reversed)
	local pending = state.pendingCard
	if not pending or state.over then
		return
	end

	local playerState = state.players[pending.playerId]
	state.pendingCard = nil
	state.pendingReverseChoice = nil
	table.insert(state.discard, pending.cardId)
	addLog(playerState.name .. " played " .. Config.CardById(pending.cardId).title .. (reversed and " reversed." or "."))
	applyCard(pending.cardId, playerState, reversed)

	local keepsTurn = false
	if not state.over and playerState and not playerState.finished then
		local space = Config.BoardSpaces[playerState.position]
		if space.type ~= "mystery" then
			keepsTurn = resolveSpace(playerState)
		end
	end

	if not state.over and not state.pendingCard and not state.pendingReverseChoice and state.queuedMysteryDraws > 0 then
		state.queuedMysteryDraws -= 1
		drawMystery(playerState, true)
		return
	end

	if keepsTurn and not state.pendingCard and not state.pendingReverseChoice then
		state.busy = false
		broadcast()
	elseif not state.over and not state.pendingCard and not state.pendingReverseChoice then
		endTurn()
	else
		broadcast()
	end
end

resolveSpace = function(playerState)
	if playerState.finished or state.over then
		return false
	end

	local space = Config.BoardSpaces[playerState.position]
	if space.points then
		addPoints(playerState.team, space.points)
	end

	if space.saveReverse then
		playerState.savedReverse = true
		addLog(playerState.name .. " saved a reverse card.")
	end

	if space.reverseNow then
		state.direction *= -1
		addLog("Play order reversed.")
	end

	if space.skipNext then
		local nextPlayer = nextLivingPlayer()
		nextPlayer.skip = true
		addLog(nextPlayer.name .. " will skip a turn.")
	end

	if space.switchPlaces then
		switchPlacesWithLeader(playerState)
	end

	if space.move then
		addLog(space.label .. ".")
		movePlayer(playerState, space.move, "space")
	end

	if space.type == "mystery" then
		drawMystery(playerState, false)
		return true
	end

	if space.spinAgain and not state.over then
		addLog(playerState.name .. " gets an extra spin.")
		return true
	end

	return false
end

endTurn = function()
	state.busy = false
	if state.over then
		broadcast()
		return
	end

	for _ = 1, #state.players do
		state.turnIndex = wrap(state.turnIndex + state.direction, #state.players)
		if not currentPlayer().finished then
			break
		end
	end

	broadcast()
end

local function participantPlayers()
	local allPlayers = Players:GetPlayers()
	table.sort(allPlayers, function(left, right)
		return (joinOrder[left.UserId] or 0) < (joinOrder[right.UserId] or 0)
	end)

	local participants = {}
	for _, player in ipairs(allPlayers) do
		if #participants >= Config.MaxPlayers then
			break
		end
		table.insert(participants, player)
	end
	return participants
end

local function newRound()
	roundCounter += 1
	local participants = participantPlayers()
	local gamePlayers = {}

	for index, player in ipairs(participants) do
		local teamId = (index % 2 == 1) and "capys" or "pelicans"
		table.insert(gamePlayers, {
			id = index,
			userId = player.UserId,
			name = player.DisplayName,
			team = teamId,
			position = 1,
			finished = false,
			skip = false,
			savedReverse = false,
		})
	end

	state = {
		players = gamePlayers,
		teams = {
			capys = { score = 0 },
			pelicans = { score = 0 },
		},
		turnIndex = 1,
		direction = 1,
		deck = buildDeck(),
		discard = {},
		queuedMysteryDraws = 0,
		pendingCard = nil,
		pendingReverseChoice = nil,
		busy = false,
		over = false,
		roundId = roundCounter,
		winner = nil,
		logs = {},
		spinResult = nil,
	}

	addLog("New game started. Spin to race around the capybara board.")
	buildBoard()
	broadcast()
end

requestSpin.OnServerEvent:Connect(function(player)
	if not state or state.busy or state.over or state.pendingCard or state.pendingReverseChoice then
		return
	end

	local playerState = currentPlayer()
	if not playerState or playerState.userId ~= player.UserId then
		return
	end

	if playerState.skip then
		playerState.skip = false
		addLog(playerState.name .. " skipped this turn.")
		endTurn()
		return
	end

	state.busy = true
	state.spinResult = math.random(1, 6)
	local roundId = state.roundId
	addLog(playerState.name .. " spun " .. state.spinResult .. ".")
	broadcast()

	task.delay(0.7, function()
		if not state or state.over or state.roundId ~= roundId then
			return
		end

		movePlayer(playerState, state.spinResult, "spin")
		local keepsTurn = resolveSpace(playerState)
		if not state.over and not keepsTurn then
			endTurn()
		else
			state.busy = false
			broadcast()
		end
	end)
end)

requestPlayCard.OnServerEvent:Connect(function(player)
	if not state or state.busy or state.over or not state.pendingCard or state.pendingReverseChoice then
		return
	end

	local pending = state.pendingCard
	local cardPlayer = state.players[pending.playerId]
	if not cardPlayer or cardPlayer.userId ~= player.UserId then
		return
	end

	local reversePlayer = pending.reverseOffered and nil or nextSavedReverseResponder(pending)
	if reversePlayer then
		pending.reverseOffered = true
		state.pendingReverseChoice = {
			reversePlayerId = reversePlayer.id,
		}
		addLog(reversePlayer.name .. " can use a saved reverse.")
		broadcast()
		return
	end

	completePendingCard(false)
end)

requestSavedReverse.OnServerEvent:Connect(function(player)
	if not state or state.busy or state.over or not state.pendingCard or not state.pendingReverseChoice then
		return
	end

	local reversePlayer = state.players[state.pendingReverseChoice.reversePlayerId]
	if not reversePlayer or reversePlayer.userId ~= player.UserId or not reversePlayer.savedReverse then
		return
	end

	reversePlayer.savedReverse = false
	addLog(reversePlayer.name .. " used a saved reverse.")
	completePendingCard(true)
end)

requestDeclineReverse.OnServerEvent:Connect(function(player)
	if not state or state.busy or state.over or not state.pendingCard or not state.pendingReverseChoice then
		return
	end

	local reversePlayer = state.players[state.pendingReverseChoice.reversePlayerId]
	if not reversePlayer or reversePlayer.userId ~= player.UserId then
		return
	end

	state.pendingReverseChoice = nil
	addLog(reversePlayer.name .. " kept the saved reverse.")
	completePendingCard(false)
end)

local function onPlayerAdded(player)
	joinCounter += 1
	joinOrder[player.UserId] = joinCounter
	player.CharacterAdded:Connect(function(character)
		local humanoidRootPart = character:WaitForChild("HumanoidRootPart", 8)
		if humanoidRootPart then
			humanoidRootPart.CFrame = CFrame.new(0, 9, 65)
		end
	end)

	task.defer(function()
		if not state or #state.players == 0 then
			newRound()
		else
			broadcast()
		end
	end)
end

requestNewRound.OnServerEvent:Connect(function()
	newRound()
end)

Players.PlayerAdded:Connect(onPlayerAdded)

for _, player in ipairs(Players:GetPlayers()) do
	onPlayerAdded(player)
end

Players.PlayerRemoving:Connect(function()
	task.defer(newRound)
end)

buildBoard()
task.delay(1, function()
	if not state then
		newRound()
	end
end)
