---
paths:
  - "package/**"
---

# The plugin package (`package/`)

`node_modules/@flamework-experimental/core/docs/ai/plugins.md`, which `CLAUDE.md` loads, has the
rules for a plugin and for a package other games install. This file adds only what this template
does.

## The example

- `createPlayerEventsPlugin(options)` returns `Flamework.createPlugin("PlayerEvents", ...)`, and
  `PlayerEventsPlugin` is that with the defaults; the `plugin` snippet writes the same shape. Both
  of the game's entry points include it.
- Its state (the roster, the listener sets, the connections) lives inside the setup function. From
  `target` it uses `provideInstance` for the `PlayerRoster`, `observe<OnPlayerJoined>` and
  `observe<OnPlayerLeft>` for the listeners, `onIgnited` with `HookPriority.Last` to connect to
  `Players` and announce those already in the game, and `onExtinguished` to disconnect and clear
  the roster.
- Its ids start with its name (`@your-scope/player-events:init@PlayerRoster`), and `files` publishes
  `flamework.build` with `out/`.
- `PlayerRoster.add` and the other members marked `@internal` stay out of the published typings
  (`stripInternal` in `package/tsconfig.json`).

## This package's setup

- **Versions:** core is a peer dependency and a dev dependency, both exactly 2.0.0-alpha.8, the
  version the root pins. Change both with the root's, to one release.
- **Pins:** `package/tsconfig.json` `paths` pins `@flamework-experimental/core` and
  `@rbxts/services` to `package/node_modules`, and the root `tsconfig.json` pins the same two to the
  game's `node_modules`. A new import the package shares with a dependency, or that its typings
  make, needs a line in each.
- **Building:** `bun run build:package` (`rbxtsc -p package`) writes `package/out/` and
  `package/flamework.build`. `bun run build` and `bun run test` build it before the game.
