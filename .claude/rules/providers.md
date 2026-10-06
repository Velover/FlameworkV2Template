---
paths:
  - "src/*/runtime.*.ts"
  - "src/server/services/**/*.ts"
  - "src/client/controllers/**/*.ts"
  - "flamework.config.json"
  - "tsconfig.json"
---

# Providers, entry points and config in this template

Read `node_modules/@flamework-experimental/core/docs/ai/providers.md` first: it has the rules.
This file adds only what this template does.

- The `provider`, `service` and `controller` snippets (`.vscode/flamework-snippets.code-snippets`)
  all write the same provider: `@Provider()`, `implements OnStart`, no constructor. Add one to
  inject.
- Each entry point includes the plugin first, `.includePlugin(PlayerEventsPlugin)`, as a game that
  installed it would, then registers its realm's providers. The game has no components, so no
  `ComponentPlugin`.
- `flamework.config.json` is the game's, and sets only `scopes.active`, from `FLAMEWORK_SCOPES`,
  which `bun run test` sets to `testing` for its build. Every other option is at its default.
