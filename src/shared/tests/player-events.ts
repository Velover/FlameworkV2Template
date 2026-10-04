import { Flamework, OnStart, Provider } from "@flamework-experimental/core";
import {
	defer,
	defineTests,
	eventually,
	expectEqual,
	expectFalse,
	expectTrue,
	test,
} from "@flamework-experimental/testing";
import { createPlayerEventsPlugin, PlayerRoster } from "@your-scope/player-events";
import { waitForPlayer } from "shared/fixtures/players";
import { JoinRecorder, LazyJoinRecorder } from "shared/fixtures/recorders";

/**
 * Ignites a module of its own with the plugin and the recorders, extinguished after the test unless
 * the test did it (a module refuses a second `extinguish`).
 */
function igniteWithPlugin(announceExisting?: boolean) {
	const module = Flamework.createModule()
		.includePlugin(createPlayerEventsPlugin({ announceExisting }))
		.registerClassProvider(JoinRecorder)
		.registerClassProvider(LazyJoinRecorder)
		.ignite();
	defer(() => {
		if (!module.isExtinguished()) module.extinguish();
	});
	return module;
}

/**
 * The plugin itself, in modules the tests build, so each test starts from a fresh roster. Both
 * realms register shared/tests, so both run it: on the client, the player is the local one.
 */
@Provider({ activeIn: ["testing"] })
export class PlayerEventsTests implements OnStart {
	onStart() {
		defineTests("player-events", () => {
			test("announces the players already in the game", () => {
				const player = waitForPlayer();
				const recorder = igniteWithPlugin().resolveDependency<JoinRecorder>();

				eventually(() => recorder.joined.includes(player), "the recorder to hear of the player");
				expectEqual(recorder.joined.size(), 1);
			});

			test("providers inject the module's roster", () => {
				const player = waitForPlayer();
				const roster = igniteWithPlugin().resolveDependency<PlayerRoster>();

				eventually(() => roster.has(player), "the roster to hold the player");
			});

			test("a lazy provider built later hears of the players announced before it", () => {
				const player = waitForPlayer();
				const module = igniteWithPlugin();
				const roster = module.resolveDependency<PlayerRoster>();
				eventually(() => roster.has(player), "the roster to hold the player");

				const lazy = module.resolveDependency<LazyJoinRecorder>();
				eventually(() => lazy.joined.includes(player), "the lazy recorder to hear of the player");
			});

			test("announceExisting: false announces only players who join later", () => {
				const player = waitForPlayer();
				const module = igniteWithPlugin(false);

				// Long enough for an announcement on its way to have arrived.
				task.wait(0.2);
				expectEqual(module.resolveDependency<JoinRecorder>().joined.size(), 0);
				expectFalse(module.resolveDependency<PlayerRoster>().has(player));
			});

			test("each module has a roster of its own, emptied when it extinguishes", () => {
				const player = waitForPlayer();
				const first = igniteWithPlugin();
				const second = igniteWithPlugin();
				const roster = first.resolveDependency<PlayerRoster>();

				expectTrue(roster !== second.resolveDependency<PlayerRoster>(), "the two rosters differ");
				eventually(() => roster.has(player), "the roster to hold the player");

				first.extinguish();
				expectEqual(roster.getPlayers().size(), 0);
			});
		});
	}
}
