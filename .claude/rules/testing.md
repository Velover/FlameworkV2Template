---
paths:
  - "src/*/tests/**/*.ts"
  - "tests/**"
---

# Tests in this template

Read `node_modules/@flamework-experimental/core/docs/ai/testing.md` first: it has the rules for
writing and running tests. This file adds only what this template does.

## `bun run test`

- `scripts/test.mjs` does five things:
  1. builds with `FLAMEWORK_SCOPES=testing`;
  2. builds `test.rbxl`;
  3. has `flamework-test` lay that over `tests/place.rbxlx`;
  4. runs the sections in Studio: the server's first, then the client's, in one play session;
  5. rebuilds `out/` with `FLAMEWORK_SCOPES` set to nothing, whatever the result, so a scope in
     `.env.local` or in your shell can't come back. It exits with the first failing step's code
     (127 for a tool it can't find), or else the rebuild's.
- Extra arguments go to `flamework-test`: `bun run test --sections levels` runs one section,
  `--sections coin/<test name>` one test. The server has `coin`, `coin-service` and `throttle`,
  the client `coin-spin`, and both `levels`.
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

## The tests here

- **Players:** `waitForPlayer()` and `waitForRoot(player)` in `src/server/tests/players.ts` wait
  for the play session's player and its character. It is a plain module of helpers inside a
  registered folder: it does nothing as it loads, so it may stay there.
- **Concurrent:** every test here is a plain one, run alone. The coin tests pay the one real player
  and compare with the count before (`before + 5`), so they must stay plain. Make a test concurrent
  only when it shares nothing with the others, and then use `t.scratch` and `t.defer`, not the bare
  `scratch` these tests call.

## The test place

- `tests/place.rbxlx` is what a new Studio Baseplate place has and a Rojo build lacks:
  `Workspace.SignalBehavior = Deferred`, a baseplate and a spawn.
- The run keeps its Workspace and replaces the code containers with the build's.
- Edit it in Studio and save it back as `.rbxlx`: it is committed, and text, so it diffs.
