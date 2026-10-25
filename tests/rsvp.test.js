import test from 'node:test';
import assert from 'node:assert/strict';
import { isRsvpEndpoint, sendRsvp } from '../src/rsvp.js';

const endpoint = 'https://script.google.com/macros/s/test-deployment/exec';
const entry = { id: 'test-answer-123456', name: 'Анна Иванова', attendance: 'attending', guests: '2', food: 'Без орехов', transfer: true, comment: '' };

test('only accepts public Apps Script deployment URLs', () => {
  assert.equal(isRsvpEndpoint(endpoint), true);
  for (const url of ['', endpoint.replace('/exec', '/dev'), 'http://script.google.com/macros/s/id/exec', 'https://evil.example/exec', endpoint + '?token=secret']) {
    assert.equal(isRsvpEndpoint(url), false);
  }
});

test('sends all fields as a simple CORS POST and requires matching saved ID', async () => {
  const result = await sendRsvp(endpoint, entry, { fetchImpl: async (url, options) => {
    assert.equal(url, endpoint);
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'text/plain;charset=UTF-8');
    assert.notEqual(options.mode, 'no-cors');
    assert.equal(options.credentials, 'omit');
    assert.deepEqual(JSON.parse(options.body), entry);
    return { ok: true, json: async () => ({ ok: true, id: entry.id }) };
  } });
  assert.deepEqual(result, { ok: true, id: entry.id });
});

for (const [name, response] of [
  ['service rejection', { ok: true, json: async () => ({ ok: false, code: 'unavailable' }) }],
  ['acknowledgement for another answer', { ok: true, json: async () => ({ ok: true, id: 'different' }) }],
  ['opaque or HTTP error', { ok: false }],
  ['Google sign-in HTML instead of JSON', { ok: true, json: async () => { throw new SyntaxError('HTML'); } }],
]) {
  test(`does not report success for ${name}`, async () => {
    await assert.rejects(sendRsvp(endpoint, entry, { fetchImpl: async () => response }));
  });
}

test('rejects a network failure instead of pretending to save locally', async () => {
  await assert.rejects(sendRsvp(endpoint, entry, { fetchImpl: async () => { throw new TypeError('Network failure'); } }));
});

test('aborts a stalled request so a guest can retry', async () => {
  await assert.rejects(sendRsvp(endpoint, entry, {
    timeoutMs: 5,
    fetchImpl: async (_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true });
    }),
  }), /Aborted/);
});
