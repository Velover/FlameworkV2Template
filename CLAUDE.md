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
- **Flamework v2 alpha:** `@flamework-experimental/core`, `components`, `networking` and `testing`,
  and `@flamework-experimental/transformer`, the tsconfig plugin, all pinned exactly at
  2.0.0-alpha.8. Every package shares one version; upgrade them together.
  - `testing` is in every build, not only test builds: both entry points include its
    `TestingPlugin`, which stays inert without the `testing` scope. A mismatched version breaks
    the game too.
- Package manager: bun, one lockfile (`bun.lock`).

## Commands

- `bun install`.
- `bun run build` runs `rbxtsc`, the check described under "Building" in the imported flamework.md.
- `bun run watch` runs `rbxtsc -w`, which rebuilds on change.
- `bun run serve` runs `rojo serve` to sync into Studio, and `bun run place` builds `place.rbxl`.
  Build first: the project maps `out/` and `include/`.
- `bun run test` runs the tests in Studio; see [Tests](#tests).
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

## Tests

Read `node_modules/@flamework-experimental/core/docs/ai/testing.md` before you write or run tests;
`.claude/rules/testing.md` adds what this template does.

- `bun run test` (`scripts/test.mjs`) builds with `FLAMEWORK_SCOPES=testing` and makes `test.rbxl`.
  `flamework-test` then lays that over `tests/place.rbxlx` and runs the sections in Studio, on the
  server and then on the client. Extra arguments go to `flamework-test`. It needs Studio's "MCP
  server" setting on, and `lune`.
- Tests live in `src/server/tests`, `src/client/tests` and `src/shared/tests` (both realms);
  `src/server/tests/players.ts` is a plain module of helpers beside them. The entry points register
  those folders only under the `testing` scope.
- Whether the tests pass or fail, `bun run test` ends by rebuilding `out/` with `FLAMEWORK_SCOPES`
  set to nothing, so `rojo serve` and `bun run place` never ship the test host. Never put the scope
  in `.env` or `.env.local`: every other build reads them. A run stopped with Ctrl+C skips the
  rebuild, so `out/` keeps the test build: run `bun run build`. Every run leaves `test.rbxl` and
  `test.patched.rbxl` behind; they are git-ignored.
- **How much to run:** as "How much to test" in the imported flamework.md says. A Studio run of
  one feature is `bun run test --sections <section>` (`coin`, `coin-service`, `throttle`,
  `coin-spin`, `levels`), plus `--realm` when one realm is enough. The whole `bun run test` only
  when the user asks or agrees.
- **Unattended:** give a run nobody watches `--keep-awake`: while the display sleeps,
  RenderStepped stops and `onRender` tests fail.
- **Hidden window:** on Windows the run opens Studio on a hidden desktop, so nothing shows and the
  user's focus is left alone. Add `--show` only when the user wants to watch, or when a hidden
  window `never showed up on the MCP proxy`.
- **The Studio lock:** one `flamework-test` command uses Studio at a time on the machine. A run
  that finds another project's window or run holding it says whose and waits, up to 300 seconds,
  then fails naming it. Wait or ask the user; never close a window you did not open.

## Gotchas

- Keep TypeScript at the version roblox-ts bundles. Any other version makes every build warn
  `TypeScript version differs`, and the editor checks with a different compiler than the build.
- `default.project.json` maps all of `node_modules/@flamework-experimental` in one line, so the
  place gets more than code: an empty `transformer` Folder, and core's docs as Folders, `core.docs`
  holding the empty `core.docs.ai` and `core.docs.guide`. All expected; nothing reads them.
- The build is not incremental (`tsconfig.json` sets no `incremental`), so an upgraded transformer
  just rebuilds.
- Line endings are LF everywhere: `.gitattributes` sets `eol=lf`, which overrides `core.autocrlf`.
