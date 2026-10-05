---
paths:
  - "src/*/tests/**/*.ts"
  - "src/shared/fixtures/**/*.ts"
  - "tests/**"
---

# Tests in the place (`@flamework-experimental/testing`)

For anything not covered here, read
`node_modules/@flamework-experimental/core/docs/guide/12-testing.md`, and
`node_modules/@flamework-experimental/core/docs/guide/11-scopes.md` for the `testing` scope.

## Running

- Run only the sections the change touches, with `--sections`; the whole run only when the user
  asks or agrees (`CLAUDE.md`, "How much to run").
- `bun run test` (`scripts/test.mjs`) does six things:
  1. builds the plugin package (`rbxtsc -p package`);
  2. builds the game with `FLAMEWORK_SCOPES=testing`;
  3. builds `test.rbxl`;
  4. lays that over `tests/place.rbxlx`;
  5. runs every section in Studio: the server's first, then the client's, in one play session;
  6. rebuilds the game's `out/` with `FLAMEWORK_SCOPES` set to nothing, whatever the result, so a
     scope in `.env.local` or in your shell can't come back. It exits with the first failing step's
     code (127 for a tool it can't find), or else the rebuild's.
- It needs Studio with "MCP server" on in its Assistant settings, and `lune` (`aftman.toml`). It
  exits non-zero when a test fails. Each realm's summary reads `N passed, M failed, K skipped` and
  lists every skipped test with its reason; a skip fails nothing unless the run has
  `--fail-on-skip`.
- Never put `FLAMEWORK_SCOPES=testing` in `.env` or `.env.local`. Every other build reads them
  (`bun run build`, `watch`, a release), and would ship the test host.
- Extra arguments go to `flamework-test`:
  - `bun run test --sections player-events` runs one section, and
    `--sections player-events/<test name>` one test.
  - `--sections` is judged across both realms. A section only the server has runs there, and the
    client lists it as `not among the client's sections: welcome-service` without failing. An
    entry no realm has fails the run: `MISS matched nothing in any realm: welcome`.
  - `--realm server` or `--realm client` runs one realm. There, an entry that realm lacks fails
    the run.
  - `--fail-on-skip` makes any skip fail the run, and its section head `FAIL`: for a run that
    must run everything.
  - `--keep-awake` keeps the display on from the start of the run to its end (Windows). While the
    display sleeps, RenderStepped stops and a client test that waits on `onRender` fails; a
    minimized Studio still renders.
  - The other flags (`--list`, `--keep`, `--timeout`) are in
    `node_modules/@flamework-experimental/testing/README.md`.
- A command it can't find (`rojo`, `flamework-test`) is reported as `<name> not found on PATH`,
  and the rebuild still runs. Without `rbxtsc`, nothing is built at all: start it with
  `bun run test`, which puts `node_modules/.bin` on the PATH, and run `bun install`.
- The run opens its own Studio window. When it is done, it ends that window's process at once and
  removes the window's lock file. The only other window it closes is one that shows this very
  `test.patched.rbxl`, left from an earlier run: it asks first, and ends it after ten seconds.
- Every run leaves `test.rbxl` and `test.patched.rbxl`, git-ignored with the other root places. The
  patch's own files go to the system temp folder and are removed when the patch ends. `build/` is
  only written by `flamework-test`'s cloud commands, which this template doesn't use.
- A run stopped with Ctrl+C skips the rebuild: `bun run` ends the script at once. `out/` keeps
  the testing build, so run `bun run build` before `rojo serve` or `bun run place`, which would
  otherwise ship the test host.
- `flamework-test` still cleans up what it started: it stops its play session, closes its Studio
  window and removes its lock, releases its window-name claim, removes the patch's temp folder and
  stops the MCP proxy. The prompt comes back at once, and its
  `interrupted by Ctrl+C: cleaned up: ...` line follows a few seconds later. A second Ctrl+C before
  that line stops the cleanup at once and names what may be left; the next `bun run test` closes a
  window left showing `test.patched.rbxl` (it asks, then ends it after ten seconds).

## Writing one

```ts
@Provider({ activeIn: ["testing"] })
export class ShopTests implements OnStart {
	constructor(private readonly shop: ShopService) {}

	onStart() {
		defineTests("shop", () => {
			test("buying takes the price", () => {
				expectEqual(this.shop.price("sword"), 10);
			});
		});
	}
}
```

- **Where:** `src/server/tests` or `src/shared/tests`. A section in `shared` runs once in each
  realm. The entry points register these folders with `{ activeIn: ["testing"] }`, so a build
  without the scope never loads them. A new test folder, such as `src/client/tests` for client-only
  tests, needs the same condition on its registration in its realm's entry point.
- **Shape:** a test file is a provider that injects what it tests, and defines its sections in
  `onStart`, before any yield. The same section name in several files is one section.
- **Cleanup:** build instances under `scratch()`, a Workspace folder destroyed after each test, and
  undo anything else with `defer(fn)`. Tests share the server, so compare with the value before
  rather than assume a fresh one (`before + 3`).
- **Assertions:**
  - `expectEqual`, `expectArrayEqual`, `expectTrue`/`expectFalse`, `expectDefined`,
    `expectThrows`/`expectNoThrow`, `expectResolves`/`expectRejects` and `fail`;
  - `eventually(predicate, what)` polls every frame, for 5 seconds by default, for what the engine
    delivers later: deferred signals, replication, per-frame work.
  - A test times out after 30 seconds (`testing.timeout`).
- **Skipping:** `skip(reason)`, from the test's body or a `beforeEach`, ends the test as skipped,
  for what rules it out only at run time (the realm, a display that is asleep). A plain `return`
  would count as a pass. `test.skip(name, body)` parks a test without running it. Cleanup still
  runs after a skip. Keep `skip` out of `pcall`, `expectThrows` and threads that outlive the
  test: guide 12, "Skipping a test".

## Testing the plugin

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
  player, on the server once it has joined and on the client the local one. Where a player is only
  a key or an argument, use a stand-in: `scratch() as unknown as Player`.
- What the plugin announces arrives on threads of their own: wait for it with `eventually`.

## The test place

- `tests/place.rbxlx` is what a new Studio Baseplate place has and a Rojo build lacks:
  `Workspace.SignalBehavior = Deferred`, a baseplate and a spawn.
- The run keeps its Workspace and replaces the code containers with the build's.
- Edit it in Studio and save it back as `.rbxlx`: it is committed, and text, so it diffs.
