import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8');
const answer = { id: 'test-answer-123456', name: 'Анна Иванова', attendance: 'attending', guests: '2', food: 'Без орехов', transfer: true, comment: 'Спасибо!' };

function harness({ busy = false, writeError = false, flushError = false } = {}) {
  const rows = [];
  const events = [];
  const sheet = {
    getLastRow: () => rows.length,
    appendRow(row) {
      if (writeError) throw new Error('Write failed');
      rows.push(row);
      events.push('append');
    },
    setFrozenRows: () => {},
    getRange: () => ({ createTextFinder: (id) => ({ matchEntireCell: () => ({ findNext: () => rows.slice(1).some(row => row[0] === id) }) }) }),
  };
  const context = vm.createContext({
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (text) => ({ setMimeType: () => {
        events.push('response');
        return JSON.parse(text);
      } }),
    },
    LockService: { getScriptLock: () => ({ tryLock: () => !busy, releaseLock: () => events.push('unlock') }) },
    SpreadsheetApp: {
      openById: (id) => {
        assert.equal(id, '11cilhydWbMj9I30tHIC-c5-EH6p1COI1eCYzGjP_SYU');
        return { getSheetByName: (name) => { assert.equal(name, 'RSVP сайта'); return sheet; } };
      },
      flush: () => { if (flushError) throw new Error('Flush failed'); events.push('flush'); },
    },
  });
  vm.runInContext(source, context);
  return { rows, events, post: (data) => context.doPost({ postData: { contents: JSON.stringify(data) } }), get: () => context.doGet() };
}

test('writes attendance, food and transfer, then acknowledges only after flush', () => {
  const h = harness();
  assert.deepEqual(h.post(answer), { ok: true, id: answer.id });
  assert.equal(h.rows.length, 2);
  assert.deepEqual(Array.from(h.rows[1]).slice(2), ['Анна Иванова', 'С радостью буду!', 2, 'Без орехов', 'Да', 'Спасибо!']);
  assert.ok(h.events.indexOf('flush') < h.events.indexOf('response'));
  assert.equal(h.events.at(-1), 'unlock');
});

test('retry with the same ID is acknowledged without a duplicate row', () => {
  const h = harness();
  h.post(answer);
  assert.deepEqual(h.post(answer), { ok: true, id: answer.id });
  assert.equal(h.rows.length, 2);
});

test('declined guests are recorded with zero guests, no food or transfer', () => {
  const h = harness();
  h.post({ ...answer, attendance: 'declined', guests: '0' });
  assert.deepEqual(Array.from(h.rows[1]).slice(3, 7), ['К сожалению, нет', 0, '', 'Нет']);
});

test('rejects invalid data without writing anything', () => {
  for (const input of [null, {}, { ...answer, name: '  ' }, { ...answer, name: 'a'.repeat(101) }, { ...answer, attendance: 'maybe' }, { ...answer, guests: '6' }, { ...answer, guests: [1] }, { ...answer, transfer: 'yes' }, { ...answer, comment: 'a'.repeat(501) }]) {
    const h = harness();
    assert.equal(h.post(input).ok, false);
    assert.equal(h.rows.length, 0);
  }
});

test('neutralizes spreadsheet formulas in guest text', () => {
  const h = harness();
  h.post({ ...answer, name: '=IMPORTXML("https://example.com")', food: '+1', comment: '@SUM(A1)' });
  for (const index of [2, 5, 7]) assert.ok(h.rows[1][index].startsWith("'"));
});

for (const options of [{ busy: true }, { writeError: true }, { flushError: true }]) {
  test(`does not acknowledge when storage cannot complete: ${JSON.stringify(options)}`, () => {
    const h = harness(options);
    assert.equal(h.post(answer).ok, false);
    if (!options.busy) assert.equal(h.events.at(-1), 'unlock');
  });
}

test('public health check exposes no guest answers', () => {
  const h = harness();
  h.post(answer);
  assert.deepEqual(h.get(), { ok: true, service: 'wedding-rsvp', version: 1 });
});
