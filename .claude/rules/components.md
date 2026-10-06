---
paths:
  - "src/*/components/**/*.ts"
---

# Components in this template

Read `node_modules/@flamework-experimental/core/docs/ai/components.md` first: it has the rules.
This file adds only what this template does.

- The `component` snippet (`.vscode/flamework-snippets.code-snippets`) writes the minimal form:
  attributes `{}`, a `BasePart`, `OnStart`, and the tag as a string inline.
- A tag that other code uses too goes in `src/shared/tags.ts`, as `Tags.Coin` does: move the
  snippet's inline string there when that happens.
- Both realms: a class in `src/shared/components/` (the folder does not exist yet) needs a
  `ComponentPlugin.fromPath("src/shared/components")` line in both entry points. The coin example
  is the other way: one class per realm with the same tag, `Coin` on the server and `CoinSpin` on
  the client.
