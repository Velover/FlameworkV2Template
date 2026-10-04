import { Provider } from "@flamework-experimental/core";
import { OnPlayerJoined, OnPlayerLeft, PlayerRoster } from "@your-scope/player-events";

/** Uses the plugin the way a game would: implements its events and injects its roster. */
@Provider()
export class WelcomeService implements OnPlayerJoined, OnPlayerLeft {
	private readonly welcomed = new Array<Player>();

	constructor(private readonly roster: PlayerRoster) {}

	onPlayerJoined(player: Player) {
		this.welcomed.push(player);
		print(`Welcome, ${player.Name}: ${this.roster.getPlayers().size()} in the game`);
	}

	onPlayerLeft(player: Player) {
		print(`${player.Name} left: ${this.roster.getPlayers().size()} in the game`);
	}

	/** The players this service has welcomed, in order. */
	getWelcomed(): ReadonlyArray<Player> {
		return this.welcomed;
	}
}
