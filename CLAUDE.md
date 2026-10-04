# Flamework Plugin Template

A Flamework v2 plugin, published as an npm package from `package/`, and a roblox-ts game in `src/`
that installs it and runs its tests in Studio. It started from the Flamework plugin template, whose
example plugin, `@your-scope/player-events` (providers implement `OnPlayerJoined` and
`OnPlayerLeft`, and inject a `PlayerRoster`), is there to be replaced.

## Stack

- roblox-ts 3.0.0 (`rbxtsc`) compiles `package/src/` to `package/out/`, and `src/` to `out/`.
  TypeScript is pinned to 5.5.3, the version roblox-ts 3.0.0 bundles.
- Rojo 7.7 (`aftman.toml`) builds the game's place from `default.project.json`.
- **Flamework v2 alpha**, pinned exactly; upgrade them together, to one release:
  - `@flamework-experimental/core` and `testing` 2.0.0-alpha.6;
  - `@flamework-experimental/transformer` 2.0.0-alpha.7, the tsconfig plugin.
  - The package names core as a peer dependency at the same version, and as a dev dependency:
    change all three together.
- Not v1: `@flamework/*` and `rbxts-transformer-flamework` are v1, and the Flamework website
  (flamework.fireboltofdeath.dev) documents v1. Don't use v1 docs, or v1's API from memory.
- Package manager: bun, one lockfile (`bun.lock`). The root is a workspace with `package/` in it,
  and needs bun's default (isolated) linker.

## Flamework docs

The guides for the installed version ship inside core, in
`node_modules/@flamework-experimental/core/docs/guide/`. They are the reference for this version:
read the matching guide before you write Flamework code you are not sure of. Most of their install
commands use npm; use bun here.

| Guide                     | For                                                                         |
| ------------------------- | --------------------------------------------------------------------------- |
| `01-getting-started.md`   | install, tsconfig, Rojo mapping, entry points, common errors                |
| `02-modules.md`           | modules, ignition, `Dependency<T>()`                                        |
| `03-providers.md`         | `@Provider`, registration by folder, injection, lazy providers, `loadOrder` |
| `04-lifecycle-events.md`  | `onInit`, `onStart`, `onTick`, `onPhysics`, `onRender` and their order      |
| `07-macros.md`            | `Flamework.id`/`createGuard`/`env`, `requireModules`, paths in a package    |
| `08-plugins.md`           | plugins: `createPlugin`, `target`, hooks, `observe`                         |
| `09-project-structure.md` | layout, `flamework.config.json`, what a published package may not set       |
| `10-migrating-from-v1.md` | porting v1 code, or advice written for v1                                   |
| `11-scopes.md`            | build scopes                                                                |
| `12-testing.md`           | tests that run inside the place                                             |

## Commands

- `bun install`.
- `bun run build` runs `rbxtsc -p package`, then `rbxtsc`. It is the check: both must exit 0 and
  print no `error TS` and no Flamework warning. Colour codes can split `error TS` and `[Flamework]`
  even in a log, so search a log for `error` and `Flamework`. `bun run build:package` builds the
  package alone.
- `bun run watch:package` and `bun run watch` rebuild the package and the game on change. A watcher
  keeps the `flamework.config.json` and `.env` it started with, so restart it after changing either.
- `bun run serve` runs `rojo serve` to sync into Studio, and `bun run place` builds `place.rbxl`.
  Build first: the project maps `out/`, `include/` and the package's `out/`.
- `bun run test` runs the tests in Studio; see [Tests](#tests).
- `bun run format` runs Prettier on `src/` and `package/src/`: tabs, a width of 100, trailing
  commas.
- Add a package the plugin uses to `package/package.json`, from `package/` (`bun add <name>`), and
  pin it in `package/tsconfig.json` `paths`; one the game alone uses goes in the root. Add a
  `@flamework-experimental/*` package with `bun add --exact`, at the version of the release the
  others come from (the monorepo's
  [CHANGELOG](https://github.com/Velover/ExperimentalFlameworkV2/blob/HEAD/CHANGELOG.md) heads
  each release with the versions it changed). Never add the transformer or roblox-ts to
  `package/package.json`: `.claude/rules/plugin.md` says why.
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
- Generated and git-ignored, never edited: `out/`, `include/` (including `include/flamework/`),
  `flamework.build`, `package/out/` and `package/flamework.build`. `flamework.config.json` is the
  game's config: commit it and keep its `$schema` line.

## Tests

- `bun run test` (`scripts/test.mjs`) builds the package, then the game with
  `FLAMEWORK_SCOPES=testing`, and makes `test.rbxl`. `flamework-test` then lays that over
  `tests/place.rbxlx` and runs every section in Studio, on the server and then on the client. It
  needs Studio's "MCP server" setting on, and `lune`. Each realm's summary counts passed, failed and
  skipped tests. A failure exits non-zero; a skip does not, unless the run has `--fail-on-skip`.
  Give a run nobody watches `--keep-awake`: while the display sleeps, RenderStepped stops and
  `onRender` tests fail.
- Tests of the plugin itself ignite a module of their own per test, with the plugin and the
  fixtures they register, and extinguish it afterwards. Tests of the game's use of it inject the
  game's providers. `.claude/rules/testing.md` has the details.
- Whether the tests pass or fail, `bun run test` ends by rebuilding `out/` with `FLAMEWORK_SCOPES`
  set to nothing. Never put the scope in `.env` or `.env.local`: every other build reads them. A run
  stopped with Ctrl+C skips the rebuild, so `out/` keeps the test build: run `bun run build`.

## Flamework v2 rules

- Every singleton is `@Provider()` from core, on both realms. There is no `@Service` or
  `@Controller`: the entry point that registers a folder decides the realm.
- Only classes under a registered folder exist at runtime, in the game. A new folder needs its own
  `registerProviders("src/...")` line in the entry point of each realm that uses it. The argument
  is a string literal and a source path, not a Rojo path. The package cannot use that call at all:
  it registers classes with `target.registerClassProvider`.
- A registered folder must exist, spelled as on disk (case included), and hold a module. The build
  still passes without one, but warns at the call. A missing folder makes the call wait forever at
  runtime, warning after 5 s that it `is still waiting for its folder`.
- Registered folders must not overlap, and registration requires every ModuleScript under them at
  startup. Keep modules that are neither providers nor tests, such as `src/shared/fixtures/`,
  outside them.
- Inject providers through the constructor. `Dependency<T>()` is for code without a constructor,
  once the module has ignited; never call it at a module's top level.
- `observe<T>` in a plugin only matches a class that carries a Flamework decorator and names `T` in
  its `implements` clause.
- Settings go in `flamework.config.json`, one section per package. The tsconfig plugin entry holds
  only `"transform"` (and `"configFile"`); the build refuses any other key. The package has no
  config of its own: never give it `idGenerationMode` or `obfuscation`.

## Gotchas

- Most of Flamework's API is macros that the transformer fills in. Without the transformer they
  are silently `nil`: read the emitted Luau in `out/` or `package/out/` when an argument is
  unexpectedly missing.
- Build the package before the game: the game compiles against `package/out/index.d.ts` and reads
  the plugin's ids from `package/flamework.build`, so a game build alone sees the package as it was
  last built.
- `linker = "hoisted"` breaks roblox-ts: it refuses an import from outside the project's own
  `node_modules` (`You cannot use modules directly under node_modules`).
- Keep TypeScript at the version roblox-ts bundles. Any other version makes every build warn
  `TypeScript version differs`, and the editor checks with a different compiler than the build.
- Line endings are LF everywhere: `.gitattributes` sets `eol=lf`, which overrides `core.autocrlf`.
- Shared modules run on both realms, and `Players.LocalPlayer` is undefined on the server. Guard
  realm-specific top-level code with `RunService.IsServer()`/`IsClient()`.
