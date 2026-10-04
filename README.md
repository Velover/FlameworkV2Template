# Flamework Plugin Template

A Flamework v2 (alpha) plugin, published as an npm package, with a game that installs it and runs
its tests in Roblox Studio. The example plugin, `@your-scope/player-events`, tells providers about
players joining and leaving and gives them a roster of the players in the game; replace it with
yours.

## Start

You need [bun](https://bun.sh), and Rojo 7.7 with its Studio plugin (`aftman install` or
`rokit install` installs the versions in `aftman.toml`, Lune included).

```sh
git clone <this repository> my-plugin
cd my-plugin
bun install
bun run build
rojo serve
```

Open a place in Studio (a new Baseplate will do), connect from the Rojo plugin and press Play. The
output prints `Welcome, <your name>: 1 in the game` from the server, and `<your name> is in the
game` from the client.

## Layout

```
package/                    the plugin: the npm package you publish
  src/index.ts              createPlayerEventsPlugin(options), its interfaces and PlayerRoster
  package.json              its name, version and files; core as a peer dependency
  tsconfig.json             a package build: typings and the Flamework transformer
src/                        a game that uses the plugin and tests it; never published
  server/runtime.server.ts  includes the plugin, as a game that installed it would
  client/runtime.client.ts  the same on the client
  server/services/          a provider that uses the plugin
  client/controllers/       a controller that uses the plugin
  server/tests/             tests of the game's use of the plugin
  shared/tests/             tests of the plugin itself, run on the server and on the client
  shared/fixtures/          helpers and providers the tests use, outside every registered folder
tests/
  place.rbxlx               the place the tests run in
scripts/
  test.mjs                  what `bun run test` runs
```

The root is a bun workspace with `package/` in it. The game depends on
`"@your-scope/player-events": "workspace:*"`, so its `node_modules` links to `package/`, and the game
always runs the plugin's latest build.

- `bun run build` builds the package, then the game. `bun run build:package` builds the package
  alone.
- `bun run watch:package` and `bun run watch` rebuild the package and the game as you edit; run
  each in a terminal of its own.
- `bun run place` builds `place.rbxl`, and `bun run format` formats `src/` and `package/src/`.

## Tests

```sh
bun run test
```

This builds the package, then the game with the `testing` scope, and lays the build over
`tests/place.rbxlx`. It then runs the tests in Studio, on the server and on the client, and prints
each realm's passed, failed and skipped tests. Last, whatever the result, it rebuilds the game's
`out/` without the `testing` scope.

- **Needs:** Studio with "MCP server" turned on in its Assistant settings, and
  [Lune](https://lune-org.github.io/docs) (in `aftman.toml`).
- **Testing the plugin itself:** `src/shared/tests/player-events.ts` ignites a module of its own per
  test, with the plugin and the fixtures it needs, and extinguishes it afterwards. So each test
  gets a fresh plugin, with the options it wants.
- **One section:** `bun run test --sections player-events` runs one section, in each realm that has
  it.
- **Skips:** a test calls `skip(reason)` when something known only at run time rules it out, and
  `test.skip(name, body)` parks one. Each skip is listed with its reason, and fails the run only
  under `bun run test --fail-on-skip`.
- **Unattended runs:** `bun run test --keep-awake` keeps the display on while it runs. A sleeping
  display stops RenderStepped, which fails client tests that wait for a frame.
- **Other builds:** keep the `testing` scope out of `.env` and `.env.local`, which every build
  reads. A run stopped with Ctrl+C leaves the test build in `out/`: run `bun run build` before
  `rojo serve`.

## Making it yours

1. **Name it.** Pick a scoped name, `@scope/name`: roblox-ts and Flamework treat only a scoped name
   as a package. Set it in `package/package.json`, then replace `@your-scope/player-events` in the
   root `package.json` (the dependency), `tsconfig.json` (`typeRoots` lists the scope, and `paths`),
   `default.project.json` (the Rojo mapping) and the imports in `src/`. Run `bun install` afterwards.
2. **Write the plugin** in `package/src/`. Read the rules it has to follow first:
   `.claude/rules/plugin.md`, or guide 08 (below). A published plugin cannot use path macros such as
   `registerProviders("src/...")`; it registers its classes with `target.registerClassProvider`.
3. **Replace the example's use** in `src/server/services/` and `src/client/controllers/`, and its
   tests in `src/server/tests/` and `src/shared/tests/`. Every folder an entry point registers must
   keep at least one module, or lose its line in the entry point: the build warns about each one
   that does not.
4. **Rename the project:** `name` in the root `package.json` and in `default.project.json`, and the
   titles of this README and of `CLAUDE.md`.

## Publishing

```sh
cd package
bun publish
```

Set `version` in `package/package.json` first. `prepublishOnly` builds the package, and the
package publishes `out/` and `flamework.build`. A game's build reads the package's ids from
`flamework.build`, so it has to ship.

A game then installs it with `bun add @your-scope/player-events`, adds `node_modules/@your-scope` to
`typeRoots` in its `tsconfig.json`, maps `node_modules/@your-scope` in its Rojo project next to
`@flamework-experimental`, and includes the plugin in each realm's module. Its core has to be the
version the peer dependency names.

## Docs

The Flamework guides for the installed version are in
`node_modules/@flamework-experimental/core/docs/guide/`. For a plugin: `08-plugins.md`, and
`09-project-structure.md` and `07-macros.md` ("Paths") for what a published package may not do.
The Flamework website documents v1, most of which no longer applies.

`CLAUDE.md` and `.claude/rules/` are the instructions for Claude Code.
