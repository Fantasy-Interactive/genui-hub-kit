# Running this in a room with no bandwidth

Written for a workshop on a venue network shared by fifty-odd people. The
short version: get everything onto your machine beforehand, and nothing in
here needs the network once it's there.

## Before you travel

```bash
git clone https://github.com/Fantasy-Interactive/genui-hub-kit.git
cd genui-hub-kit
node structured-data/resolve.check.js
```

If that prints `all assertions passed`, you're ready. No install step, and
nothing is downloaded when you run it.

If cloning is awkward, download the repository as a zip from GitHub and
unpack it. Same files.

## Serving it

WebMCP needs a secure context, so serve the folder rather than opening the
file. `localhost` counts as secure. `file://` does not.

```bash
python3 -m http.server 8000     # macOS and Linux, already installed
py -m http.server 8000          # Windows, already installed with Python
npx --yes serve -l 8000         # anywhere with node, needs the network once
```

Open <http://localhost:8000/> and navigate from there. These servers have no
single-page fallback, so a deep link typed in by hand returns 404.

## Turning WebMCP on

1. `chrome://flags/#enable-webmcp-testing`, set to Enabled.
2. `chrome://flags/#devtools-webmcp-support`, set to Enabled.
3. Relaunch Chrome. It won't pick up a flag while it's running.
4. Open the practice page, then DevTools, then Application, then WebMCP.

A managed laptop may refuse both flags. Find that out this week, not in the
room.

## Four tiers, least fragile first

Work down this list only as far as your machine allows. Everyone should reach
the first one.

1. **DevTools only.** Register a tool, call it from the WebMCP pane with your
   own parameters, watch the page render what it returned. No model, no API
   key, no network.
2. **The Model Context Tool Inspector extension.** Chrome's own recommendation
   and friendlier than DevTools, and it can drive an agent against your tools.
   It's an extension install, and its prompts go to a hosted model, so it
   needs the network and a managed laptop may block it.
3. **Recorded turns.** `structured-data/model-output.json` is a real model
   response. Rendering it needs nothing at all, and everyone gets the same
   result at the same time.
4. **Live inference.** The most convincing and the most fragile. One machine
   on the room's screen is usually the right number.

## Preflight

Check this on the machine you'll bring, a week ahead:

- Chrome version, from `chrome://version`.
- Whether both flags above can be set and survive a relaunch.
- Whether you can install an extension at all.
- Whether `python3 -m http.server` or `py -m http.server` runs.
- Whether `node structured-data/resolve.check.js` passes.

Anything that fails is a pairing decision rather than a lost hour.

## If the network dies anyway

Every tier except 2 and 4 works with the wifi off. That's the point of the
list. Pair up, and watch the live parts on the room's screen.
