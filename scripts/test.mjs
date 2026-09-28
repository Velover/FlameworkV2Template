// `bun run test`: builds with the testing scope, runs the tests in Studio, then rebuilds without
// the scope whatever happened, so out/ never keeps a build that hosts the tests (guide 12,
// "Shipping").
// Extra arguments go to flamework-test, as in `bun run test --sections levels`.

/** Runs a command in the terminal. Returns its exit code, or undefined when it can't be started. */
function run(command, env = process.env) {
	try {
		return Bun.spawnSync(command, { env, stdio: ["inherit", "inherit", "inherit"] }).exitCode ?? 1;
	} catch (error) {
		// Bun throws, rather than returning a code, for a command it cannot start.
		const why =
			error.code === "ENOENT" ? "not found on PATH" : `could not be started (${error.message})`;
		console.error(`\n${command[0]} ${why}`);
		return undefined;
	}
}

const testEnv = { ...process.env, FLAMEWORK_SCOPES: "testing" };

let code = run(["rbxtsc"], testEnv);
if (code === undefined) {
	console.error(
		"Nothing was built, and there is no rbxtsc to rebuild out/ with: run `bun install`.",
	);
	process.exit(127);
}
// test.rbxl, not place.rbxl: the place `bun run place` builds never holds the tests.
if (code === 0) code = run(["rojo", "build", "-o", "test.rbxl"]) ?? 127;
if (code === 0) {
	const args = ["test", "test.rbxl", "--original", "tests/place.rbxlx", ...process.argv.slice(2)];
	code = run(["flamework-test", ...args]) ?? 127;
}

console.log("rebuilding out/ without the testing scope...");
const rebuild = run(["rbxtsc"]) ?? 127;
if (rebuild !== 0) {
	console.error(
		"The rebuild failed, so out/ may still hold the testing build: run `bun run build`.",
	);
}
process.exit(code !== 0 ? code : rebuild);
