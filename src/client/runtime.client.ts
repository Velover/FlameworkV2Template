import { Flamework } from "@flamework-experimental/core";
import { TestingPlugin } from "@flamework-experimental/testing";
import { PlayerEventsPlugin } from "@your-scope/player-events";

Flamework.createModule()
	// The plugin under development, included as a game that installed it would.
	.includePlugin(PlayerEventsPlugin)
	.registerProviders("src/client/controllers")
	// Only a build with the testing scope (`bun run test`) loads the tests and hosts them.
	.registerProviders("src/shared/tests", { activeIn: ["testing"] })
	.includePlugin(TestingPlugin)
	.ignite();
