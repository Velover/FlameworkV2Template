import { ComponentPlugin } from "@flamework-experimental/components";
import { Flamework } from "@flamework-experimental/core";

Flamework.createModule()
	.registerProviders("src/server/services")
	.includePlugin(ComponentPlugin.fromPath("src/server/components"))
	.ignite();
