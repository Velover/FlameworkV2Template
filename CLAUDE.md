# Flamework Template

A Roblox game in roblox-ts on Flamework v2. It started from the Flamework template, whose coin
example (press F to spawn a coin, touch it to collect it) is there to be replaced.

## Flamework

Flamework's own instructions ship in core, so they match the installed version. This line loads
them (after `bun install`; without `node_modules` it loads nothing):

@node_modules/@flamework-experimental/core/docs/ai/flamework.md

The guides they point to are for the installed version. Most of their install commands use npm;
use bun here.

## Stack

- roblox-ts 3.0.0 (`rbxtsc`) compiles `src/` to Luau in `out/`. TypeScript is pinned to 5.5.3, the
  version roblox-ts 3.0.0 bundles.
- Rojo 7.7 (`aftman.toml`) builds the place from `default.project.json`.
- **Flamework v2 alpha:** `@flamework-experimental/core`, `components` and `networking`, and
  `@flamework-experimental/transformer`, the tsconfig plugin, all pinned exactly at
  2.0.0-alpha.8. Every package shares one version; upgrade them together.
- Package manager: bun, one lockfile (`bun.lock`).

## Commands

- `bun install`.
- `bun run build` runs `rbxtsc`, the check described under "Building" in the imported flamework.md.
- `bun run watch` runs `rbxtsc -w`, which rebuilds on change.
- `bun run serve` runs `rojo serve` to sync into Studio, and `bun run place` builds `place.rbxl`.
  Build first: the project maps `out/` and `include/`.
- `bun run format` runs Prettier on `src/`: tabs, a width of 100, trailing commas.
- Add packages with `bun add <name>`, or `bun add -d <name>` for build tools. Add a
  `@flamework-experimental/*` package with `bun add --exact <name>@2.0.0-alpha.8`, the version the
  others have. It needs no mapping: `default.project.json` maps the whole scope.

## Where things live

| Path                           | Realm  | Holds                                                               |
| ------------------------------ | ------ | ------------------------------------------------------------------- |
| `src/server/runtime.server.ts` | server | the entry point: builds and ignites the server's module             |
| `src/server/services/`         | server | `@Provider` classes, registered by `registerProviders`              |
| `src/server/components/`       | server | `@Component` classes, registered by `ComponentPlugin.fromPath`      |
| `src/server/network.ts`        | server | the server's `Events` and `Functions`, with their middleware        |
| `src/server/middleware/`       | server | networking middleware                                               |
| `src/client/runtime.client.ts` | client | the entry point: builds and ignites the client's module             |
| `src/client/controllers/`      | client | `@Provider` classes, registered by `registerProviders`              |
| `src/client/components/`       | client | `@Component` classes, registered by `ComponentPlugin.fromPath`      |
| `src/client/network.ts`        | client | the client's `Events` and `Functions`                               |
| `src/shared/network.ts`        | both   | the network declarations: `GlobalEvents`, `GlobalFunctions`         |
| `src/shared/`                  | both   | plain modules both realms import, such as `tags.ts` and `levels.ts` |

- In the place: `src/server` is `ServerScriptService.TS`, `src/client` is
  `StarterPlayer.StarterPlayerScripts.TS`, and `src/shared` is `ReplicatedStorage.TS`.
- Components for both realms go in `src/shared/components/`, registered from both entry points.
- `out/`, `include/` and `flamework.build` are git-ignored; `flamework.config.json` is committed.

## Gotchas

- Keep TypeScript at the version roblox-ts bundles. Any other version makes every build warn
  `TypeScript version differs`, and the editor checks with a different compiler than the build.
- `default.project.json` maps all of `node_modules/@flamework-experimental` in one line, so the
  place gets more than code: an empty `transformer` Folder, and core's docs as Folders, `core.docs`
  holding the empty `core.docs.ai` and `core.docs.guide`. All expected; nothing reads them.
- The build is not incremental (`tsconfig.json` sets no `incremental`), so an upgraded transformer
  just rebuilds.
- Line endings are LF everywhere: `.gitattributes` sets `eol=lf`, which overrides `core.autocrlf`.
