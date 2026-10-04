import { Provider } from "@flamework-experimental/core";
import { OnPlayerJoined, OnPlayerLeft } from "@your-scope/player-events";

// Providers for the modules the tests build themselves. They live outside every registered folder,
// so the game's own modules never register them: a test registers them with registerClassProvider.

/** Records what the plugin tells it. */
@Provider()
export class JoinRecorder implements OnPlayerJoined, OnPlayerLeft {
	readonly joined = new Array<Player>();
	readonly left = new Array<Player>();

	onPlayerJoined(player: Player) {
		this.joined.push(player);
	}

	onPlayerLeft(player: Player) {
		this.left.push(player);
	}
}

/** The same, built only when something first resolves it, after the plugin has started. */
@Provider({ lazy: true })
export class LazyJoinRecorder implements OnPlayerJoined {
	readonly joined = new Array<Player>();

	onPlayerJoined(player: Player) {
		this.joined.push(player);
	}
}
