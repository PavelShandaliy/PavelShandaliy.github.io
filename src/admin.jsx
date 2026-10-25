import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const RSVP_KEY = 'wedding-rsvps';

function Admin() {
  const [responses, setResponses] = useState([]);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    try { setResponses(JSON.parse(localStorage.getItem(RSVP_KEY) || '[]')); }
    catch { setNotice('Не удалось прочитать сохранённые ответы.'); }
  }, []);
  const attending = responses.filter((entry) => entry.attendance === 'attending');
  const guests = attending.reduce((total, entry) => total + Number(entry.guests || 1), 0);
  function exportCsv() {
    const columns = ['Имя', 'Ответ', 'Гостей', 'Еда и аллергии', 'Трансфер', 'Комментарий', 'Получен'];
    const rows = responses.map((entry) => [entry.name, entry.attendance === 'attending' ? 'Придёт' : 'Не придёт', entry.attendance === 'attending' ? entry.guests : '0', entry.food, entry.transfer ? 'Да' : 'Нет', entry.comment, new Date(entry.submittedAt).toLocaleString('ru-RU')]);
    const csv = [columns, ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(';')).join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }));
    link.download = 'otvety-gostey.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  }
  function clearResponses() {
    if (!window.confirm('Удалить все ответы, сохранённые в этом браузере?')) return;
    localStorage.removeItem(RSVP_KEY);
    setResponses([]);
    setNotice('Локальные ответы удалены.');
  }
  return <main className="admin-page">
    <header className="admin-header"><a className="monogram" href="./">П<span>&</span>В</a><a href="./" className="admin-back">← На сайт</a></header>
    <section className="admin-content">
      <p className="eyebrow">7 ИЮЛЯ 2027 · ОРГАНИЗАЦИЯ</p><h1>Ответы гостей</h1>
      <div className="admin-warning"><strong>Важно о данных.</strong> Сейчас здесь отображаются только ответы, сохранённые в localStorage этого браузера. Гости со своих устройств сюда их не отправят. Для сбора ответов с сайта подключите облачную форму / базу данных. Эта страница не защищена паролем — не публикуйте её с персональными данными.</div>
      <div className="admin-stats"><article><span>Всего ответов</span><strong>{responses.length}</strong></article><article><span>Придут</span><strong>{attending.length}</strong></article><article><span>Всего гостей</span><strong>{guests}</strong></article></div>
      <div className="admin-actions"><button className="button button-dark" onClick={exportCsv} disabled={!responses.length}>Скачать CSV</button><button className="admin-clear" onClick={clearResponses} disabled={!responses.length}>Удалить ответы</button></div>
      {notice && <p className="admin-notice" role="status">{notice}</p>}
      {responses.length ? <div className="responses-list">{responses.map((entry) => <article className="response-card" key={entry.id}><div className="response-head"><h2>{entry.name}</h2><span className={entry.attendance === 'attending' ? 'response-status yes' : 'response-status no'}>{entry.attendance === 'attending' ? `Придёт · ${entry.guests} чел.` : 'Не придёт'}</span></div><dl>{entry.food && <><dt>Еда / аллергии</dt><dd>{entry.food}</dd> </>}{entry.attendance === 'attending' && <><dt>Трансфер</dt><dd>{entry.transfer ? 'Нужен' : 'Не нужен'}</dd></>}{entry.comment && <><dt>Комментарий</dt><dd>{entry.comment}</dd></>}<dt>Получен</dt><dd>{new Date(entry.submittedAt).toLocaleString('ru-RU')}</dd></dl></article>)}</div> : <div className="empty-state"><span>✳</span><h2>Пока ответов нет</h2><p>Когда кто-то отправит форму в этом браузере, ответ появится здесь.</p></div>}
    </section>
  </main>;
}

createRoot(document.getElementById('root')).render(<Admin />);
