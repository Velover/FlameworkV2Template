---
paths:
  - "src/*/tests/**/*.ts"
  - "tests/**"
---

# Tests in the place (`@flamework-experimental/testing`)

For anything not covered here, read
`node_modules/@flamework-experimental/core/docs/guide/12-testing.md`, and
`node_modules/@flamework-experimental/core/docs/guide/11-scopes.md` for the `testing` scope.

## Running

- `bun run test` (`scripts/test.mjs`) does five things:
  1. builds with `FLAMEWORK_SCOPES=testing`;
  2. builds `test.rbxl`;
  3. lays that over `tests/place.rbxlx`;
  4. runs every section in Studio: the server's first, then the client's, in one play session;
  5. rebuilds `out/` without the scope, whatever the result. It exits with the first failing
     step's code (127 for a tool it can't find), or else the rebuild's.
- It needs Studio with "MCP server" on in its Assistant settings, and `lune` (`aftman.toml`). It
  exits non-zero when a test fails.
- Extra arguments go to `flamework-test`:
  - `bun run test --sections levels` runs one section, and `--sections coin/<test name>` one test.
  - A section only one realm has needs `--realm` too, as in `--realm server --sections coin`.
    Otherwise the other realm reports `MISS matched nothing` and fails the run.
- A command it can't find (`rojo`, `flamework-test`) is reported as `<name> not found on PATH`,
  and the rebuild still runs. Without `rbxtsc`, nothing is built at all: run `bun install`.
- Every run leaves `test.rbxl`, `test.patched.rbxl` and `build/` behind; they are git-ignored.
- A run stopped with Ctrl+C skips the rebuild. It leaves:
  - the testing build in `out/`;
  - its Studio window, still in a play session, if the session had started.

  Run `bun run build` before `rojo serve` or `bun run place`, which would otherwise ship the test
  host. The next `bun run test` closes the stale window itself.

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

- **Where:** `src/server/tests`, `src/client/tests` or `src/shared/tests`. A section in `shared`
  runs once in each realm. The entry points register these folders with
  `{ activeIn: ["testing"] }`, so a build without the scope never loads them. A new test folder
  needs the same condition on its registration.
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

## Players, networking, components

- **Players:**
  - Sending to a player needs a real one: `waitForPlayer()` in `src/server/tests/players.ts`.
    What the server sends that player during a test reaches the client in the same session.
  - Where a player is only a key or an argument, use a stand-in: `scratch() as unknown as Player`.
    Firing at a stand-in raises.
- **Networking:**
  - `Functions.x.predict(player, ...)` and `Events.x.predict(player, ...)` run the server's side
    of a call here, with its guards and middleware.
  - A middleware can also be tested on its own: call the factory with a spy for `processNext`.
- **Components:**
  - Tag a part under `scratch()`. `components.getComponent<T>(part)` builds the component at once
    and returns it.
  - Removals and other signals arrive a frame later under Deferred: use `eventually`.

## The test place

- `tests/place.rbxlx` is what a new Studio Baseplate place has and a Rojo build lacks:
  `Workspace.SignalBehavior = Deferred`, a baseplate and a spawn.
- The run keeps its Workspace and replaces the code containers with the build's.
- Edit it in Studio and save it back as `.rbxlx`: it is committed, and text, so it diffs.
