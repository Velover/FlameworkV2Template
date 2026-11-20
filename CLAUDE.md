# Flamework Plugin Template

A Flamework v2 plugin, published as an npm package from `package/`, and a roblox-ts game in `src/`
that installs it and runs its tests in Studio. It started from the Flamework plugin template, whose
example plugin, `@your-scope/player-events` (providers implement `OnPlayerJoined` and
`OnPlayerLeft`, and inject a `PlayerRoster`), is there to be replaced.

## Flamework

Flamework's own instructions are the `flamework` Claude Code plugin, which `.claude/settings.json`
registers (the `flamework-experimental` marketplace, pinned by the tag
`claude-plugin-v2.0.0-beta.1`, the first release that has one) and enables. Settings don't install
it: once the folder is trusted, each person runs
`claude plugin install flamework@flamework-experimental --scope project` once (or
`/plugin install flamework@flamework-experimental` in a session). Its skills: `flamework:flamework`
(the rules, for any Flamework work), `flamework:plugins` (a plugin, and a package that other
games install, which is what this repository is about: use it for any work on `package/`),
`flamework:providers`, `flamework:components`, `flamework:networking` and `flamework:testing`. If
they are missing, ask the user to install the plugin. Upgrading Flamework moves the `ref` in
`.claude/settings.json` to the new release's tag (`claude-plugin-v<version>`); then
`claude plugin update flamework@flamework-experimental --scope project` updates the installed copy.

The guides they point to are in the plugin, and in
`node_modules/@flamework-experimental/core/docs/guide/` for the installed version. Most of their
install commands use npm; use bun here.

## Stack

- roblox-ts 3.0.0 (`rbxtsc`) compiles `package/src/` to `package/out/`, and `src/` to `out/`.
  TypeScript is pinned to 5.5.3, the version roblox-ts 3.0.0 bundles.
- Rojo 7.7 (`aftman.toml`) builds the game's place from `default.project.json`.
- **Flamework v2 beta:** `@flamework-experimental/core` and `testing`, and
  `@flamework-experimental/transformer`, the tsconfig plugin, all pinned exactly at 2.0.0-beta.0.
  Every package shares one version; upgrade them together.
  - The package names core as a peer dependency as `^2.0.0-beta.0` and as a dev dependency at
    exactly 2.0.0-beta.0: change both with the root's.
- Package manager: bun, one lockfile (`bun.lock`). The root is a workspace with `package/` in it.

## Commands

- `bun install`.
- `bun run build` runs `rbxtsc -p package`, then `rbxtsc`: both must pass the check described under
  "Building" in the `flamework:flamework` skill. `bun run build:package` builds the package alone.
- `bun run watch:package` and `bun run watch` rebuild the package and the game on change.
- `bun run serve` runs `rojo serve` to sync into Studio, and `bun run place` builds `place.rbxl`.
  Build first: the project maps `out/`, `include/` and the package's `out/`.
- `bun run test` runs the tests in Studio; see [Tests](#tests).
- `bun run format` runs Prettier on `src/` and `package/src/`: tabs, a width of 100, trailing
  commas.
- Add a package the plugin uses to `package/package.json`, from `package/` (`bun add <name>`), and
  pin it in `package/tsconfig.json` `paths`; one the game alone uses goes in the root. Add a
  `@flamework-experimental/*` package with `bun add --exact <name>@2.0.0-beta.0`, the version the
  others have.
- Publish from `package/` with `bun publish`, after setting its `version`; `prepublishOnly` builds
  it.

## Long-running commands: don't poll

- Run a long command (a test run, Studio, a long build) in the background, and let its completion
  notification wake you. Don't keep reading its output, or sleeping and looking again.
- No polling: it costs a lot of usage. Two health checks of your own are allowed if needed
  (reading its output, a status command): one near the start (did it start properly) and one
  midway. More only when the user asks for them. The user asking how it is going is not one of
  yours.
- Next to a long command, start a watcher in the background that ends, and so wakes you, when
  something goes wrong: the first failure line, output silent for minutes (a hang), or the command
  dying without finishing. One background watcher is not polling; checking again and again
  yourself is.
- Commands that finish in a minute or two need none of this: run them in the foreground, with a
  timeout.

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

Use the `flamework:testing` skill before you write or run tests;
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
- **How much to run:** as "How much to test" in the `flamework:flamework` skill says. A Studio run of
  one feature is `bun run test --sections <section>` (`player-events`, `welcome-service`), plus
  `--realm` when one realm is enough. The whole `bun run test` only when the user asks or agrees.
- **Unattended:** give a run nobody watches `--keep-awake`: while the display sleeps,
  RenderStepped stops and `onRender` tests fail.
- **Hidden window:** on Windows the run opens Studio on a hidden desktop, so nothing shows and the
  user's focus is left alone. Add `--show-windows` only when the user wants to watch, or when a
  hidden window `never showed up on the MCP proxy`.
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
