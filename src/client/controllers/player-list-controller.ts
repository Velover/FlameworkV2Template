import { Provider } from "@flamework-experimental/core";
import { OnPlayerJoined, OnPlayerLeft } from "@your-scope/player-events";

/** The plugin works on the client too, where it announces the local player with the others. */
@Provider()
export class PlayerListController implements OnPlayerJoined, OnPlayerLeft {
	onPlayerJoined(player: Player) {
		print(`${player.Name} is in the game`);
	}

	onPlayerLeft(player: Player) {
		print(`${player.Name} left`);
	}
}
