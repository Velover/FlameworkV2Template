import { Flamework, HookPriority, PluginDefinition } from "@flamework-experimental/core";
import { Players } from "@rbxts/services";

/**
 * Implement on a provider, or anything else the module creates, to hear about each player that
 * joins.
 */
export interface OnPlayerJoined {
	onPlayerJoined(player: Player): void;
}

/** Implement to hear about each player that leaves. */
export interface OnPlayerLeft {
	onPlayerLeft(player: Player): void;
}

/**
 * The players the plugin has announced and not yet seen leave, in the order they joined. The plugin
 * provides one per module, so any provider can inject it.
 */
export class PlayerRoster {
	private readonly players = new Array<Player>();

	getPlayers(): ReadonlyArray<Player> {
		return this.players;
	}

	has(player: Player) {
		return this.players.includes(player);
	}

	/** @internal */
	add(player: Player) {
		this.players.push(player);
	}

	/** @internal */
	remove(player: Player) {
		const index = this.players.indexOf(player);
		if (index !== -1) this.players.remove(index);
	}

	/** @internal */
	clear() {
		this.players.clear();
	}
}

export interface PlayerEventsOptions {
	/**
	 * Announce the players already in the game when the module has ignited, as if they had just
	 * joined. Default: true.
	 */
	announceExisting?: boolean;
}

/** Calls each listener on a thread of its own, so one that yields or errors holds up no other. */
function notify<T>(listeners: ReadonlySet<T>, call: (listener: T) => void) {
	// A copy: a listener may create an object the plugin then observes, which adds to the set.
	for (const listener of [...listeners]) {
		task.spawn(call, listener);
	}
}

/**
 * The plugin: include it in each realm's module, `.includePlugin(createPlayerEventsPlugin())`, or
 * {@link PlayerEventsPlugin} for the defaults.
 */
export function createPlayerEventsPlugin(options: PlayerEventsOptions = {}): PluginDefinition {
	const announceExisting = options.announceExisting ?? true;

	return Flamework.createPlugin("PlayerEvents", (target) => {
		// Everything from here on belongs to one ignition of one module: two modules that include
		// the plugin get a roster each.
		const roster = new PlayerRoster();
		const joinListeners = new Set<OnPlayerJoined>();
		const leaveListeners = new Set<OnPlayerLeft>();
		const connections = new Array<RBXScriptConnection>();
		let started = false;

		target.provideInstance(roster);

		// Every object that implements the interface, as the module creates it: providers, and
		// anything from createClassInstance. Only a class with a Flamework decorator is matched.
		target.observe<OnPlayerJoined>({
			onAdded: (listener) => {
				joinListeners.add(listener);
				// One created after the start, such as a lazy provider, still hears about the players
				// that were announced before it existed.
				if (started) {
					for (const player of roster.getPlayers()) {
						task.spawn(() => listener.onPlayerJoined(player));
					}
				}
			},
			onRemoved: (listener) => joinListeners.delete(listener),
		});
		target.observe<OnPlayerLeft>({
			onAdded: (listener) => leaveListeners.add(listener),
			onRemoved: (listener) => leaveListeners.delete(listener),
		});

		const join = (player: Player) => {
			if (roster.has(player)) return;
			roster.add(player);
			notify(joinListeners, (listener) => listener.onPlayerJoined(player));
		};

		const leave = (player: Player) => {
			if (!roster.has(player)) return;
			roster.remove(player);
			notify(leaveListeners, (listener) => listener.onPlayerLeft(player));
		};

		// Once the module is up. Last, so that the providers' onStart, which the lifecycle plugin
		// calls in this same phase, has run first and connected whatever it needs.
		target.onIgnited(
			() => {
				started = true;
				connections.push(Players.PlayerAdded.Connect(join));
				connections.push(Players.PlayerRemoving.Connect(leave));
				if (announceExisting) {
					for (const player of Players.GetPlayers()) join(player);
				}
			},
			{ priority: HookPriority.Last },
		);

		// Nothing is cleaned up for a plugin: disconnect what it connected, so a module that
		// extinguishes leaves nothing running.
		target.onExtinguished(() => {
			started = false;
			for (const connection of connections) connection.Disconnect();
			connections.clear();
			roster.clear();
		});
	});
}

/** The plugin with the default options. */
export const PlayerEventsPlugin = createPlayerEventsPlugin();
