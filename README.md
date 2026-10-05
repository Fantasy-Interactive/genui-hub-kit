# GenUI Hub kit

Runnable code for [GenUI Hub](https://genuihub.vercel.app), an open knowledge
hub for generative interfaces, built and managed by
[Fantasy](https://fantasy.co).

**This is teaching code, not a framework.** Every file is meant to be read in
one sitting, copied, and changed. There's nothing to install and nothing to
import into your project.

Start on the hub's [getting-started page](https://genuihub.vercel.app/start).
Its four numbered steps walk through this repository, and every snippet on it
links to the file here that it was taken from. Steps 1 and 2 get the code and
serve it. Step 3 is `structured-data/`, step 4 is `webmcp/`, and each of those
pages says which step it is.

## What's inside

| Folder | What it shows |
|---|---|
| `structured-data/` | Step 3. A page that composes itself from a recorded model turn, where every fact comes from your catalog. `standalone.html` is the same thing in one file, for a machine you can't install anything on. |
| `webmcp/` | Step 4. A zero-dependency page that registers real WebMCP tools you can call from DevTools, plus the two patterns that keep it dependable: typed failure and the reveal gate. |
| `on-device/` | The same composition job run by Gemini Nano in the browser. No key, no account, no network. |
| `workshop/` | How to run all of it offline, on any machine. |

## Run it

**No git?** Download the zip from the green Code button, or:

```bash
# curl and tar ship with macOS, and with Windows 10 and newer.
curl -L https://github.com/Fantasy-Interactive/genui-hub-kit/archive/refs/heads/main.zip -o kit.zip
tar -xf kit.zip
cd genui-hub-kit-main
```

**No server either?** `structured-data/standalone.html` is the first quick
start in one file, with the catalog and the recorded turn inlined rather than
imported. Save it and double-click it: no git, no Python, no node, no admin
rights. Tested from `file://` in Chrome 154, Edge 154, WebKit 26.6 and Firefox
155. Step 4 can't be done this way. Not for the secure-context reason usually
given: checked in Chrome 154, a page opened from disk *is* a secure context and
`document.modelContext` is there with the flag on. What fails is that browsers
refuse to load a JavaScript module over `file://`, so `webmcp/index.html` never
loads `tools.js` and nothing registers.

You need node 18 or newer for the checks, and nothing at all for the pages.
There is a `package.json`, and its only job is `"type": "module"` so the checks
run as ES modules on every supported node. Nothing to install.

```bash
# Step 3, and the checks that make it worth trusting
node structured-data/resolve.check.js

# The reveal gate and the typed error envelope
node webmcp/reveal.check.js
```

```bash
# The WebMCP practice page. Serve it, don't open the file: a browser won't
# load tools.js as a module over file://, so nothing on the page runs.
python3 -m http.server 8000     # macOS and Linux
py -m http.server 8000          # Windows
npx --yes serve -l 8000         # anywhere with node
```

Then open:

- <http://localhost:8000/structured-data/> for step 3. It replays
  `model-output.json` through `resolve.js` and composes the result. No model
  runs and nothing leaves your machine. Edit the JSON and reload to see an
  invented product id refused before anything renders.
- <http://localhost:8000/webmcp/> for step 4, which needs the two Chrome flags
  below.
- <http://localhost:8000/on-device/> for the in-browser model benchmark.

To see the tools, enable `chrome://flags/#enable-webmcp-testing` and
`chrome://flags/#devtools-webmcp-support`, relaunch Chrome, and look in
DevTools under Application, then WebMCP. The page tells you if it can't find
the API.

## Running it on-device

`on-device/index.html` runs the same composition job entirely in Chrome, using
the built-in Prompt API and Gemini Nano. Open it the same way as the WebMCP page
and press the button.

**No subscription, no account, no flag.** The Prompt API is a web platform API
and has been stable since Chrome 148. It is a different thing from "Gemini in
Chrome", the cloud assistant at `chrome://settings/ai/gemini`, which does want
you signed in. You need neither of them for the other.

What it does need:

- Chrome 138 or newer, on Windows 10/11, macOS 13+, Linux, or a Chromebook Plus
- **22 GB free** on the volume holding your Chrome profile
- Either **16 GB of RAM and 4 cores**, or **more than 4 GB of VRAM**
- An unmetered connection for the first download only

The model downloads once per browser, triggered by pressing the button, because
the spec requires a user gesture before `create()`. The page reports download
progress rather than appearing to hang, and it names which requirement you are
missing rather than failing silently. Check `chrome://on-device-internals` for
the model state and its size.

One trap worth knowing if you also run local models: that 22 GB is checked
against free space, so filling the disk with Ollama models can take Gemini Nano
from available to unavailable without any other change.

Two things make it interesting beyond the novelty.

**Constrained decoding.** The Prompt API takes a `responseConstraint` JSON
Schema, so both the component names and the product ids are enums drawn from
the catalog and the decoder cannot emit either one wrong. Every server-side
model we measured was asked nicely in a prompt and validated afterwards, and the
failure we saw most often was an invented component name. Here that is not
possible rather than caught.

**A schema still cannot see across items.** "These two components must never
appear together" is a rule about the whole page, and per-item constraints have
no way to express it. That is why `resolve()` still runs, and it is worth being
precise about: the reason is the cross-section rules, not the product ids, which
the schema does pin.

### What on-device costs you

Worth being clear, because "no server" sounds like a pure win.

- **Validation moves into the browser.** The resolve and validate step is the
  thing keeping invented facts off the page, and in the browser it is running
  somewhere the visitor controls. Fine for choosing a layout. Not fine for
  anything transactional, where the server has to remain the authority whatever
  the page decided.
- **You do not choose the model.** Your brand experience rides on whatever
  version of Nano that browser shipped with, and it changes without you.
- **Latency is their hardware, not yours.** You cannot fix a slow result by
  paying for a faster tier.
- **It is not available to everyone.** Plan the path for the visitors who do not
  have it, because that path is the real experience for most of them today.

The honest read: on-device is excellent for decisions that touch sensitive
context, because the context never leaves the machine. Keep the facts, the rules
and anything that can be transacted on your own server.

## Nothing here is a stack

There is no framework in this repository and that is the point. A tool is a
name, a schema, and a function you already have. The patterns are plain
JavaScript with no imports, so they read the same whether your site is React,
Rails, Django or a pile of PHP, and they say nothing about which model you use.

The transferable parts are the shapes, not the choices: which capabilities your
site exposes and where, what happens on screen when one is called, and which
facts must never come from a model. Those survive every stack change you make
afterwards.

## One request path, four stack-agnostic mechanisms

Not a menu. Every request runs all four, in this order, and each one assumes
the one before it held. Taking two of them is how you end up with a page that
validates its data and then flashes empty while it renders it.

| | Mechanism | In this repository |
|---|---|---|
| 1 | Let the model choose, never let it supply facts | `structured-data/resolve.js` |
| 2 | Validate against your catalog, not just the shape | `validate()` in `structured-data/resolve.js` |
| 3 | Never uncover a gap | `webmcp/reveal.js` |
| 4 | Only offer a retry that might work | `webmcp/errors.js` |

Each file says in its own comments what it does and why it's shaped that way.
What the four cost, what they buy, and the failures they come from are on the
hub rather than repeated here, where the two copies would drift apart:
mechanisms 1 and 2 in [step 3 of the getting-started
page](https://genuihub.vercel.app/start#step-3), and 3 and 4 in [Speed, and
what the person sees while they
wait](https://genuihub.vercel.app/how-to#speed).

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

## See a bug or something inaccurate?

[Submit an issue](https://github.com/Fantasy-Interactive/genui-hub-kit/issues/new?template=bug.yml).
Inaccuracies count: this is teaching code, so a sentence that is wrong does as
much damage as a function that is. The form asks how you got the code and how
you opened the page, because those two answers explain most of what goes wrong.

## Licence

MIT. See [LICENSE](LICENSE).
