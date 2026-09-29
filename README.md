# GenUI Hub kit

Runnable code for [GenUI Hub](https://genuihub.vercel.app), an open knowledge
hub for generative interfaces, built and managed by
[Fantasy](https://fantasy.co).

**This is teaching code, not a framework.** Every file is meant to be read in
one sitting, copied, and changed. There's nothing to install and nothing to
import into your project. If a piece of it is useful, take it.

Start on the hub's [getting-started page](https://genuihub.vercel.app/start).
Each snippet there links to its file here.

## What's inside

| Folder | What it shows |
|---|---|
| `structured-data/` | The two-layer pattern. The model chooses and arranges. Your code supplies every fact. |
| `webmcp/` | A zero-dependency page that registers real WebMCP tools you can call from DevTools. |
| `workshop/` | How to run all of it offline, on any machine. |

## Run it

You need node 18 or newer for the checks, and nothing at all for the pages.

```bash
# The structured-data quick start, and the checks that make it worth trusting
node structured-data/resolve.check.js
```

```bash
# The WebMCP practice page. Serve it, don't open the file: WebMCP needs a
# secure context, and localhost is one while file:// is not.
python3 -m http.server 8000     # macOS and Linux
py -m http.server 8000          # Windows
npx --yes serve -l 8000         # anywhere with node
```

Then open <http://localhost:8000/webmcp/>.

To see the tools, enable `chrome://flags/#enable-webmcp-testing` and
`chrome://flags/#devtools-webmcp-support`, relaunch Chrome, and look in
DevTools under Application, then WebMCP. The page tells you if it can't find
the API.

## The two ideas worth taking

**Let the model choose, never let it supply facts.** In
`structured-data/resolve.js` the model emits a component name, a heading and
some ids. Prices and names come from the catalog afterwards. A model that
can't state a price can't state the wrong one.

**Validate against your catalog, not just the shape.** A JSON Schema check
passes a component you don't have and a product id that never existed.
`validate()` refuses both, and refuses the combinations your designers said
must never ship together. That last rule belongs in code, where it either
holds or throws, rather than in a prompt.

## Accuracy

The WebMCP API moves. This code targets `document.modelContext`, which is
where the specification put it on 21 July 2026, and feature-detects the older
`navigator.modelContext` because the origin trials still serve it. For what's
available in which release, follow
[Chrome's own page](https://developer.chrome.com/docs/ai/webmcp) and the
[specification repository](https://github.com/webmachinelearning/webmcp)
rather than any version number written here.

WebMCP is a Draft Community Group Report. It isn't a W3C Standard, and it
isn't on the standards track.

## Licence

MIT. See [LICENSE](LICENSE).
