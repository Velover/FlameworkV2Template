import { ComponentPlugin } from "@flamework-experimental/components";
import { Flamework } from "@flamework-experimental/core";

Flamework.createModule()
	.registerProviders("src/client/controllers")
	.includePlugin(ComponentPlugin.fromPath("src/client/components"))
	.ignite();
