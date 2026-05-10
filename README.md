# Run, Capys, Run

A browser version of Emma's board game poster.

## Play Locally

Open `index.html` in a browser, or run:

```bash
python3 -m http.server 4174 --bind 0.0.0.0
```

## Publish With GitHub Pages

1. Create a public GitHub repository named `run-capys-run`.
2. Push this folder to the repository.
3. In GitHub, go to `Settings` -> `Pages`.
4. Set source to `Deploy from a branch`, branch `main`, folder `/root`.
5. The game will be available at:

```text
https://EMMA_USERNAME.github.io/run-capys-run/
```

The original `pics/` folder is intentionally ignored because phone photos can include private metadata. The public site uses EXIF-free copies in `assets/`.

## Roblox Version

There is also a Roblox/Rojo project in `roblox/`.

### Open in Roblox Studio

1. Install Roblox Studio and Rojo.
2. From this repository, run:

```bash
cd roblox
rojo serve default.project.json
```

3. In Roblox Studio, install/open the Rojo plugin and connect to the local server.
4. Press Play.

The Roblox version is a 2D UI game with a server-owned game loop. It keeps the same main rules as the browser game: spinner movement, Capys vs. Pelicans teams, point spaces, mystery cards, saved reverses, skips, switches, and team win conditions.

### Match the Web Board Art

Roblox cannot run the HTML/CSS/SVG board directly. To make the Roblox game look like the browser game, upload this exported web-board PNG to Roblox as an image asset:

```text
roblox/assets/run-capys-web-board.png
```

Then paste the id in:

```lua
roblox/src/shared/AssetConfig.lua
```

Use this format:

```lua
AssetConfig.BoardImage = "rbxassetid://1234567890"
```

When `BoardImage` is set, the Roblox client uses that image as the board and places transparent hit areas and tokens on top.

To regenerate the PNG after changing the web board, open `tools/roblox-board-export.html` in a 1000 x 760 browser screenshot, or use a headless browser screenshot command.
