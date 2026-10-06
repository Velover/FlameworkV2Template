---
paths:
  - "src/*/tests/**/*.ts"
  - "src/shared/fixtures/**/*.ts"
  - "tests/**"
---

# Tests in this template

Read `node_modules/@flamework-experimental/core/docs/ai/testing.md` first: it has the rules for
writing and running tests. This file adds only what this template does.

## `bun run test`

- `scripts/test.mjs` does six things:
  1. builds the plugin package (`rbxtsc -p package`);
  2. builds the game with `FLAMEWORK_SCOPES=testing`;
  3. builds `test.rbxl`;
  4. has `flamework-test` lay that over `tests/place.rbxlx`;
  5. runs the sections in Studio: the server's first, then the client's, in one play session;
  6. rebuilds the game's `out/` with `FLAMEWORK_SCOPES` set to nothing, whatever the result, so a
     scope in `.env.local` or in your shell can't come back. It exits with the first failing step's
     code (127 for a tool it can't find), or else the rebuild's.
- Extra arguments go to `flamework-test`: `bun run test --sections player-events` runs one section,
  `--sections player-events/<test name>` one test. Both realms have `player-events`, and the server
  `welcome-service`.
- This template has one Rojo project, so `--parallel`, which is for a run of several, does not
  apply.
- `lune` comes from `aftman.toml`. A command the script can't find (`rojo`, `flamework-test`) is
  reported as `<name> not found on PATH`, and the rebuild still runs. Without `rbxtsc`, nothing is
  built at all: start it with `bun run test`, which puts `node_modules/.bin` on the PATH, and run
  `bun install`.
- Before it opens its own window, the run closes a window left from an earlier run that shows this
  very `test.patched.rbxl`: one on the user's desktop is asked first and ended after ten seconds,
  one on the hidden desktop is ended at once. Any other window is left alone.
- Every run leaves `test.rbxl` and `test.patched.rbxl`, git-ignored with the other root places. The
  patch's own files go to the system temp folder and are removed when the patch ends. `build/` is
  only written by `flamework-test`'s cloud commands, which this template doesn't use.
- Ctrl+C: `bun run` ends the script at once, before the rebuild, so `out/` keeps the testing build:
  run `bun run build` before `rojo serve` or `bun run place`. `flamework-test` still stops its play
  session, closes its window, frees the Studio lock and stops the MCP proxy; its
  `interrupted by Ctrl+C: cleaned up: ...` line follows a few seconds after the prompt comes back.

## Testing the plugin

- **Where:** `src/server/tests` and `src/shared/tests`. A new test folder, such as
  `src/client/tests` for client-only tests, needs the `{ activeIn: ["testing"] }` condition on its
  registration in its realm's entry point.
- **In a module of its own,** for a fresh roster and options of the test's choosing, extinguished
  by `defer` after the test. `src/shared/tests/player-events.ts` does this in `igniteWithPlugin`:

  ```ts
  Flamework.createModule()
    .includePlugin(createPlayerEventsPlugin({ announceExisting }))
    .registerClassProvider(JoinRecorder)
    .ignite();
  ```

  A test that extinguishes the module itself makes the `defer` skip it: `extinguish` raises on
  a module already extinguished.
- **Providers only those modules register** live in `src/shared/fixtures/`, outside every folder
  an entry point registers, so the game's own modules never pick them up. A fixture class still
  needs its `@Provider()`: `observe` only matches a decorated class.
- **Through the game,** a test injects one of the game's own providers that uses the plugin, as
  `src/server/tests/welcome-service.ts` does: the plugin there is the one the game's module
  includes.
- **Players:** `waitForPlayer()` in `src/shared/fixtures/players.ts` returns the play session's
  player, on the server once it has joined and on the client the local one.
- What the plugin announces arrives on threads of their own: wait for it with `eventually`.
- **Concurrent:** every test here is a plain one, run alone, and `igniteWithPlugin` calls the bare
  `defer`. Make a test concurrent only when it shares nothing with the others, and then use
  `t.defer` and `t.scratch`.

## The test place

- `tests/place.rbxlx` is what a new Studio Baseplate place has and a Rojo build lacks:
  `Workspace.SignalBehavior = Deferred`, a baseplate and a spawn.
- The run keeps its Workspace and replaces the code containers with the build's.
- Edit it in Studio and save it back as `.rbxlx`: it is committed, and text, so it diffs.
