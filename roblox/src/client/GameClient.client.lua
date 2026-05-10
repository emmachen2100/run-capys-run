-- 2D Roblox version of Run, Capys, Run.
-- The old 3D-side-panel client is kept below in a disabled block while Emma tests this version.
do
	local Players = game:GetService("Players")
	local ReplicatedStorage = game:GetService("ReplicatedStorage")

	local localPlayer = Players.LocalPlayer
	local root = ReplicatedStorage:WaitForChild("RunCapysRun")
	local AssetConfig = require(root.Shared.AssetConfig)
	local remotes = root:WaitForChild("Remotes")

	local stateChanged = remotes:WaitForChild("StateChanged")
	local requestSpin = remotes:WaitForChild("RequestSpin")
	local requestNewRound = remotes:WaitForChild("RequestNewRound")
	local requestSavedReverse = remotes:WaitForChild("RequestSavedReverse")
	local requestPlayCard = remotes:WaitForChild("RequestPlayCard")
	local requestDeclineReverse = remotes:WaitForChild("RequestDeclineReverse")

	local currentState
	local spaceButtons = {}
	local scoreCards = {}
	local useBoardArt = AssetConfig.BoardImage ~= nil and AssetConfig.BoardImage ~= ""

	local colors = {
		ink = Color3.fromRGB(28, 24, 21),
		muted = Color3.fromRGB(94, 83, 74),
		paper = Color3.fromRGB(255, 250, 241),
		paperStrong = Color3.fromRGB(255, 244, 223),
		line = Color3.fromRGB(42, 37, 33),
		sun = Color3.fromRGB(229, 185, 78),
		face = Color3.fromRGB(236, 210, 125),
		capy = Color3.fromRGB(241, 207, 184),
		pelican = Color3.fromRGB(217, 231, 241),
		mystery = Color3.fromRGB(239, 201, 180),
		move = Color3.fromRGB(220, 235, 207),
		points = Color3.fromRGB(246, 239, 217),
	}

	local function create(className, props)
		local instance = Instance.new(className)
		for key, value in pairs(props or {}) do
			instance[key] = value
		end
		return instance
	end

	local function corner(parent, radius)
		create("UICorner", { CornerRadius = radius or UDim.new(0, 6), Parent = parent })
	end

	local function stroke(parent, thickness)
		return create("UIStroke", {
			Color = colors.line,
			Thickness = thickness or 2,
			ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
			Parent = parent,
		})
	end

	local gui = create("ScreenGui", {
		Name = "RunCapysRun2D",
		IgnoreGuiInset = true,
		ResetOnSpawn = false,
		Parent = localPlayer:WaitForChild("PlayerGui"),
	})

	local rootFrame = create("Frame", {
		BackgroundColor3 = colors.paper,
		BorderSizePixel = 0,
		Size = UDim2.fromScale(1, 1),
		Parent = gui,
	})

	create("TextLabel", {
		BackgroundTransparency = 1,
		Font = Enum.Font.GothamBold,
		Text = "EMMA'S BOARD GAME",
		TextColor3 = Color3.fromRGB(79, 71, 65),
		TextSize = 13,
		TextXAlignment = Enum.TextXAlignment.Left,
		Position = UDim2.fromOffset(28, 18),
		Size = UDim2.fromOffset(220, 22),
		Parent = rootFrame,
	})

	local title = create("TextLabel", {
		BackgroundTransparency = 1,
		Font = Enum.Font.FredokaOne,
		Text = "Run, Capys, Run",
		TextColor3 = Color3.fromRGB(157, 89, 112),
		TextSize = 46,
		TextXAlignment = Enum.TextXAlignment.Center,
		AnchorPoint = Vector2.new(0.5, 0),
		Position = UDim2.new(0.5, 0, 0, 18),
		Size = UDim2.fromOffset(520, 58),
		Parent = rootFrame,
	})

	local newRoundButton = create("TextButton", {
		BackgroundColor3 = Color3.fromRGB(255, 253, 248),
		Font = Enum.Font.GothamBold,
		Text = "New game",
		TextColor3 = colors.ink,
		TextSize = 18,
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -28, 0, 22),
		Size = UDim2.fromOffset(130, 44),
		Parent = rootFrame,
	})
	stroke(newRoundButton, 2)

	local board = create("Frame", {
		Name = "Board",
		AnchorPoint = Vector2.new(0.5, 0.5),
		BackgroundTransparency = 1,
		Position = UDim2.fromScale(0.5, 0.56),
		Size = UDim2.fromOffset(1000, useBoardArt and 760 or 700),
		Parent = rootFrame,
	})
	local boardScale = create("UIScale", { Scale = 1, Parent = board })
	local boardCenter = Vector2.new(500, 365)
	local track = {
		start = 220,
		span = -260,
		center = Vector2.new(500, 365),
		face = { cx = 500, cy = 365, rx = 338, ry = 205 },
		labelOffset = 52,
		tokenOffset = 95,
	}

	if useBoardArt then
		create("ImageLabel", {
			Name = "WebBoardArt",
			BackgroundTransparency = 1,
			Image = AssetConfig.BoardImage,
			ScaleType = Enum.ScaleType.Fit,
			Size = UDim2.fromScale(1, 1),
			ZIndex = 1,
			Parent = board,
		})
	end

	local face = create("Frame", {
		AnchorPoint = Vector2.new(0.5, 0.5),
		BackgroundColor3 = colors.face,
		Position = UDim2.fromOffset(boardCenter.X, boardCenter.Y + 20),
		Size = UDim2.fromOffset(690, 405),
		Visible = not useBoardArt,
		ZIndex = 3,
		Parent = board,
	})
	corner(face, UDim.new(0.5, 0))
	stroke(face, 4)

	local function facePart(name, position, size, color)
		local part = create("Frame", {
			Name = name,
			AnchorPoint = Vector2.new(0.5, 0.5),
			BackgroundColor3 = color,
			BorderSizePixel = 0,
			Position = UDim2.fromOffset(position.X, position.Y),
			Size = UDim2.fromOffset(size.X, size.Y),
			Visible = not useBoardArt,
			ZIndex = 4,
			Parent = board,
		})
		corner(part, UDim.new(1, 0))
		return part
	end

	facePart("LeftEye", Vector2.new(365, 330), Vector2.new(22, 48), Color3.fromRGB(34, 27, 23))
	facePart("RightEye", Vector2.new(635, 330), Vector2.new(22, 48), Color3.fromRGB(34, 27, 23))
	facePart("LeftCheek", Vector2.new(365, 455), Vector2.new(88, 88), Color3.fromRGB(244, 224, 174)).BackgroundTransparency = 0.45
	facePart("RightCheek", Vector2.new(635, 455), Vector2.new(88, 88), Color3.fromRGB(244, 224, 174)).BackgroundTransparency = 0.45
	local nose = facePart("Nose", Vector2.new(500, 485), Vector2.new(150, 80), Color3.fromRGB(142, 105, 45))
	stroke(nose, 3)

	local leftEar = create("Frame", {
		BackgroundColor3 = colors.face,
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromOffset(320, 170),
		Size = UDim2.fromOffset(185, 132),
		Rotation = -10,
		Visible = not useBoardArt,
		ZIndex = 5,
		Parent = board,
	})
	corner(leftEar, UDim.new(0.5, 0))
	stroke(leftEar, 3)
	create("TextLabel", {
		BackgroundTransparency = 1,
		Font = Enum.Font.FredokaOne,
		Text = "Characters",
		TextColor3 = colors.ink,
		TextSize = 22,
		Rotation = 10,
		Size = UDim2.fromScale(1, 0.42),
		Parent = leftEar,
	})

	local rightEar = create("Frame", {
		BackgroundColor3 = colors.face,
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromOffset(680, 170),
		Size = UDim2.fromOffset(185, 132),
		Rotation = 10,
		Visible = not useBoardArt,
		ZIndex = 5,
		Parent = board,
	})
	corner(rightEar, UDim.new(0.5, 0))
	stroke(rightEar, 3)
	local mysteryEarLabel = create("TextLabel", {
		BackgroundTransparency = 1,
		Font = Enum.Font.FredokaOne,
		Text = "Mystery cards\n?",
		TextColor3 = colors.ink,
		TextSize = 20,
		TextWrapped = true,
		Rotation = -10,
		Position = UDim2.fromScale(0.08, 0.1),
		Size = UDim2.fromScale(0.84, 0.82),
		Visible = not useBoardArt,
		ZIndex = 6,
		Parent = rightEar,
	})

	local spinner = create("TextButton", {
		BackgroundColor3 = Color3.fromRGB(241, 163, 64),
		Font = Enum.Font.FredokaOne,
		Text = "Spin",
		TextColor3 = colors.ink,
		TextSize = 24,
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromOffset(500, 150),
		Size = UDim2.fromOffset(140, 140),
		ZIndex = 6,
		Parent = board,
	})
	corner(spinner, UDim.new(1, 0))
	local spinnerStroke = stroke(spinner, 3)
	if useBoardArt then
		spinner.BackgroundTransparency = 1
		spinner.TextTransparency = 1
		spinnerStroke.Enabled = false
	end

	local spinnerPlayer = create("TextLabel", {
		BackgroundColor3 = colors.paper,
		Font = Enum.Font.FredokaOne,
		Text = "",
		TextColor3 = colors.ink,
		TextSize = 19,
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromOffset(54, 42),
		ZIndex = 7,
		Parent = spinner,
	})
	corner(spinnerPlayer, UDim.new(1, 0))
	stroke(spinnerPlayer, 2)

	local cardPopup = create("Frame", {
		BackgroundColor3 = colors.paper,
		Visible = false,
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.5),
		Size = UDim2.fromOffset(340, 245),
		Parent = rootFrame,
	})
	corner(cardPopup, UDim.new(0, 8))
	stroke(cardPopup, 4)

	local cardTitle = create("TextLabel", {
		BackgroundTransparency = 1,
		Font = Enum.Font.FredokaOne,
		Text = "",
		TextColor3 = colors.ink,
		TextSize = 30,
		TextWrapped = true,
		Position = UDim2.fromOffset(18, 18),
		Size = UDim2.new(1, -36, 0, 42),
		Parent = cardPopup,
	})

	local cardText = create("TextLabel", {
		BackgroundTransparency = 1,
		Font = Enum.Font.GothamBold,
		Text = "",
		TextColor3 = colors.muted,
		TextSize = 18,
		TextWrapped = true,
		Position = UDim2.fromOffset(22, 68),
		Size = UDim2.new(1, -44, 0, 82),
		Parent = cardPopup,
	})

	local cardPrimary = create("TextButton", {
		BackgroundColor3 = colors.sun,
		Font = Enum.Font.FredokaOne,
		Text = "Play card",
		TextColor3 = colors.ink,
		TextSize = 20,
		Position = UDim2.new(0, 22, 1, -76),
		Size = UDim2.new(1, -44, 0, 46),
		Parent = cardPopup,
	})
	stroke(cardPrimary, 2)

	local cardSecondary = create("TextButton", {
		BackgroundColor3 = colors.paperStrong,
		Font = Enum.Font.GothamBold,
		Text = "Let card play",
		TextColor3 = colors.ink,
		TextSize = 18,
		Visible = false,
		Position = UDim2.new(0, 22, 1, -128),
		Size = UDim2.new(1, -44, 0, 40),
		Parent = cardPopup,
	})
	stroke(cardSecondary, 2)

	local function spaceColor(space)
		if space.type == "start" or space.type == "finish" then
			return Color3.fromRGB(248, 220, 154)
		elseif space.type == "mystery" then
			return colors.mystery
		elseif space.type == "points" then
			return colors.points
		elseif space.type == "move" then
			return colors.move
		end
		return colors.paper
	end

	local function teamLabel(teamId)
		local teamInfo = currentState and currentState.teamInfo and currentState.teamInfo[teamId]
		return teamInfo and teamInfo.label or teamId
	end

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

	local function pendingCardPlayer()
		local pending = currentState and currentState.pendingCard
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

	local function setButtonEnabled(button, enabled)
		button.Active = enabled
		button.AutoButtonColor = enabled
		if useBoardArt and button == spinner then
			button.TextTransparency = 1
			button.BackgroundTransparency = 1
		else
			button.TextTransparency = enabled and 0 or 0.45
			button.BackgroundTransparency = enabled and 0 or 0.25
		end
	end

	local function tokenText(playerState)
		local prefix = playerState.team == "capys" and "C" or "P"
		return prefix .. tostring(playerState.id)
	end

	local function roundPoint(value)
		return math.floor(value * 100 + 0.5) / 100
	end

	local function trackPoint(curve, degrees)
		local radians = math.rad(degrees)
		return Vector2.new(
			roundPoint(curve.cx + curve.rx * math.cos(radians)),
			roundPoint(curve.cy + curve.ry * math.sin(radians))
		)
	end

	local function faceCurvePoint(degrees)
		return trackPoint(track.face, degrees)
	end

	local function growFromFace(degrees, amount)
		local point = faceCurvePoint(degrees)
		local delta = point - track.center
		local distance = math.max(delta.Magnitude, 1)
		return Vector2.new(
			roundPoint(point.X + delta.X / distance * amount),
			roundPoint(point.Y + delta.Y / distance * amount)
		)
	end

	local function buildSpaces(boardSpaces)
		for _, button in pairs(spaceButtons) do
			button:Destroy()
		end
		table.clear(spaceButtons)

		for index, space in ipairs(boardSpaces) do
			local count = #boardSpaces
			local startDegrees = track.start + track.span * ((index - 1) / count)
			local endDegrees = track.start + track.span * (index / count)
			local midDegrees = (startDegrees + endDegrees) / 2
			local label = growFromFace(midDegrees, track.labelOffset)
			local button = create("TextButton", {
				Name = "Space" .. index,
				AnchorPoint = Vector2.new(0.5, 0.5),
				BackgroundColor3 = spaceColor(space),
				Font = Enum.Font.FredokaOne,
				Text = useBoardArt and "" or space.label,
				TextColor3 = colors.ink,
				TextSize = space.label == "" and 10 or 13,
				TextWrapped = true,
				BackgroundTransparency = useBoardArt and 1 or 0,
				AutoButtonColor = not useBoardArt,
				Rotation = 0,
				Position = UDim2.fromOffset(label.X, label.Y),
				Size = UDim2.fromOffset(86, 60),
				ZIndex = 2,
				Parent = board,
			})
			if not useBoardArt then
				stroke(button, 3)
			end
			spaceButtons[index] = button
		end
	end

	local function renderTokens()
		for _, spaceButton in pairs(spaceButtons) do
			for _, child in ipairs(spaceButton:GetChildren()) do
				if child.Name == "Token" then
					child:Destroy()
				end
			end
		end

		local byPosition = {}
		for _, playerState in ipairs(currentState.players) do
			if not playerState.finished then
				byPosition[playerState.position] = byPosition[playerState.position] or {}
				table.insert(byPosition[playerState.position], playerState)
			end
		end

		for position, playersAtSpace in pairs(byPosition) do
			local parent = spaceButtons[position]
			if parent then
				for index, playerState in ipairs(playersAtSpace) do
					local token = create("TextLabel", {
						Name = "Token",
						BackgroundColor3 = playerState.team == "capys" and colors.capy or colors.pelican,
						Font = Enum.Font.FredokaOne,
						Text = tokenText(playerState),
						TextColor3 = colors.ink,
						TextSize = 12,
						AnchorPoint = Vector2.new(0.5, 0.5),
						Position = UDim2.fromScale(0.25 + (index - 1) * 0.2, 0.75),
						Size = UDim2.fromOffset(28, 24),
						ZIndex = 8,
						Parent = parent,
					})
					corner(token, UDim.new(1, 0))
					stroke(token, 1)
				end
			end
		end
	end

	local function scoreCorner(playerState)
		if #currentState.players <= 2 then
			return playerState.team == "capys"
				and { UDim2.fromOffset(28, 92), Vector2.new(0, 0) }
				or { UDim2.new(1, -28, 0, 92), Vector2.new(1, 0) }
		end
		if playerState.team == "capys" then
			return playerState.id == 1
				and { UDim2.fromOffset(28, 92), Vector2.new(0, 0) }
				or { UDim2.new(0, 28, 1, -142), Vector2.new(0, 1) }
		end
		return playerState.id == 3
			and { UDim2.new(1, -28, 0, 92), Vector2.new(1, 0) }
			or { UDim2.new(1, -28, 1, -142), Vector2.new(1, 1) }
	end

	local function renderScoreCards()
		for _, card in pairs(scoreCards) do
			card:Destroy()
		end
		table.clear(scoreCards)

		for _, playerState in ipairs(currentState.players) do
			local place = scoreCorner(playerState)
			local card = create("Frame", {
				BackgroundColor3 = playerState.team == "capys" and colors.capy or colors.pelican,
				AnchorPoint = place[2],
				Position = place[1],
				Size = UDim2.fromOffset(210, 96),
				Parent = rootFrame,
			})
			corner(card, UDim.new(0, 6))
			stroke(card, 2)
			scoreCards[playerState.userId] = card

			create("TextLabel", {
				BackgroundTransparency = 1,
				Font = Enum.Font.FredokaOne,
				Text = playerState.name,
				TextColor3 = colors.ink,
				TextSize = 18,
				TextXAlignment = Enum.TextXAlignment.Left,
				Position = UDim2.fromOffset(12, 8),
				Size = UDim2.new(1, -48, 0, 22),
				Parent = card,
			})
			create("TextLabel", {
				BackgroundTransparency = 1,
				Font = Enum.Font.FredokaOne,
				Text = tostring(currentState.teams[playerState.team].score),
				TextColor3 = colors.ink,
				TextSize = 20,
				TextXAlignment = Enum.TextXAlignment.Right,
				Position = UDim2.new(1, -44, 0, 8),
				Size = UDim2.fromOffset(32, 22),
				Parent = card,
			})
			local status = playerState.finished and "Finished" or ("Space " .. tostring(playerState.position))
			if playerState.savedReverse then
				status = status .. "  Reverse saved"
			end
			create("TextLabel", {
				BackgroundTransparency = 1,
				Font = Enum.Font.GothamBold,
				Text = teamLabel(playerState.team) .. " team\n" .. status,
				TextColor3 = colors.ink,
				TextSize = 14,
				TextWrapped = true,
				TextXAlignment = Enum.TextXAlignment.Left,
				Position = UDim2.fromOffset(12, 36),
				Size = UDim2.new(1, -24, 0, 46),
				Parent = card,
			})
		end
	end

	local function renderCardPopup()
		local pending = currentState.pendingCard
		local choice = currentState.pendingReverseChoice
		cardPopup.Visible = pending ~= nil
		if not pending then
			return
		end
		if choice then
			local reversePlayer = currentState.players[choice.reversePlayerId]
			cardTitle.Text = "Use reverse?"
			cardText.Text = reversePlayer.name .. " can reverse " .. pending.title .. ". " .. pending.reverseText
			cardPrimary.Text = "Use reverse"
			cardSecondary.Visible = true
		else
			local cardPlayer = pendingCardPlayer()
			cardTitle.Text = pending.title
			cardText.Text = cardPlayer.name .. " drew this card. " .. pending.text
			cardPrimary.Text = "Play card"
			cardSecondary.Visible = false
		end
	end

	local function render()
		if not currentState then
			return
		end
		if #spaceButtons ~= #currentState.boardSpaces then
			buildSpaces(currentState.boardSpaces)
		end
		local current = findCurrentPlayer()
		local isLocalTurn = localTurn()
		if currentState.winner then
			spinner.Text = teamLabel(currentState.winner) .. " win!"
		elseif currentState.pendingCard then
			spinner.Text = "Card"
		elseif currentState.spinResult then
			spinner.Text = tostring(currentState.spinResult)
		else
			spinner.Text = "Spin"
		end
		spinnerPlayer.Text = current and tokenText(current) or ""
		local canSpin = isLocalTurn and not currentState.busy and not currentState.over and not currentState.pendingCard and not currentState.pendingReverseChoice
		setButtonEnabled(spinner, canSpin)
		mysteryEarLabel.Text = string.format("Mystery cards\n?\n%d left", currentState.deckLeft or 0)
		renderTokens()
		renderScoreCards()
		renderCardPopup()
	end

	spinner.MouseButton1Click:Connect(function()
		if localTurn() and currentState and not currentState.busy and not currentState.over and not currentState.pendingCard then
			requestSpin:FireServer()
		end
	end)

	cardPrimary.MouseButton1Click:Connect(function()
		if localReverseChoice() then
			requestSavedReverse:FireServer()
		elseif localPendingCard() then
			requestPlayCard:FireServer()
		end
	end)

	cardSecondary.MouseButton1Click:Connect(function()
		if localReverseChoice() then
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
		local scale = math.min(viewport.X / 1220, viewport.Y / 780, 1)
		boardScale.Scale = math.max(0.62, scale)
		title.TextSize = viewport.X < 760 and 32 or 46
	end

	if workspace.CurrentCamera then
		workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(resizeForViewport)
	end
	resizeForViewport()
end

if false then
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
end
