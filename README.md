# SHER KOL — Content Publisher skill

A Claude skill that plans photo posts for SHER's AI KOL Instagram accounts and gets them live through the SHER Content Plan sheet and Postiz.

## How it works
```
DIRECTOR (ready scenes) ──Claude──▶ POSTIZ tab: Draft rows (QA'd images, feed order, captions)
                                        │
                     people look at Grid / Carousel, edit, set Approval → Ready
                                        │
                          Apps Script ──▶ Postiz (scheduled) ──▶ Instagram
                                        │
                     Status, Preview, Cover update by formula; errors land in Error
```
- **Claude** picks and checks the scenes, orders the feed, writes captions and Draft rows. It never approves.
- **People** review in the sheet and flip **Ready**. Nothing else to learn.
- **The Apps Script** schedules, un-schedules and re-schedules in Postiz as rows change, and logs who did what.

## Install
- **Quickest:** add `content-publisher/SKILL.md` as a skill in Claude. It is self-contained: every script is in its appendix.
- **Full:** download this repo as a zip (Code → Download ZIP) and install the `content-publisher` folder.

## Before you start
1. Connect **Google Sheets** and **Google Drive** in Claude (Settings → Connectors). **Postiz** is optional (used to host images).
2. Set Claude's network access to **All domains** (it downloads images from Drive to check them).
3. Once per sheet, whoever owns the Postiz key installs the Apps Script (`content-publisher/scripts/postiz-sync.gs`): Extensions → Apps Script → paste → Script Properties `POSTIZ_API_KEY` → run `setup`. Steps are also in `SKILL.md`.

## Current install (live)
| Sheet | Apps Script | Installed by | Postiz key | Since |
|---|---|---|---|---|
| SHER Content Plan – TEST (`1Nm6SlnYxADAhz7KFNeiTh60WWHM9AfkSx_5iu417UYk`) | `Postiz Trigger` (Extensions → Apps Script) | Stamp | Stamp's Postiz account | 1 Nov 2026 |

- Already installed: **don't install it again** on this sheet; a second copy would schedule every post twice.
- The triggers run as Stamp. They stop if Stamp loses edit access to the sheet or revokes the script; failure emails go to Stamp.
- To update the code: Stamp pastes the new `postiz-sync.gs` over the old one and runs `setup` again (it replaces the old triggers).
- Postiz channels connected (checked 1 Nov 2026): `amii`, `hanna_ubabe`, `kristy` (all Instagram). Claire is not connected yet. The Account column must match these names exactly; the skill checks `integrationList` each run.

## Use
Say what you need in plain words, e.g. "plan the next 9 posts for Amii", "fill Hanna's grid for next week", "fix the Error rows".
You get: a grid preview image and a table. Then open the sheet, check **Grid** and **Carousel**, and set **Approval → Ready** on what you approve.

To only approve (no Claude needed): get edit access to the sheet and flip Ready. The script does the rest.

## Files
- `content-publisher/SKILL.md`: the skill (source of truth)
- `content-publisher/scripts/`: the same scripts as the SKILL.md appendix
- `content-publisher/TESTS.md`: test scenarios for checking the skill on another account
