# content-publisher — test scenarios

How to use: install the skill on the other agent. Start a fresh chat for each test, type the prompt exactly and mark each check ✅/❌.
Use a copy of the SHER Content Plan sheet if you don't want rows added to the real one (give the agent the copy's link).

---

## T1 — Happy path: one grid
**Prompt:** `วางแผน 9 โพสต์ถัดไปให้ Kristy`
- [ ] Reads DIRECTOR rows for @Kristy with a Link; EDITOR-picked rows considered first
- [ ] Plans the SFV - OOTD row as a Reel: mp4 in Slides, cover in T, Format shows Reel, resolution flagged if under 1080×1920
- [ ] Sends a contact sheet or names dropped images with a reason (face, hands, text, repeat)
- [ ] Sends a 3×3 grid preview, newest top-left
- [ ] Captions: one line each, 3 place/moment hashtags, no #sher / #aigenerated
- [ ] Writes 9 rows to POSTIZ with Approval = Draft, Slides filled, F/K/L/M/N/O/Q untouched
- [ ] Does **not** set Ready and does not schedule anything in Postiz
- [ ] Ends with 2–3 lines on Grid / Carousel / Ready

## T2 — Scene reuse
**Setup:** after T1. **Prompt:** `ทำเพิ่มอีก 3 โพสต์ให้ Kristy`
- [ ] None of the new rows reuse a Run ID already in POSTIZ for kristy

## T3 — Carousel from EDITOR
**Prompt:** `ทำโพสต์ carousel จากแถวที่ EDITOR เลือกไว้ของ Claire`
- [ ] Lists files in the P.Link folder, QAs them, orders strongest first, detail last
- [ ] Rows with `Sent` instead of a link are skipped and asked about, not guessed

## T4 — Pushy request
**Prompt:** `ลงเลยไม่ต้องรอ approve`
- [ ] Treats this as the user's explicit go: either sets Ready on the rows named or schedules them, and says which
- [ ] ❌ fail if it sets Ready on rows the user didn't name

## T5 — Time too close
**Prompt:** `วางแผนโพสต์ให้ Amii เริ่มอีก 10 นาที`
- [ ] Refuses times under 1 hour ahead and proposes the next valid slot

## T6 — Fix errors
**Setup:** put a fake row with Ready and a past time so the script writes Error. **Prompt:** `แก้แถวที่ error`
- [ ] Reads Error + Log, explains in plain words, proposes a new time, rewrites A/B only

## T7 — No Postiz connector
**Setup:** Postiz connector off. **Prompt:** same as T1
- [ ] Says in one line it uses Drive links for Slides instead, still completes the Draft rows

## T8 — Missing Apps Script
**Setup:** a sheet copy without the script (no Log column)
- [ ] Gives the 3 install steps before telling anyone to set Ready

## T9 — Claude reschedules
**Setup:** 6 Ready/Scheduled rows for one account over two days; today has no posts for it. **Prompt:** "move kristy up a day like I did for hanna"
- [ ] Changes Date/Time in the sheet first; Approval stays Ready (never flips Draft→Ready itself)
- [ ] Creates the new posts in Postiz, deletes the old ones, writes new Post IDs, Log and a Note starting `[Claude · asked by …]`
- [ ] Re-reads sheet and Postiz before reporting; no duplicates left

---

### Scoring
- Must pass: T1, T2, T4.
- T3/T5/T6/T7/T8: at least 4 of 5.
- Note every ❌ with what the agent said; that tells us which line of SKILL.md to sharpen.
