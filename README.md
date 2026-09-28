# Flamework Template

A minimal Roblox game on Flamework v2 (alpha) and roblox-ts, with Flamework's core, components and
networking. A small coin example shows each part; replace it with your game.

## Start

You need [bun](https://bun.sh), and Rojo 7.7 with its Studio plugin (`aftman install` or
`rokit install` installs the version in `aftman.toml`).

```sh
git clone <this repository> my-game
cd my-game
bun install
bun run build
rojo serve
```

Open a place in Studio (a new Baseplate will do), connect from the Rojo plugin and press Play. Press
F to spawn a coin in front of you, then walk into it: the output prints your coins and level.

`bun run watch` rebuilds as you edit, `bun run place` builds `place.rbxl`, and `bun run format`
formats `src/`.

## Layout

```
src/
  server/
    runtime.server.ts   entry point: registers the folders below and ignites
    services/           providers (server)
    components/         components (server)
    network.ts          the server's events and functions, with middleware
    middleware/         networking middleware
  client/
    runtime.client.ts   entry point: registers the folders below and ignites
    controllers/        providers (client)
    components/         components (client)
    network.ts          the client's events and functions
  shared/
    network.ts          the network declarations
    levels.ts, tags.ts  plain modules both realms use
```

## Docs

The Flamework guides for the installed version are in
`node_modules/@flamework-experimental/core/docs/guide/`. Start with `01-getting-started.md`. The
Flamework website documents v1, most of which no longer applies.

`CLAUDE.md` and `.claude/rules/` are the instructions for Claude Code.

## Renaming the project

1. Set `name` in `package.json` and in `default.project.json`.
2. Change the title of this README and of `CLAUDE.md`, and the first paragraph of `CLAUDE.md`.
3. Delete the coin example: `src/*/components/coin*.ts`, `src/server/services/coin-service.ts`,
   `src/client/controllers/coin-controller.ts`, `src/shared/levels.ts`, and its members in
   `src/*/network.ts` and `src/shared/tags.ts`. Every folder an entry point registers must keep at
   least one file, or lose its line in the entry point.
