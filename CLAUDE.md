# Flamework Plugin Template

A Flamework v2 plugin, published as an npm package from `package/`, and a roblox-ts game in `src/`
that installs it and runs its tests in Studio. It started from the Flamework plugin template, whose
example plugin, `@your-scope/player-events` (providers implement `OnPlayerJoined` and
`OnPlayerLeft`, and inject a `PlayerRoster`), is there to be replaced.

## Flamework

Flamework's own instructions ship in core, so they match the installed version. These lines load
the rules every project follows, and those for a plugin and a package that other games install,
which is what this repository is about (after `bun install`; without `node_modules` they load
nothing):

@node_modules/@flamework-experimental/core/docs/ai/flamework.md

@node_modules/@flamework-experimental/core/docs/ai/plugins.md

The guides they point to are for the installed version. Most of their install commands use npm;
use bun here.

## Stack

- roblox-ts 3.0.0 (`rbxtsc`) compiles `package/src/` to `package/out/`, and `src/` to `out/`.
  TypeScript is pinned to 5.5.3, the version roblox-ts 3.0.0 bundles.
- Rojo 7.7 (`aftman.toml`) builds the game's place from `default.project.json`.
- **Flamework v2 alpha:** `@flamework-experimental/core` and `testing`, and
  `@flamework-experimental/transformer`, the tsconfig plugin, all pinned exactly at 2.0.0-alpha.8.
  Every package shares one version; upgrade them together.
  - The package names core as a peer dependency and as a dev dependency, both exactly
    2.0.0-alpha.8: change both with the root's.
- Package manager: bun, one lockfile (`bun.lock`). The root is a workspace with `package/` in it.

## Commands

- `bun install`.
- `bun run build` runs `rbxtsc -p package`, then `rbxtsc`: both must pass the check described under
  "Building" in the imported flamework.md. `bun run build:package` builds the package alone.
- `bun run watch:package` and `bun run watch` rebuild the package and the game on change.
- `bun run serve` runs `rojo serve` to sync into Studio, and `bun run place` builds `place.rbxl`.
  Build first: the project maps `out/`, `include/` and the package's `out/`.
- `bun run test` runs the tests in Studio; see [Tests](#tests).
- `bun run format` runs Prettier on `src/` and `package/src/`: tabs, a width of 100, trailing
  commas.
- Add a package the plugin uses to `package/package.json`, from `package/` (`bun add <name>`), and
  pin it in `package/tsconfig.json` `paths`; one the game alone uses goes in the root. Add a
  `@flamework-experimental/*` package with `bun add --exact <name>@2.0.0-alpha.8`, the version the
  others have.
- Publish from `package/` with `bun publish`, after setting its `version`; `prepublishOnly` builds
  it.

## Where things live

| Path                           | Holds                                                                 |
| ------------------------------ | --------------------------------------------------------------------- |
| `package/src/index.ts`         | the plugin: `createPlayerEventsPlugin`, its interfaces, `PlayerRoster` |
| `package/package.json`         | the published package: name, version, `files`, core as a peer          |
| `src/server/runtime.server.ts` | the game's server entry point: includes the plugin and ignites         |
| `src/client/runtime.client.ts` | the game's client entry point                                          |
| `src/server/services/`         | the game's server providers, which use the plugin                      |
| `src/client/controllers/`      | the game's client providers                                            |
| `src/server/tests/`            | tests of the game's use of the plugin                                  |
| `src/shared/tests/`            | tests of the plugin itself, run in both realms                         |
| `src/shared/fixtures/`         | helpers and providers the tests use; no entry point registers it       |

- In the place: `src/server` is `ServerScriptService.TS`, `src/client` is
  `StarterPlayer.StarterPlayerScripts.TS`, `src/shared` is `ReplicatedStorage.TS`, and the package
  is `ReplicatedStorage.rbxts_include.node_modules.@your-scope.player-events.out`, as in any game
  that installs it.
- `out/`, `include/`, `flamework.build`, `package/out/` and `package/flamework.build` are
  git-ignored. `flamework.config.json` is the game's config, and committed; the package has none.

## Tests

Read `node_modules/@flamework-experimental/core/docs/ai/testing.md` before you write or run tests;
`.claude/rules/testing.md` adds what this template does.

- `bun run test` (`scripts/test.mjs`) builds the package, then the game with
  `FLAMEWORK_SCOPES=testing`, and makes `test.rbxl`. `flamework-test` then lays that over
  `tests/place.rbxlx` and runs the sections in Studio, on the server and then on the client. Extra
  arguments go to `flamework-test`. It needs Studio's "MCP server" setting on, and `lune`.
- Tests of the plugin itself ignite a module of their own per test, with the plugin and the
  fixtures they register, and extinguish it afterwards. Tests of the game's use of it inject the
  game's providers.
- Whether the tests pass or fail, `bun run test` ends by rebuilding `out/` with `FLAMEWORK_SCOPES`
  set to nothing. Never put the scope in `.env` or `.env.local`: every other build reads them. A run
  stopped with Ctrl+C skips the rebuild, so `out/` keeps the test build: run `bun run build`.
- **How much to run:** as "How much to test" in the imported flamework.md says. A Studio run of
  one feature is `bun run test --sections <section>` (`player-events`, `welcome-service`), plus
  `--realm` when one realm is enough. The whole `bun run test` only when the user asks or agrees.
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
- Line endings are LF everywhere: `.gitattributes` sets `eol=lf`, which overrides `core.autocrlf`.
