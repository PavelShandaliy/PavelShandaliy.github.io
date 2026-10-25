// Only the public /exec URL belongs in the browser bundle — never a Google token.
export function isRsvpEndpoint(value) {
  try {
    const url = new URL(value);
    return url.origin === 'https://script.google.com' && /^\/macros\/s\/[\w-]+\/exec$/.test(url.pathname) && !url.search && !url.hash;
  } catch {
    return false;
  }
}

export async function sendRsvp(endpoint, entry, { fetchImpl = fetch, timeoutMs = 30000 } = {}) {
  if (!isRsvpEndpoint(endpoint)) throw new Error('Анкета пока не подключена. Свяжитесь с Татьяной.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      // A simple CORS request avoids the preflight unsupported by Apps Script.
      // Never use no-cors: an opaque response cannot confirm a saved answer.
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(entry),
      redirect: 'follow',
      credentials: 'omit',
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Сервис временно недоступен.');
    const result = await response.json();
    if (result.ok !== true || result.id !== entry.id) throw new Error('Сохранение не подтверждено.');
    return result;
  } finally {
    clearTimeout(timer);
  }
}
