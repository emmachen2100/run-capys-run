local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local localPlayer = Players.LocalPlayer
local root = ReplicatedStorage:WaitForChild("RunCapysRun")
local remotes = root:WaitForChild("Remotes")

local stateChanged = remotes:WaitForChild("StateChanged")
local requestSpin = remotes:WaitForChild("RequestSpin")
local requestNewRound = remotes:WaitForChild("RequestNewRound")
local requestSavedReverse = remotes:WaitForChild("RequestSavedReverse")
local requestPlayCard = remotes:WaitForChild("RequestPlayCard")
local requestDeclineReverse = remotes:WaitForChild("RequestDeclineReverse")

local currentState

local screenGui = Instance.new("ScreenGui")
screenGui.Name = "RunCapysRunHud"
screenGui.ResetOnSpawn = false
screenGui.Parent = localPlayer:WaitForChild("PlayerGui")

local function create(className, props, children)
	local instance = Instance.new(className)
	for key, value in pairs(props or {}) do
		instance[key] = value
	end
	for _, child in ipairs(children or {}) do
		child.Parent = instance
	end
	return instance
end

local colors = {
	ink = Color3.fromRGB(28, 24, 21),
	paper = Color3.fromRGB(255, 250, 241),
	paperStrong = Color3.fromRGB(255, 244, 223),
	line = Color3.fromRGB(42, 37, 33),
	sun = Color3.fromRGB(229, 185, 78),
	capy = Color3.fromRGB(184, 121, 80),
	pelican = Color3.fromRGB(85, 117, 154),
}

local main = create("Frame", {
	Name = "Panel",
	AnchorPoint = Vector2.new(1, 0),
	Position = UDim2.new(1, -18, 0, 18),
	Size = UDim2.new(0, 360, 0, 560),
	BackgroundColor3 = colors.paper,
	BorderColor3 = colors.line,
	BorderSizePixel = 3,
	Parent = screenGui,
})

create("UICorner", { CornerRadius = UDim.new(0, 4), Parent = main })
create("UIPadding", {
	PaddingTop = UDim.new(0, 14),
	PaddingRight = UDim.new(0, 14),
	PaddingBottom = UDim.new(0, 14),
	PaddingLeft = UDim.new(0, 14),
	Parent = main,
})

local title = create("TextLabel", {
	BackgroundTransparency = 1,
	Font = Enum.Font.FredokaOne,
	Text = "Run, Capys, Run",
	TextColor3 = Color3.fromRGB(157, 89, 112),
	TextSize = 28,
	TextXAlignment = Enum.TextXAlignment.Left,
	Size = UDim2.new(1, 0, 0, 34),
	Parent = main,
})

local turnLabel = create("TextLabel", {
	BackgroundTransparency = 1,
	Font = Enum.Font.GothamBold,
	Text = "Waiting for game...",
	TextColor3 = colors.ink,
	TextSize = 18,
	TextWrapped = true,
	TextXAlignment = Enum.TextXAlignment.Left,
	Position = UDim2.new(0, 0, 0, 48),
	Size = UDim2.new(1, 0, 0, 48),
	Parent = main,
})

local spinResult = create("TextLabel", {
	BackgroundColor3 = colors.paperStrong,
	BorderColor3 = colors.line,
	BorderSizePixel = 2,
	Font = Enum.Font.FredokaOne,
	Text = "-",
	TextColor3 = colors.ink,
	TextSize = 54,
	Position = UDim2.new(0, 0, 0, 108),
	Size = UDim2.new(0, 104, 0, 94),
	Parent = main,
})

local spinButton = create("TextButton", {
	BackgroundColor3 = colors.sun,
	BorderColor3 = colors.line,
	BorderSizePixel = 2,
	Font = Enum.Font.FredokaOne,
	Text = "Spin",
	TextColor3 = colors.ink,
	TextSize = 24,
	Position = UDim2.new(0, 118, 0, 108),
	Size = UDim2.new(1, -118, 0, 44),
	Parent = main,
})

local reverseButton = create("TextButton", {
	BackgroundColor3 = Color3.fromRGB(217, 231, 241),
	BorderColor3 = colors.line,
	BorderSizePixel = 2,
	Font = Enum.Font.GothamBold,
	Text = "Use saved reverse",
	TextColor3 = colors.ink,
	TextSize = 16,
	Position = UDim2.new(0, 118, 0, 158),
	Size = UDim2.new(1, -118, 0, 44),
	Parent = main,
})

local declineReverseButton = create("TextButton", {
	BackgroundColor3 = Color3.fromRGB(255, 253, 248),
	BorderColor3 = colors.line,
	BorderSizePixel = 2,
	Font = Enum.Font.GothamBold,
	Text = "Let card play",
	TextColor3 = colors.ink,
	TextSize = 16,
	Position = UDim2.new(0, 118, 0, 208),
	Size = UDim2.new(1, -118, 0, 38),
	Parent = main,
})

local newRoundButton = create("TextButton", {
	BackgroundColor3 = Color3.fromRGB(255, 253, 248),
	BorderColor3 = colors.line,
	BorderSizePixel = 2,
	Font = Enum.Font.GothamBold,
	Text = "New game",
	TextColor3 = colors.ink,
	TextSize = 16,
	Position = UDim2.new(0, 0, 0, 258),
	Size = UDim2.new(1, 0, 0, 40),
	Parent = main,
})

local teamsLabel = create("TextLabel", {
	BackgroundTransparency = 1,
	Font = Enum.Font.FredokaOne,
	Text = "Teams",
	TextColor3 = colors.ink,
	TextSize = 20,
	TextXAlignment = Enum.TextXAlignment.Left,
	Position = UDim2.new(0, 0, 0, 310),
	Size = UDim2.new(1, 0, 0, 26),
	Parent = main,
})

local scoreText = create("TextLabel", {
	BackgroundColor3 = Color3.fromRGB(255, 253, 248),
	BorderColor3 = colors.line,
	BorderSizePixel = 2,
	Font = Enum.Font.Gotham,
	Text = "",
	TextColor3 = colors.ink,
	TextSize = 15,
	TextWrapped = true,
	TextXAlignment = Enum.TextXAlignment.Left,
	TextYAlignment = Enum.TextYAlignment.Top,
	Position = UDim2.new(0, 0, 0, 340),
	Size = UDim2.new(1, 0, 0, 112),
	Parent = main,
})

create("UIPadding", {
	PaddingTop = UDim.new(0, 8),
	PaddingRight = UDim.new(0, 8),
	PaddingBottom = UDim.new(0, 8),
	PaddingLeft = UDim.new(0, 8),
	Parent = scoreText,
})

local logLabel = create("TextLabel", {
	BackgroundTransparency = 1,
	Font = Enum.Font.FredokaOne,
	Text = "Notebook",
	TextColor3 = colors.ink,
	TextSize = 20,
	TextXAlignment = Enum.TextXAlignment.Left,
	Position = UDim2.new(0, 0, 0, 466),
	Size = UDim2.new(1, 0, 0, 26),
	Parent = main,
})

local logText = create("TextLabel", {
	BackgroundColor3 = Color3.fromRGB(255, 253, 248),
	BorderColor3 = colors.line,
	BorderSizePixel = 2,
	Font = Enum.Font.Gotham,
	Text = "",
	TextColor3 = colors.ink,
	TextSize = 13,
	TextWrapped = true,
	TextXAlignment = Enum.TextXAlignment.Left,
	TextYAlignment = Enum.TextYAlignment.Top,
	Position = UDim2.new(0, 0, 0, 496),
	Size = UDim2.new(1, 0, 1, -496),
	Parent = main,
})

create("UIPadding", {
	PaddingTop = UDim.new(0, 8),
	PaddingRight = UDim.new(0, 8),
	PaddingBottom = UDim.new(0, 8),
	PaddingLeft = UDim.new(0, 8),
	Parent = logText,
})

local function findCurrentPlayer()
	if not currentState or not currentState.players then
		return nil
	end
	return currentState.players[currentState.turnIndex]
end

local function localTurn()
	local playerState = findCurrentPlayer()
	return playerState and playerState.userId == localPlayer.UserId
end

local function pendingCard()
	return currentState and currentState.pendingCard
end

local function pendingCardPlayer()
	local pending = pendingCard()
	return pending and currentState.players[pending.playerId] or nil
end

local function localPendingCard()
	local playerState = pendingCardPlayer()
	return playerState and playerState.userId == localPlayer.UserId
end

local function localReverseChoice()
	local choice = currentState and currentState.pendingReverseChoice
	if not choice then
		return false
	end

	local playerState = currentState.players[choice.reversePlayerId]
	return playerState and playerState.userId == localPlayer.UserId
end

local function teamLabel(teamId)
	local teamInfo = currentState.teamInfo and currentState.teamInfo[teamId]
	return teamInfo and teamInfo.label or teamId
end

local function positionLabel(playerState)
	if playerState.finished then
		return "Finished"
	end

	local space = currentState.boardSpaces[playerState.position]
	local saved = playerState.savedReverse and " saved reverse" or ""
	return string.format("Space %d: %s%s", playerState.position, space.label, saved)
end

local function setButtonEnabled(button, enabled)
	button.Active = enabled
	button.AutoButtonColor = enabled
	button.TextTransparency = enabled and 0 or 0.45
	button.BackgroundTransparency = enabled and 0 or 0.25
end

local function render()
	if not currentState then
		return
	end

	local current = findCurrentPlayer()
	local isLocalTurn = localTurn()
	local winner = currentState.winner

	if winner then
		turnLabel.Text = teamLabel(winner) .. " win! Final score: Capys "
			.. currentState.teams.capys.score
			.. ", Pelicans "
			.. currentState.teams.pelicans.score
	elseif currentState.pendingReverseChoice then
		local reversePlayer = currentState.players[currentState.pendingReverseChoice.reversePlayerId]
		local card = currentState.pendingCard
		turnLabel.Text = string.format("%s can reverse %s: %s", reversePlayer.name, card.title, card.reverseText)
	elseif currentState.pendingCard then
		local cardPlayer = pendingCardPlayer()
		local card = currentState.pendingCard
		turnLabel.Text = string.format("%s drew %s: %s", cardPlayer.name, card.title, card.text)
	elseif current then
		local turnSuffix = isLocalTurn and "Your turn" or "Current turn"
		turnLabel.Text = string.format("%s: %s (%s team)", turnSuffix, current.name, teamLabel(current.team))
	else
		turnLabel.Text = "Waiting for players..."
	end

	spinResult.Text = currentState.spinResult and tostring(currentState.spinResult) or "-"

	local canSpin = isLocalTurn and not currentState.busy and not currentState.over and not currentState.pendingCard and not currentState.pendingReverseChoice
	local canPlayCard = localPendingCard() and not currentState.busy and not currentState.pendingReverseChoice
	local canUseReverse = localReverseChoice() and not currentState.busy
	spinButton.Text = canPlayCard and "Play card" or "Spin"
	reverseButton.Text = "Use saved reverse"
	setButtonEnabled(spinButton, canSpin or canPlayCard)
	setButtonEnabled(reverseButton, canUseReverse)
	setButtonEnabled(declineReverseButton, canUseReverse)

	local lines = {
		string.format("Capys: %d", currentState.teams.capys.score),
		string.format("Pelicans: %d", currentState.teams.pelicans.score),
		"",
	}

	for _, playerState in ipairs(currentState.players) do
		table.insert(lines, string.format("%s - %s team - %s", playerState.name, teamLabel(playerState.team), positionLabel(playerState)))
	end
	scoreText.Text = table.concat(lines, "\n")

	local logs = {}
	for index, message in ipairs(currentState.logs) do
		if index > 7 then
			break
		end
		table.insert(logs, message)
	end
	logText.Text = table.concat(logs, "\n")
end

spinButton.MouseButton1Click:Connect(function()
	if currentState and localPendingCard() and not currentState.busy and not currentState.pendingReverseChoice then
		requestPlayCard:FireServer()
	elseif localTurn() and currentState and not currentState.busy and not currentState.over and not currentState.pendingCard then
		requestSpin:FireServer()
	end
end)

reverseButton.MouseButton1Click:Connect(function()
	if localReverseChoice() and currentState and not currentState.busy and not currentState.over then
		requestSavedReverse:FireServer()
	end
end)

declineReverseButton.MouseButton1Click:Connect(function()
	if localReverseChoice() and currentState and not currentState.busy and not currentState.over then
		requestDeclineReverse:FireServer()
	end
end)

newRoundButton.MouseButton1Click:Connect(function()
	requestNewRound:FireServer()
end)

stateChanged.OnClientEvent:Connect(function(nextState)
	currentState = nextState
	render()
end)

local function resizeForViewport()
	local camera = workspace.CurrentCamera
	local viewport = camera and camera.ViewportSize or Vector2.new(1280, 720)
	if viewport.X < 760 then
		main.AnchorPoint = Vector2.new(0.5, 1)
		main.Position = UDim2.new(0.5, 0, 1, -12)
		main.Size = UDim2.new(1, -24, 0, 360)
		title.Size = UDim2.new(1, 0, 0, 28)
		title.TextSize = 22
		turnLabel.Position = UDim2.new(0, 0, 0, 34)
		turnLabel.Size = UDim2.new(1, 0, 0, 38)
		turnLabel.TextSize = 15
		spinResult.Position = UDim2.new(0, 0, 0, 80)
		spinResult.Size = UDim2.new(0, 78, 0, 78)
		spinResult.TextSize = 40
		spinButton.Position = UDim2.new(0, 92, 0, 80)
		spinButton.Size = UDim2.new(1, -92, 0, 36)
		reverseButton.Position = UDim2.new(0, 92, 0, 122)
		reverseButton.Size = UDim2.new(1, -92, 0, 36)
		declineReverseButton.Position = UDim2.new(0, 92, 0, 164)
		declineReverseButton.Size = UDim2.new(1, -92, 0, 30)
		newRoundButton.Position = UDim2.new(0, 0, 0, 204)
		newRoundButton.Size = UDim2.new(1, 0, 0, 34)
		teamsLabel.Position = UDim2.new(0, 0, 0, 244)
		teamsLabel.Size = UDim2.new(1, 0, 0, 22)
		scoreText.Position = UDim2.new(0, 0, 0, 270)
		scoreText.Size = UDim2.new(1, 0, 0, 58)
		logLabel.Position = UDim2.new(0, 0, 0, 334)
		logLabel.Size = UDim2.new(1, 0, 0, 22)
		logText.Position = UDim2.new(0, 0, 0, 358)
		logText.Size = UDim2.new(1, 0, 0, 2)
	else
		main.AnchorPoint = Vector2.new(1, 0)
		main.Position = UDim2.new(1, -18, 0, 18)
		main.Size = UDim2.new(0, 360, 0, 560)
		title.Size = UDim2.new(1, 0, 0, 34)
		title.TextSize = 28
		turnLabel.Position = UDim2.new(0, 0, 0, 48)
		turnLabel.Size = UDim2.new(1, 0, 0, 48)
		turnLabel.TextSize = 18
		spinResult.Position = UDim2.new(0, 0, 0, 108)
		spinResult.Size = UDim2.new(0, 104, 0, 94)
		spinResult.TextSize = 54
		spinButton.Position = UDim2.new(0, 118, 0, 108)
		spinButton.Size = UDim2.new(1, -118, 0, 44)
		reverseButton.Position = UDim2.new(0, 118, 0, 158)
		reverseButton.Size = UDim2.new(1, -118, 0, 44)
		declineReverseButton.Position = UDim2.new(0, 118, 0, 208)
		declineReverseButton.Size = UDim2.new(1, -118, 0, 38)
		newRoundButton.Position = UDim2.new(0, 0, 0, 258)
		newRoundButton.Size = UDim2.new(1, 0, 0, 40)
		teamsLabel.Position = UDim2.new(0, 0, 0, 310)
		teamsLabel.Size = UDim2.new(1, 0, 0, 26)
		scoreText.Position = UDim2.new(0, 0, 0, 340)
		scoreText.Size = UDim2.new(1, 0, 0, 112)
		logLabel.Position = UDim2.new(0, 0, 0, 466)
		logLabel.Size = UDim2.new(1, 0, 0, 26)
		logText.Position = UDim2.new(0, 0, 0, 496)
		logText.Size = UDim2.new(1, 0, 1, -496)
	end
end

if workspace.CurrentCamera then
	workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(resizeForViewport)
end
resizeForViewport()
