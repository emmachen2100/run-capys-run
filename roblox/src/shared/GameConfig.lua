local GameConfig = {}

GameConfig.MaxPlayers = 4
GameConfig.Teams = {
	capys = {
		label = "Capys",
		color = Color3.fromRGB(184, 121, 80),
		lightColor = Color3.fromRGB(241, 207, 184),
	},
	pelicans = {
		label = "Pelicans",
		color = Color3.fromRGB(85, 117, 154),
		lightColor = Color3.fromRGB(217, 231, 241),
	},
}

GameConfig.BoardSpaces = {
	{ label = "Start", type = "start" },
	{ label = "Go back 1", type = "move", move = -1 },
	{ label = "+3 points", type = "points", points = 3 },
	{ label = "Mystery card", type = "mystery" },
	{ label = "Spin again", type = "move", spinAgain = true },
	{ label = "Go up 2", type = "move", move = 2 },
	{ label = "+5 points", type = "points", points = 5 },
	{ label = "Mystery card", type = "mystery" },
	{ label = "-5 points and spin again", type = "points", points = -5, spinAgain = true },
	{ label = "Save reverse", type = "reverse", saveReverse = true },
	{ label = "+2 points", type = "points", points = 2 },
	{ label = "Mystery card", type = "mystery" },
	{ label = "Go up 3", type = "move", move = 3 },
	{ label = "+7 points", type = "points", points = 7 },
	{ label = "Mystery card", type = "mystery" },
	{ label = "-2 points", type = "points", points = -2 },
	{ label = "Reverse", type = "reverse", reverseNow = true },
	{ label = "+3 points", type = "points", points = 3 },
	{ label = "Mystery card", type = "mystery" },
	{ label = "Skip next", type = "move", skipNext = true },
	{ label = "+4 points", type = "points", points = 4 },
	{ label = "Go back 2", type = "move", move = -2 },
	{ label = "Mystery card", type = "mystery" },
	{ label = "+6 points", type = "points", points = 6 },
	{ label = "Spin again", type = "move", spinAgain = true },
	{ label = "-3 points", type = "points", points = -3 },
	{ label = "Mystery card", type = "mystery" },
	{ label = "Switch places", type = "move", switchPlaces = true },
	{ label = "+8 points", type = "points", points = 8 },
	{ label = "Mystery card", type = "mystery" },
	{ label = "Go back 1", type = "move", move = -1 },
	{ label = "Finish", type = "finish" },
}

GameConfig.CardBlueprints = {
	{ id = "MoveForward", title = "Move forward", text = "Move forward 3 spaces.", count = 3 },
	{ id = "MoveBackward", title = "Move backward", text = "Move backward 3 spaces.", count = 3 },
	{ id = "Reverse", title = "Reverse", text = "Reverse the play order.", count = 3 },
	{ id = "BackToStart", title = "Back to start", text = "Go back to start.", count = 3 },
	{ id = "PlusPoints", title = "+ points", text = "Add 5 points to your team.", count = 7 },
	{ id = "MinusPoints", title = "- points", text = "Lose 4 points from your team.", count = 4 },
	{ id = "SkipTurn", title = "Skip turn", text = "The next player skips a turn.", count = 1 },
	{ id = "Oops", title = "Oops card", text = "Slide back to the last mystery card.", count = 3 },
	{ id = "SwitchPoints", title = "Switch points", text = "Switch team scores.", count = 2 },
	{ id = "DoublePoints", title = "Double points", text = "Double your team's points.", count = 1 },
	{ id = "PickTwoMoreCards", title = "Pick 2 more cards", text = "Draw two more mystery cards.", count = 1 },
	{ id = "SwitchPlaces", title = "Switch places", text = "Switch places with another player.", count = 1 },
}

function GameConfig.TeamLabel(teamId)
	local team = GameConfig.Teams[teamId]
	return team and team.label or teamId
end

function GameConfig.CardById(cardId)
	for _, card in ipairs(GameConfig.CardBlueprints) do
		if card.id == cardId then
			return card
		end
	end
	return nil
end

return GameConfig
