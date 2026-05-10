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

The Roblox version builds the board in 3D, uses a server-owned game loop, and keeps the same main rules as the browser game: spinner movement, Capys vs. Pelicans teams, point spaces, mystery cards, saved reverses, skips, switches, and team win conditions.
