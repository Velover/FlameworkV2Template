---
paths:
  - "package/**"
---

# The plugin package (`package/`)

For anything not covered here, read
`node_modules/@flamework-experimental/core/docs/guide/08-plugins.md`, and
`09-project-structure.md` next to it for what differs in a package.

## Shape

- `createPlayerEventsPlugin(options)` returns
  `Flamework.createPlugin("PlayerEvents", (target) => {...})`, and `PlayerEventsPlugin` is that
  with the defaults. A game includes it in each realm's module.
- The setup function runs once per ignition of every module that includes the plugin. Keep its
  state (the roster, the listener sets, the connections) inside it: state at the top of the file is
  shared by every module.
- What it uses from `target`:
  - `provideInstance(value)`: hands the module an object that providers inject by its type;
  - `observe<T>({ onAdded, onRemoved })`: every object that implements `T` as the module creates
    it, providers and `createClassInstance` alike. Only a class with a Flamework decorator, which
    names `T` in its `implements` clause, is matched;
  - `onIgnited(cb, { priority: HookPriority.Last })`: once the module is up, after the providers'
    `onStart` has been called;
  - `onExtinguished(cb)`: disconnect everything the plugin connected. Nothing does it for you.
- Nothing can be resolved during setup or `onPreIgnite`: keep `target.module` for later hooks.
- Call listeners with `task.spawn`, over a copy of the set, so one that yields or errors holds up no
  other, and one that creates an observed object does not change the set being walked.

## What a published package may not do

- **No path macros.** `registerProviders("src/...")`, `requireModules` and the glob macros resolve
  in the project that compiles them, so in a game they point at nothing. Register the package's
  own providers with `target.registerClassProvider(SomeClass)`.
- **A scoped name** (`@scope/name`): roblox-ts and Flamework treat only a scoped name as a package.
  Its ids start with that name (`@your-scope/player-events:init@PlayerRoster`), and a game's build
  reads them from the package's `flamework.build`, which `files` therefore publishes with `out/`.
- **No `idGenerationMode` or `obfuscation`** in a `flamework.config.json` here: the ids must be the
  same in every game.
- **Core as a peer dependency,** pinned to the release the package was built against, and as a dev
  dependency at the same version. The other Flamework packages it uses the same way.
- **No transformer or roblox-ts in `package/package.json`.** They are the root's: the package's
  tsconfig finds them there. roblox-ts walks `package/node_modules/@flamework-experimental` through
  its symlinks, and a transformer linked there makes `rbxtsc` hang for minutes.
- `@internal` in a JSDoc keeps a member out of the published typings (`stripInternal`), as
  `PlayerRoster.add` is.

## Building

- `bun run build:package` (`rbxtsc -p package`) writes `package/out/` and `package/flamework.build`.
  Build it before the game, which compiles against both: `bun run build` and `bun run test` do.
- The workspace needs bun's default (isolated) linker: each project has its own `node_modules` of
  links. `linker = "hoisted"` breaks roblox-ts, which refuses an import from outside the project's
  own `node_modules`.
- Each import the package shares with a dependency is pinned in `package/tsconfig.json` `paths`,
  and each import the package's typings make is pinned in the root `tsconfig.json` `paths`. A
  missing pin can make roblox-ts write an import through the wrong project's `node_modules`.
