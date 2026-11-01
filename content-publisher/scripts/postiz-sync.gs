/**
 * POSTIZ tab ↔ Postiz.
 * - Approval → Ready: schedules the row in Postiz, writes the Post ID.
 * - Approval → Draft or Rejected (post not live yet): removes it from Postiz, clears the Post ID.
 * - Edit Date/Time/Account/Caption/Hashtags/Slides on a scheduled row: re-schedules with the new values.
 * - Rows already live are never changed; edits there only get a note in Log.
 * - Every 15 min: syncs from Postiz: failures into Error, the live Instagram link into IG Link.
 * Every action is written to the Log column (who, what, when).
 *
 * Setup (once): Script Properties → POSTIZ_API_KEY; then run setup().
 */

const API = 'https://api.postiz.com/public/v1';
const SHEET = 'POSTIZ';
const C = { date: 1, time: 2, account: 3, caption: 8, hashtags: 9, approval: 10, status: 11,
            postId: 12, preview: 13, error: 14, cover: 15, slides: 16, log: 17, note: 18, igLink: 19 }; // 1-based
const CONTENT_COLS = [C.date, C.time, C.account, C.caption, C.hashtags, C.slides];
const MIN_LEAD_MIN = 5;

function setup() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  const ss = SpreadsheetApp.getActive();
  ScriptApp.newTrigger('onSheetEdit').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('syncFromPostiz').timeBased().everyMinutes(15).create();

  const sh = ss.getSheetByName(SHEET);
  sh.getRange(1, C.log).setValue('Log');
  sh.getRange(1, C.igLink).setValue('IG Link');
  // Warn anyone who types into columns owned by formulas or this script.
  sh.getProtections(SpreadsheetApp.ProtectionType.RANGE)
    .filter(p => p.getDescription() === 'auto').forEach(p => p.remove());
  [C.status, C.postId, C.preview, C.error, C.cover, C.log, C.igLink].forEach(col =>
    sh.getRange(1, col, sh.getMaxRows(), 1).protect().setDescription('auto').setWarningOnly(true));
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Postiz')
    .addItem('Schedule all Ready rows', 'scheduleAllReady')
    .addItem('Sync from Postiz (errors + IG links)', 'syncFromPostiz')
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

// Kept so a trigger made by an older setup() still works.
function checkErrors() { syncFromPostiz(); }

function syncFromPostiz() {
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
    if (!p) return;
    const row = i + 2;
    if (p.state === 'ERROR') sh.getRange(row, C.error).setValue(p.error || 'Postiz reported an error');
    if (p.state === 'PUBLISHED' && p.releaseURL && sh.getRange(row, C.igLink).getValue() !== p.releaseURL)
      sh.getRange(row, C.igLink).setValue(p.releaseURL);
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
