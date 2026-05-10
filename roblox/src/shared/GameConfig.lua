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
	{ label = "", type = "plain" },
	{ label = "+3 points", type = "points", points = 3 },
	{ label = "Mystery card", type = "mystery" },
	{ label = "", type = "plain" },
	{ label = "Spin again", type = "move", spinAgain = true },
	{ label = "Mystery card", type = "mystery" },
	{ label = "", type = "plain" },
	{ label = "+3 points", type = "points", points = 3 },
	{ label = "", type = "plain" },
	{ label = "Go up 3 spaces", type = "move", move = 3 },
	{ label = "Mystery card", type = "mystery" },
	{ label = "", type = "plain" },
	{ label = "+7 points", type = "points", points = 7 },
	{ label = "Mystery card", type = "mystery" },
	{ label = "", type = "plain" },
	{ label = "", type = "plain" },
	{ label = "-5 points spin again", type = "points", points = -5, spinAgain = true },
	{ label = "", type = "plain" },
	{ label = "", type = "plain" },
	{ label = "Mystery card", type = "mystery" },
	{ label = "+2 points", type = "points", points = 2 },
	{ label = "", type = "plain" },
	{ label = "Finish", type = "finish" },
}

GameConfig.CardBlueprints = {
	{ id = "MoveForward", title = "Move forward", text = "Move forward 3 spaces.", reverseText = "Move backward 3 spaces instead.", count = 3, reversible = true },
	{ id = "MoveBackward", title = "Move backward", text = "Move back 1 space.", reverseText = "Move forward 1 space instead.", count = 3, reversible = true },
	{ id = "Reverse", title = "Reverse", text = "Save this reverse card for later.", count = 3 },
	{ id = "BackToStart", title = "Back to start", text = "Go back to start.", reverseText = "Go to Finish instead.", count = 3, reversible = true },
	{ id = "PlusPoints", title = "+ points", text = "Add 5 points to your team.", reverseText = "Lose 5 points instead.", count = 7, reversible = true },
	{ id = "MinusPoints", title = "- points", text = "Lose 4 points from your team.", reverseText = "Add 4 points instead.", count = 4, reversible = true },
	{ id = "SkipTurn", title = "Skip turn", text = "The next player skips a turn.", count = 1 },
	{ id = "Oops", title = "Oops card", text = "Nothing happens.", count = 3 },
	{ id = "SwitchPoints", title = "Switch points", text = "Switch team scores.", count = 2 },
	{ id = "DoublePoints", title = "Double points", text = "Double your team's points.", reverseText = "Cut that team's points in half instead.", count = 1, reversible = true },
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
