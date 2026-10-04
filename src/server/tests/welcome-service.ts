import { OnStart, Provider } from "@flamework-experimental/core";
import { defineTests, eventually, test } from "@flamework-experimental/testing";
import { WelcomeService } from "server/services/welcome-service";
import { waitForPlayer } from "shared/fixtures/players";

/** The game's own provider, through the plugin the game's module includes. */
@Provider({ activeIn: ["testing"] })
export class WelcomeServiceTests implements OnStart {
	constructor(private readonly welcomeService: WelcomeService) {}

	onStart() {
		defineTests("welcome-service", () => {
			test("welcomes the player who joins", () => {
				const player = waitForPlayer();

				eventually(
					() => this.welcomeService.getWelcomed().includes(player),
					"the player to be welcomed",
				);
			});
		});
	}
}
