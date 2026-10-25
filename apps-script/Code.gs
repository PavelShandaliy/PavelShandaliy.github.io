// Paste into a standalone Google Apps Script project. Deploy as a Web app:
// Execute as: Me; Who has access: Anyone. See apps-script/README.md.
const SPREADSHEET_ID = '11cilhydWbMj9I30tHIC-c5-EH6p1COI1eCYzGjP_SYU';
const SHEET_NAME = 'RSVP сайта';
const HEADERS = ['ID ответа', 'Время получения', 'Имя и фамилия', 'Присутствие', 'Количество гостей', 'Питание / аллергии', 'Трансфер', 'Комментарий'];

function jsonResponse_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  // Health check only. Guest data must never be returned by this public endpoint.
  return jsonResponse_({ ok: true, service: 'wedding-rsvp', version: 1 });
}

function validateEntry_(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid');
  if (typeof input.id !== 'string' || !/^[a-zA-Z0-9_-]{16,80}$/.test(input.id)) throw new Error('invalid');
  function text(key, max, required) {
    const value = input[key] === undefined ? '' : input[key];
    if (typeof value !== 'string' || value.length > max) throw new Error('invalid');
    const trimmed = value.trim();
    if (required && !trimmed) throw new Error('invalid');
    return trimmed;
  }
  if (!['attending', 'declined'].includes(input.attendance)) throw new Error('invalid');
  if (typeof input.transfer !== 'boolean') throw new Error('invalid');
  const attending = input.attendance === 'attending';
  if (attending && (!['string', 'number'].includes(typeof input.guests) || !/^[1-5]$/.test(String(input.guests)))) throw new Error('invalid');
  const food = text('food', 300, false);
  return {
    id: input.id,
    name: text('name', 100, true),
    attendance: input.attendance,
    guests: attending ? Number(input.guests) : 0,
    food: attending ? food : '',
    transfer: attending && input.transfer,
    comment: text('comment', 500, false),
  };
}

function sheetText_(value) {
  // Prevent user-controlled text from becoming a spreadsheet formula / CSV formula.
  return /^[=+\-@\t\r\n]/.test(value) ? "'" + value : value;
}

function doPost(e) {
  let lock;
  let acquired = false;
  try {
    const raw = e && e.postData && e.postData.contents;
    if (typeof raw !== 'string' || raw.length > 6000) return jsonResponse_({ ok: false, code: 'invalid' });
    const entry = validateEntry_(JSON.parse(raw));
    lock = LockService.getScriptLock();
    acquired = lock.tryLock(10000);
    if (!acquired) return jsonResponse_({ ok: false, code: 'busy' });
    const book = SpreadsheetApp.openById(SPREADSHEET_ID);
    // Separate from the Google Forms sheet; existing answers remain unchanged.
    const sheet = book.getSheetByName(SHEET_NAME) || book.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
    }
    // A retry after a timeout must not append a second copy of the same answer.
    const lastRow = sheet.getLastRow();
    const existing = lastRow > 1 && sheet.getRange(2, 1, lastRow - 1, 1)
      .createTextFinder(entry.id).matchEntireCell(true).findNext();
    if (!existing) {
      sheet.appendRow([
        entry.id,
        new Date(),
        sheetText_(entry.name),
        entry.attendance === 'attending' ? 'С радостью буду!' : 'К сожалению, нет',
        entry.guests,
        sheetText_(entry.food),
        entry.transfer ? 'Да' : 'Нет',
        sheetText_(entry.comment),
      ]);
    }
    // The client receives a positive acknowledgement only after pending writes finish.
    SpreadsheetApp.flush();
    return jsonResponse_({ ok: true, id: entry.id });
  } catch (error) {
    // Do not disclose exception details, sheet contents or guest data.
    return jsonResponse_({ ok: false, code: 'unavailable' });
  } finally {
    if (acquired) lock.releaseLock();
  }
}
