import { eventually } from "@flamework-experimental/testing";
import { Players } from "@rbxts/services";

/**
 * The play session's player: on the server, once it has joined; on the client, the local player. A
 * plain module outside every registered folder, so no build loads it on its own.
 */
export function waitForPlayer() {
	eventually(() => Players.GetPlayers().size() > 0, "a player to join");
	return Players.GetPlayers()[0];
}
