# @your-scope/player-events

A [Flamework v2](https://github.com/Velover/ExperimentalFlameworkV2) plugin: providers implement
`OnPlayerJoined` and `OnPlayerLeft` to hear about players, and inject `PlayerRoster` for the players
in the game.

## Install

```sh
bun add @your-scope/player-events
```

- Add `node_modules/@your-scope` to `typeRoots` in `tsconfig.json`.
- Map `node_modules/@your-scope` in the Rojo project, next to `@flamework-experimental`.
- Use the version of `@flamework-experimental/core` this package names as its peer dependency.

## Use

```ts
import { PlayerEventsPlugin } from "@your-scope/player-events";

Flamework.createModule()
	.includePlugin(PlayerEventsPlugin)
	.registerProviders("src/server/services")
	.ignite();
```

```ts
import { OnPlayerJoined, PlayerRoster } from "@your-scope/player-events";

@Provider()
export class WelcomeService implements OnPlayerJoined {
	constructor(private readonly roster: PlayerRoster) {}

	onPlayerJoined(player: Player) {
		print(`Welcome, ${player.Name}: ${this.roster.getPlayers().size()} in the game`);
	}
}
```

- Each player is announced once, after the providers' `onStart`, on a thread of its own. The
  players already in the game when the module ignites are announced too, unless the plugin is
  created with `createPlayerEventsPlugin({ announceExisting: false })`.
- An object created later, such as a lazy provider, hears about the players announced before it.
- It works on the client too, where the local player is announced with the others.
