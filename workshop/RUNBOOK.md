# Running this in a room with no bandwidth

Written for our own session, and left here to be reused for yours. Nothing in
it is specific to our room: the short version is get everything onto your
machine beforehand, and nothing here needs the network once it's there.

It was written for a workshop on a venue network shared by fifty-odd people.
Change the numbers and the tiers to suit, and tell us what broke.

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

A browser won't load the page's modules over `file://`, so serve the folder
rather than opening the file. Not a security-context problem: `file://` is a
secure context in Chrome, measured. It's module loading that's blocked.

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

1. **DevTools only.** Call a tool from the WebMCP pane with your own
   parameters and watch the page render what came back. No model, no API key,
   no network. `show_patterns` with `bust` 60 and `level` beginner is the one
   to show: two facts about a person go in, and the page decides the
   components and writes the headings.
2. **The WebMCP - Model Context Tool Inspector extension.** Chrome's own recommendation
   and friendlier than DevTools, and it can drive an agent against your tools.
   It's an extension install, and its prompts go to a hosted model, so it
   needs the network and a managed laptop may block it.
3. **Recorded turns.** `structured-data/index.html` replays
   `structured-data/model-output.json`, a real model response, through
   `resolve.js`. It needs no flag and no model, everyone gets the same result
   at the same time, and editing the JSON is how a room sees a refusal happen.
4. **Live inference.** The most convincing and the most fragile. One machine
   on the room's screen is usually the right number.

## Preflight

Check this on the machine you'll bring, a week ahead:

- Chrome version, from `chrome://version`.
- Whether both flags above can be set and survive a relaunch.
- Whether you can install an extension at all.
- Whether `python3 -m http.server` or `py -m http.server` runs.
- Whether `node structured-data/resolve.check.js` passes.
- Whether <http://localhost:8000/structured-data/> renders two cards. That one
  needs no flags, so it's the floor everyone should reach.

Anything that fails is a pairing decision rather than a lost hour.

## What we tested, and where people get stuck

Both quick starts, steps 3 and 4, start to finish, served over `localhost`.
Tested on macOS only: nothing here is Mac-specific, but nobody has run it on
Windows yet, so treat the Windows commands as unverified.

| Browser | Step 3 | Step 4 page | Tools register |
|---|---|---|---|
| Chrome 154 | renders, no console errors | 3 tools listed | only with the flag on |
| Edge 154 | renders, no console errors | 3 tools listed | only with the feature on, same engine |
| Safari, WebKit 26.6 | renders, no console errors | 3 tools listed | no, WebKit opposes the spec |
| Firefox 155 | renders, no console errors | 3 tools listed | no, not implemented |

Step 4's page is useful in all four. Registration is the only part that
needs the flag, so a person on Safari still sees the tools, the schemas and the
composed output.

Five ways a participant loses the hour:

1. **Opening `index.html` from disk.** Chrome, Edge and Safari refuse to load
   the page's own modules from `file://`, with a CORS error naming the file.
   Firefox is more permissive and renders step 3 from disk, which is worse,
   because that person then hits a hard stop at step 4, whose page loads
   `tools.js` as a module. Serve the folder.
2. **Setting the flag and not relaunching.** The flags page says Relaunch for a
   reason. This is the most common one.
3. **Following a `chrome://` URL in Edge.** Edge keeps its switches under
   `edge://flags`. The page says so now.
4. **No `python3`.** A Mac without the Command Line Tools and a PC without
   Python both fall over here. `npx --yes serve -l 8000` is the way out, and it
   needs the network once, so do it before you travel.
5. **Port 8000 already in use.** Any port works. Change it in the command and
   in the URL.

## Two live sites, if a room asks who is actually doing this

From the WebMCP Directory, a third-party index by nekuda.ai. A listing is the
directory's claim rather than a verified fact, so open it before you show it.

- ZipRecruiter: <https://webmcp.com/sites/ziprecruiter.com>
- Target: <https://webmcp.com/sites/target.com>, listing `search_products` and
  `filter_products`
- The directory itself: <https://webmcp.com>

Both need the network, so they belong in the opening rather than the hands-on
half.

## If the network dies anyway

Every tier except 2 and 4 works with the wifi off. That's the point of the
list. Pair up, and watch the live parts on the room's screen.
