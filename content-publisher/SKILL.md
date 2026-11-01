---
name: content-publisher
description: Plan and publish photo posts for SHER's AI KOL Instagram accounts through the SHER Content Plan sheet and Postiz. Picks ready scenes from DIRECTOR, QAs them, writes Draft rows with captions in the POSTIZ tab; the team approves with Ready and the sheet's Apps Script schedules them. Use for "plan posts", "fill the grid", "next 9 for Amii", "plan the month" and fixing rows that show Error.
---

# Content Publisher

Pipeline: preflight → intake → scene pool → QA → order the feed → captions → Draft rows in POSTIZ → user reviews in Grid / Carousel → user sets Ready → Apps Script schedules in Postiz → Status follows by formula.
Everything needed is in this file. Do not rely on earlier chats or on who the user is: any team member running this skill must get the same kind of result.
Reply in the user's language (casual Thai by default) with English technical terms. Show the grid preview, keep text short.

## Who does what
| | Claude (this skill) | People (Stamp, Pat, …) | Apps Script in the sheet |
|---|---|---|---|
| Pick + QA scenes | ✓ | | |
| Order the feed, write captions | ✓ | can edit any cell they own | |
| Write Draft rows | ✓ | | |
| Approve (Draft → Ready) or reject (→ Rejected) | **never on its own** | ✓ | |
| Replace a Rejected slot | ✓ when asked | | |
| Schedule / unschedule / reschedule in Postiz | only if the user asks in chat | | ✓ on every edit |
| Status, Preview, Cover, Format | | | formulas |
| Errors from Postiz | fixes on request | | writes Error every 30 min |

The approval click is the human checkpoint. Claude prepares, people decide, the script executes.

## Fixed vs adaptable
- **Fixed (never change):** the sheet layout and formulas below; the Draft → Ready → Scheduled → Published flow; nothing reaches Postiz without a person's Ready (or an explicit "post it" in chat); one scene used once per account; QA before a person sees anything; the caption rules.
- **Adaptable:** how images are downloaded and shown, which connector reads the sheet, how media gets a public URL (Postiz upload is preferred; a public Drive link works as fallback).
- When you adapt, say in one line what you changed.

## Step 0 — Preflight
1. **Google Sheets + Drive connectors.** Needed to read DIRECTOR / POSTIZ and list Drive folders. Missing → tell the user to connect them (Settings → Connectors) and stop.
2. **The sheet.** "SHER Content Plan – TEST", id `1Nm6SlnYxADAhz7KFNeiTh60WWHM9AfkSx_5iu417UYk` (use another id only if the user gives one). Tabs used: DIRECTOR (source), POSTIZ (plan + status), Grid (feed preview), Carousel (slide viewer).
3. **Postiz connector (optional).** Used to upload images (`uploadFromUrlTool`) and to list channels (`integrationList`). Without it, use the Drive fallback for Slides (Step 6) and say so.
4. **Apps Script installed?** On the SHER Content Plan – TEST sheet it is: Stamp installed it on 1 Nov 2026 with his Postiz key. Never ask anyone to install a second copy there (every post would be scheduled twice). On any other sheet, check that POSTIZ has a `Log` column (Q) with entries; if not, give the install steps in "Apps Script" below before anything is set to Ready.
5. **Postiz channel exists?** Every account you plan for must exist in Postiz under the same name (`integrationList`). Missing → plan the Draft rows anyway, and tell the user the channel must be connected in Postiz before anyone sets Ready (otherwise those rows go to Error).
6. **Sandbox network.** You must download images for QA. Test one Drive download (`https://drive.google.com/uc?export=download&id=<id>`). Blocked → ask the user to set network access to All domains; until then do QA from thumbnails only and say so.

## Step 1 — Intake
Defaults if the user doesn't say: **next 9 posts** (one full grid) for the account they name, **3 posts a day**, starting the next day.
| Ask only if missing | Default |
|---|---|
| Account (Postiz channel name, e.g. `amii`) | none, ask |
| How many posts / which dates | 9 posts, 3 per day from tomorrow |
| Times (Bangkok) | 3 slots a day, staggered by account so two accounts never post at the same minute: amii 09:00 · 14:00 · 19:00–21:00, hanna_ubabe 10:00 · 15:00 · 20:00, kristy 11:00 · 16:00 · 21:00. A new account takes the next free hour. |
Never plan a time less than 1 hour from now: the script refuses anything under 5 minutes, and people need time to approve.

## Step 2 — Scene pool
1. Read DIRECTOR for the account's character (`Character` column, e.g. `@Amii`). A row is usable when `Link` has an image.
2. **EDITOR-picked rows come first:** rows with `Post Wearing` / `Post Format` / `P.Link` filled. `P.Link` to a Drive folder = a carousel (all files in it). A file link = single. `SFV …` formats are short videos: skip them and say so (this skill is photo posts). A `P.Link` that says `Sent` or anything that isn't a link: skip and ask the user what it means.
3. **Exclude scenes already used:** any Run ID already in POSTIZ for that account, whatever its Approval or Status. `Rejected` counts as used: a person turned it down, never propose it again.
4. Download the candidates (`uc?export=download&id=<file id>`) into a fresh folder.

## Step 3 — QA (before any person sees an image)
Run `contact_sheet.py` on the candidates and look at it yourself, then open any doubtful image full size. Drop an image when:
- the face drifts from the character (compare across the pool: rounder, younger, different person),
- hands, limbs or body parts are wrong,
- stray text or garbled signage is readable,
- spatial sense is broken (body through furniture, outside a railing, floating objects),
- odd strips, borders, collage seams,
- pose + outfit nearly repeat another pick (same crouch, same outfit).
List what you dropped in one line each (Run ID + reason).

## Step 4 — Order the feed
Instagram shows newest top-left, 3 per row. Plan in blocks of 9 (3 rows).
- **Rhythm per 9:** ~4 full-body action / location shots (they pull reach), ~2 waist-up doing something, 1 face close-up (the visual rest), 1 detail / object (if the pool has one), 1 mirror selfie or POV (reads most like a real person). Use what the pool allows; say which slot is missing.
- **Neighbours:** alternate bright / dark and indoor / outdoor; no two near-identical poses or outfits side by side or stacked.
- **Story:** keep a believable life: one city or trip at a time, mornings in the morning slot, nights at night. A move between cities happens between days.
- **Carousel order:** strongest frame first (it becomes the grid cover), detail / object frames last.
Render `grid_preview.py` with all covers newest first, including posts already live in the sheet for that account, and look at it before showing anyone.

## Step 5 — Captions
- English, **one short line** in her voice: casual, a little dry, first person or no subject, lowercase is fine. Tie it to the moment in the image or the story of the day.
- **Hashtags:** 3, about place and moment (`#tempelhof #berlin #sundaylight`).
- **Never** `#sher` or `#aigenerated`, never brand or product names in hashtags, no "AI" wording.
- Voice by character (cast), with her DIRECTOR tag and Postiz account:

| Character | DIRECTOR | Postiz account | Voice |
|---|---|---|---|
| Amii | `@Amii` | `amii` | pretty girl, 25, JP/UK |
| Hanna | `@Hanna` | `hanna_ubabe` | cool girl, 22, KR/CA |
| Kristy | `@Kristy` | `kristy` | sexy girl, 24, RU/AU |
| Claire | `@Claire` | not connected yet | rich girl, 23, PH/US |

  Check the Postiz names with `integrationList` each run; they win over this table. A new character: ask for one line about her before writing.

## Step 6 — Write Draft rows
Append new blocks below the last used row of POSTIZ, in time order within the block (replacements are the exception, see 7b). Fill **only** these columns:
| Col | Field | Value |
|---|---|---|
| A | Date | `yyyy-mm-dd` |
| B | Time (BKK) | `H:mm` |
| C | Account | Postiz channel name, exactly (`integrationList`), e.g. `amii` |
| D | Channel | `Instagram` |
| E | Run ID | from DIRECTOR, e.g. `Run2-002` |
| H | Caption | Step 5 |
| I | Hashtags | Step 5 |
| J | Approval | `Draft` |
| P | Slides | public image URLs, comma-separated, in slide order |
| R | Note | optional: anything a reader should know about this pick |
**Slides:** upload each image with Postiz `uploadFromUrlTool` (url = the Drive `uc?export=download&id=` link) and use the returned `uploads.postiz.com` paths. Fallback without Postiz: the Drive `uc?export=download&id=` links themselves (the script uploads them at schedule time; the Grid image may stay blank).
**Never write** F, G, K, L, M, N, O, Q (formulas and script-owned). The source image link is not copied: it stays in DIRECTOR under the Run ID. Never edit a row that already has a Post ID (L) unless the user asks. Never set Approval to Ready yourself.

## Step 7 — Hand-off
Send the grid preview image and a short table (date · time · scene · caption). Then tell the user, in 2–3 lines:
- open **Grid** (pick the account in B1) for the feed and **Carousel** (pick a Run ID in B1) for the slides,
- edit anything in POSTIZ directly,
- set **Approval → Ready** on the rows they approve; the script schedules them within seconds and writes the Post ID; Status turns Scheduled, then Published at the post time.
Stop there. Don't follow up unless asked.

## Step 7b — Replacing a Rejected row (when asked)
A person sets Approval → `Rejected` when a scene shouldn't post. The row stays (history), Grid hides it, the script takes it out of Postiz if it was scheduled. When the user asks for a replacement:
1. Ask once, in one line, why it was rejected if they didn't say (face, outfit, vibe, repeat). Use the reason when picking.
2. Pick a new scene for the **same slot** (same date and time) through Steps 2–5, keeping the neighbours rule against the posts around it.
3. **Insert a new row directly below the Rejected row** (people read and approve in POSTIZ, so a replacement sits next to what it replaces) with Approval `Draft`. Inserting or moving rows is safe: formulas and the script work per row, never by row number. Never insert above row 2. Never edit or delete the Rejected row, except its Note.
4. Write both Notes (column R), so readers understand without asking:
   - Rejected row: `Rejected (<who>): <reason>. Replaced by <Run ID> (row below).`
   - New row: `Replaces <Run ID> (row above, rejected: <reason>). <Why this scene fits the slot: same city/time, contrast with neighbours, what it fixes>.`
   Refer to Run IDs or "row above/below", never row numbers: they change when rows move.
5. Send the updated grid preview.
If they just want the slot gone, do nothing: Grid already moved up.

## Step 8 — Fixing errors (when asked)
Read POSTIZ rows where Status = Error and the Error text (N) and Log (Q).
| Error says | Fix |
|---|---|
| Time has passed or is too close | Ask for a new time, write A/B; user sets Ready again |
| No Postiz channel named "…" | Correct C to the exact channel name from `integrationList` |
| No images in Slides / Postiz 4xx on upload | Re-upload the images, rewrite P |
| A platform message from Postiz (post failed on IG) | Report it in plain words; usually re-time and Ready again; if it's about the image, re-QA |
| Set POSTIZ_API_KEY | The script has no key: Apps Script → Project Settings → Script Properties |
Already-live posts can't be changed from the sheet; edits happen in the IG app.

## The sheet (reference — rebuild with exactly these if something breaks)
**POSTIZ** (row 1 = headers; formula cells live in row 1 and spill down):
- G1 `={"Image"; ARRAYFORMULA(IF(O2:O="", "", IMAGE(O2:O)))}` (cover preview; column 90 px wide, rows 120 px high)
- F1 `={"Format"; ARRAYFORMULA(IF(P2:P="", "", IF(REGEXMATCH(P2:P, ","), "Carousel ("&(LEN(P2:P)-LEN(SUBSTITUTE(P2:P, ",", ""))+1)&")", "Single")))}`
- K1 `={"Status"; ARRAYFORMULA(IF(E2:E="", "", IF(L2:L="", J2:J, IF(N2:N<>"", "Error", IF(A2:A+B2:B<=NOW(), "Published", "Scheduled")))))}`
- M1 `={"Preview"; ARRAYFORMULA(IF(L2:L="", "", "https://platform.postiz.com/p/"&L2:L&"?share=true"))}`
- O1 `={"Cover"; ARRAYFORMULA(IF(P2:P="", "", REGEXEXTRACT(P2:P, "^[^,]+")))}`
- Filter views for people (Data → Filter views): one per account, **filter only, no sort**. A sorted view breaks the spilled formula columns in that view (#REF!, blank Status). They change only what the viewer sees; rows are never moved. New blocks are appended at the bottom; replacements are inserted under the row they replace, so each account reads in time order in its view. Navigation lives on Grid row 1 (frozen): B1 account dropdown · C1 `▸ open <account> rows in POSTIZ` (`HYPERLINK("#gid=0&fvid="&SWITCH(B1, …))`) · E1 `▸ POSTIZ: all rows` (an "all" filter view with no criteria; a plain `#gid=0` link does not leave a filter view) · F1 `▸ Carousel viewer`. Keep POSTIZ free of buttons. If a filter view is recreated its id changes: update those links. A new account needs a filter view (filter only) and a case in the C1 SWITCH.
- J2:J dropdown Draft / Ready / Rejected (Rejected rows: grey, struck through). Spreadsheet time zone Asia/Bangkok, recalculation every minute (Status depends on NOW()).

**Grid** (B1 = account dropdown; Rejected rows are left out):
- A2 (cover images, 3 per row, newest first) `=IFERROR(MAP(WRAPROWS(SORT(FILTER(POSTIZ!O2:O, POSTIZ!C2:C=$B$1, POSTIZ!O2:O<>"", POSTIZ!J2:J<>"Rejected"), FILTER(POSTIZ!A2:A+POSTIZ!B2:B, POSTIZ!C2:C=$B$1, POSTIZ!O2:O<>"", POSTIZ!J2:J<>"Rejected"), FALSE), 3, ""), LAMBDA(u, IF(u="", "", IMAGE(u)))), "")`
- E2 (cards) `=IFERROR(WRAPROWS(SORT(FILTER(TEXT(POSTIZ!A2:A+POSTIZ!B2:B, "d mmm hh:mm")&" · "&POSTIZ!F2:F&CHAR(10)&POSTIZ!H2:H&CHAR(10)&POSTIZ!I2:I&CHAR(10)&POSTIZ!K2:K, POSTIZ!C2:C=$B$1, POSTIZ!O2:O<>"", POSTIZ!J2:J<>"Rejected"), FILTER(POSTIZ!A2:A+POSTIZ!B2:B, POSTIZ!C2:C=$B$1, POSTIZ!O2:O<>"", POSTIZ!J2:J<>"Rejected"), FALSE), 3, ""), "")`
- Sort keys must be numeric (`A+B`); a text sort key makes SORT return #VALUE!.

**Carousel** (B1 = Run ID dropdown from `POSTIZ!E2:E`):
- A2 `=IFERROR(XLOOKUP($B$1, POSTIZ!E2:E, POSTIZ!C2:C)&"  ·  "&TEXT(XLOOKUP($B$1, POSTIZ!E2:E, POSTIZ!A2:A)+XLOOKUP($B$1, POSTIZ!E2:E, POSTIZ!B2:B), "d mmm hh:mm")&"  ·  "&XLOOKUP($B$1, POSTIZ!E2:E, POSTIZ!F2:F)&"  ·  "&XLOOKUP($B$1, POSTIZ!E2:E, POSTIZ!K2:K)&"  ·  "&XLOOKUP($B$1, POSTIZ!E2:E, POSTIZ!H2:H), "")`
- A3 `=IFERROR(MAP(SPLIT(XLOOKUP($B$1, POSTIZ!E2:E, POSTIZ!P2:P), ","), LAMBDA(u, IMAGE(u))), "")`
- C1 `=IFERROR(IF(XLOOKUP($B$1, POSTIZ!E2:E, POSTIZ!M2:M)="", "(not in Postiz yet)", HYPERLINK(XLOOKUP($B$1, POSTIZ!E2:E, POSTIZ!M2:M), "Open in Postiz ↗")), "")`

Never type into Grid or Carousel output cells: one formula fills each block, typing over it breaks it (#REF!). Column R (Note) is free text for people and Claude; the script never writes it. If you add columns to POSTIZ, add them to the right of R; inserting in the middle shifts the script's column map (`C` in `postiz-sync.gs`).

## Apps Script (`scripts/postiz-sync.gs`)
Install once per sheet, by the person whose Postiz key it uses:
1. Sheet → Extensions → Apps Script → paste the file → Save.
2. Project Settings → Script Properties → `POSTIZ_API_KEY` = Postiz → Settings → Developers → Public API key.
3. Choose `setup` → Run → allow access. No Deploy needed.
What it does on every edit of POSTIZ:
| Change | Result |
|---|---|
| Approval → Ready, no Post ID | schedules in Postiz, writes Post ID |
| Approval → Draft or Rejected, not live yet | deletes it from Postiz, clears Post ID |
| Date / Time / Account / Caption / Hashtags / Slides edited on a scheduled row | deletes and re-schedules with the new values |
| Any edit on a row already live | changes nothing in Postiz, sets Approval back to Ready, notes it in Log |
| Time passed or < 5 min away | refuses, writes Error |
**Edits made through the Sheets API do not fire the script** (installable onEdit only runs for edits made in the Sheets UI). When the user asks you to change a scheduled row yourself: delete the old post in Postiz (`deletePostTool`), schedule the new one (`integrationSchedulePostTool`, same caption, hashtags and Slides, time converted to UTC), then write the new Post ID to L, the new Date/Time to A/B, and a line to Log (Q) like `<d MMM HH:mm> · Claude (asked by <who>) · rescheduled`, plus the reason in Note. Verify with `postsListTool` afterwards.
**House rule for changing a scheduled row:** set Approval → Draft, make all the edits, check them, then set Ready once. Editing a scheduled row directly re-schedules on every cell edit, so half-finished values can be scheduled in between. A single small time shift on the same day may be edited directly. Tell people this rule whenever they ask how to change a post.
Deleting a whole row does **not** trigger the script: a scheduled post would still go out. Set it to Rejected instead of deleting.
Plus: every 30 minutes it writes Postiz failures into Error. Formula and script columns are protected with a warning. Everyone with edit access can approve; the script runs as the installer. Triggers run until the installer loses access or revokes it; Google emails a failure summary if it breaks.

## Rules
- Nothing goes to Postiz without a person's Ready or an explicit "post it" in chat.
- One scene once per account (Rejected included). QA before showing. Drop and say why.
- Never delete POSTIZ rows; Rejected is how a row is removed.
- Only the input columns of POSTIZ; formulas and script columns stay untouched.
- Captions: one line, 3 place/moment hashtags, never #sher / #aigenerated.
- Times at least 1 hour ahead, Bangkok time.
- Photo posts only; videos (SFV) are out of scope.
- Keep replies short: the grid image first, a table second.

## Appendix — scripts (write these if `scripts/` is missing)

### scripts/postiz-sync.gs
```javascript
/**
 * POSTIZ tab ↔ Postiz.
 * - Approval → Ready: schedules the row in Postiz, writes the Post ID.
 * - Approval → Draft or Rejected (post not live yet): removes it from Postiz, clears the Post ID.
 * - Edit Date/Time/Account/Caption/Hashtags/Slides on a scheduled row: re-schedules with the new values.
 * - Rows already live are never changed; edits there only get a note in Log.
 * - Every 30 min: writes Postiz failures into Error.
 * Every action is written to the Log column (who, what, when).
 *
 * Setup (once): Script Properties → POSTIZ_API_KEY; then run setup().
 */

const API = 'https://api.postiz.com/public/v1';
const SHEET = 'POSTIZ';
const C = { date: 1, time: 2, account: 3, caption: 8, hashtags: 9, approval: 10, status: 11,
            postId: 12, preview: 13, error: 14, cover: 15, slides: 16, log: 17 };      // 1-based
const CONTENT_COLS = [C.date, C.time, C.account, C.caption, C.hashtags, C.slides];
const MIN_LEAD_MIN = 5;

function setup() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  const ss = SpreadsheetApp.getActive();
  ScriptApp.newTrigger('onSheetEdit').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('checkErrors').timeBased().everyMinutes(30).create();

  const sh = ss.getSheetByName(SHEET);
  sh.getRange(1, C.log).setValue('Log');
  // Warn anyone who types into columns owned by formulas or this script.
  sh.getProtections(SpreadsheetApp.ProtectionType.RANGE)
    .filter(p => p.getDescription() === 'auto').forEach(p => p.remove());
  [C.status, C.postId, C.preview, C.error, C.cover, C.log].forEach(col =>
    sh.getRange(1, col, sh.getMaxRows(), 1).protect().setDescription('auto').setWarningOnly(true));
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Postiz')
    .addItem('Schedule all Ready rows', 'scheduleAllReady')
    .addItem('Check for errors', 'checkErrors')
    .addToUi();
}

/* ---------- triggers ---------- */

function onSheetEdit(e) {
  const r = e.range, sh = r.getSheet();
  if (sh.getName() !== SHEET) return;
  const cols = [];
  for (let c = r.getColumn(); c <= r.getLastColumn(); c++) cols.push(c);
  const touchedApproval = cols.includes(C.approval);
  const touchedContent = cols.some(c => CONTENT_COLS.includes(c));
  if (!touchedApproval && !touchedContent) return;

  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(30000)) return;
  try {
    const who = (e.user && e.user.getEmail()) || 'someone';
    for (let row = Math.max(2, r.getRow()); row <= r.getLastRow(); row++) {
      handleRow_(sh, row, touchedApproval, touchedContent, who);
    }
  } finally { lock.releaseLock(); }
}

function scheduleAllReady() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET);
  for (let row = 2; row <= sh.getLastRow(); row++) handleRow_(sh, row, true, false, 'menu');
}

function checkErrors() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET);
  const last = sh.getLastRow();
  if (last < 2) return;
  const ids = sh.getRange(2, C.postId, last - 1, 1).getValues().map(r => String(r[0]).trim());
  if (!ids.some(Boolean)) return;
  const start = new Date(Date.now() - 7 * 864e5).toISOString();
  const end = new Date(Date.now() + 60 * 864e5).toISOString();
  const posts = api_('get', '/posts?startDate=' + encodeURIComponent(start) + '&endDate=' + encodeURIComponent(end)).posts || [];
  const byId = {};
  posts.forEach(p => byId[p.id] = p);
  ids.forEach((id, i) => {
    const p = id && byId[id];
    if (p && p.state === 'ERROR') sh.getRange(i + 2, C.error).setValue(p.error || 'Postiz reported an error');
  });
}

/* ---------- core ---------- */

function handleRow_(sh, row, touchedApproval, touchedContent, who) {
  const rowData = readRow_(sh, row);
  const log = msg => sh.getRange(row, C.log).setValue(stamp_() + ' · ' + who + ' · ' + msg);
  const err = msg => { sh.getRange(row, C.error).setValue(msg); log('error: ' + msg); };
  const live = rowData.postId && rowData.when && rowData.when.getTime() <= Date.now();

  try {
    if (live) {                                            // already published: never touch Postiz
      if (rowData.approval !== 'Ready') sh.getRange(row, C.approval).setValue('Ready');
      return log('already live on the platform, sheet edit does not change it. Edit or delete on IG itself.');
    }

    if (rowData.approval === 'Ready' && !rowData.postId) return schedule_(sh, row, rowData, err, log);

    if (rowData.approval !== 'Ready' && rowData.postId) {   // un-approved before going live
      api_('delete', '/posts/' + rowData.postId);
      sh.getRange(row, C.postId).setValue('');
      sh.getRange(row, C.error).setValue('');
      return log('unscheduled (set back to ' + (rowData.approval || 'blank') + ')');
    }

    if (touchedContent && rowData.approval === 'Ready' && rowData.postId) {   // changed while scheduled
      api_('delete', '/posts/' + rowData.postId);
      sh.getRange(row, C.postId).setValue('');
      return schedule_(sh, row, readRow_(sh, row), err, log, 'rescheduled after edit');
    }
  } catch (e) {
    err(String(e.message || e).slice(0, 300));
  }
}

function schedule_(sh, row, d, err, log, label) {
  if (!d.when) return err('Date/Time unreadable. Use yyyy-mm-dd and H:mm.');
  if (d.when.getTime() < Date.now() + MIN_LEAD_MIN * 60e3) return err('Time has passed or is too close. Change Date/Time, then set Ready again.');
  if (!d.slides.length) return err('No images in Slides.');

  const integ = (api_('get', '/integrations') || []).find(i => String(i.name).toLowerCase() === d.account.toLowerCase());
  if (!integ) return err('No Postiz channel named "' + d.account + '".');

  const images = d.slides.map(url => {
    const up = api_('post', '/upload-from-url', { url: url });
    return { id: up.id, path: up.path };
  });
  const content = '<p>' + esc_(d.caption) + '</p>' + (d.hashtags ? '<p>' + esc_(d.hashtags) + '</p>' : '');
  const res = api_('post', '/posts', {
    type: 'schedule', date: d.when.toISOString(), shortLink: false, tags: [],
    posts: [{
      integration: { id: integ.id },
      value: [{ content: content, image: images }],
      settings: { __type: integ.providerIdentifier || 'instagram-standalone', post_type: 'post' }
    }]
  });
  sh.getRange(row, C.postId).setValue(res[0].postId);
  sh.getRange(row, C.error).setValue('');
  log(label || 'scheduled');
}

function readRow_(sh, row) {
  const v = sh.getRange(row, 1, 1, C.slides).getValues()[0];
  const disp = sh.getRange(row, 1, 1, C.slides).getDisplayValues()[0];
  let when = null;
  try {
    when = Utilities.parseDate(disp[C.date - 1] + ' ' + disp[C.time - 1],
      SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'yyyy-MM-dd H:mm');
  } catch (e) {}
  return {
    approval: String(v[C.approval - 1]).trim(),
    postId: String(v[C.postId - 1]).trim(),
    account: String(v[C.account - 1]).trim(),
    caption: v[C.caption - 1], hashtags: v[C.hashtags - 1],
    slides: String(v[C.slides - 1]).split(',').map(s => s.trim()).filter(Boolean),
    when: when
  };
}

function api_(method, path, body) {
  const key = PropertiesService.getScriptProperties().getProperty('POSTIZ_API_KEY');
  if (!key) throw new Error('Set POSTIZ_API_KEY in Script Properties.');
  const opt = { method: method, headers: { Authorization: key }, muteHttpExceptions: true };
  if (body) { opt.contentType = 'application/json'; opt.payload = JSON.stringify(body); }
  const res = UrlFetchApp.fetch(API + path, opt);
  if (res.getResponseCode() >= 300) throw new Error('Postiz ' + res.getResponseCode() + ': ' + res.getContentText());
  const t = res.getContentText();
  return t ? JSON.parse(t) : null;
}

function stamp_() {
  return Utilities.formatDate(new Date(), SpreadsheetApp.getActive().getSpreadsheetTimeZone(), 'd MMM HH:mm');
}

function esc_(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
```

### scripts/contact_sheet.py
```python
"""Numbered contact sheet for QA: every candidate image at a glance.

python3 -I contact_sheet.py <out.jpg> <img1> [<img2> ...] [--labels "001,002,..."] [--cols 7]
Labels default to each file's name without extension (use the Run ID number).
"""
import argparse, os
from PIL import Image, ImageDraw

a = argparse.ArgumentParser()
a.add_argument('out'); a.add_argument('imgs', nargs='+')
a.add_argument('--labels', default=''); a.add_argument('--cols', type=int, default=7)
o = a.parse_args()
labels = o.labels.split(',') if o.labels else [os.path.splitext(os.path.basename(p))[0] for p in o.imgs]
w, h = 300, 400
rows = (len(o.imgs) + o.cols - 1) // o.cols
sheet = Image.new('RGB', (w * o.cols, h * rows), 'white')
for i, (p, lab) in enumerate(zip(o.imgs, labels)):
    im = Image.open(p).convert('RGB'); im.thumbnail((w, h))
    d = ImageDraw.Draw(im); d.rectangle([0, 0, 8 + 8 * len(lab), 26], fill='black'); d.text((6, 7), lab, fill='white')
    sheet.paste(im, ((i % o.cols) * w, (i // o.cols) * h))
sheet.save(o.out, quality=85); print('contact sheet', sheet.size)
```

### scripts/grid_preview.py
```python
"""Instagram profile-grid preview (3 columns, 3:4 tiles, newest top-left).

python3 -I grid_preview.py <out.jpg> <newest.png> <next.png> ... <oldest.png>
Pass each post's cover (first slide) in feed order, newest first. Any count works; 9 = three rows.
"""
import sys
from PIL import Image

out, paths = sys.argv[1], sys.argv[2:]
w, h, g = 300, 400, 4
rows = (len(paths) + 2) // 3
img = Image.new('RGB', (w * 3 + g * 2, h * rows + g * (rows - 1)), 'white')
for i, p in enumerate(paths):
    im = Image.open(p).convert('RGB')
    if im.width / im.height > w / h:   # too wide: crop sides
        nw = int(im.height * w / h); x = (im.width - nw) // 2; im = im.crop((x, 0, x + nw, im.height))
    else:                              # too tall: crop top/bottom
        nh = int(im.width * h / w); y = (im.height - nh) // 2; im = im.crop((0, y, im.width, y + nh))
    img.paste(im.resize((w, h)), ((i % 3) * (w + g), (i // 3) * (h + g)))
img.save(out, quality=88); print('grid', img.size)
```
