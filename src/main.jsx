import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { isRsvpEndpoint, sendRsvp } from './rsvp.js';

// 14:00 по времени Иркутска (UTC+8).
const WEDDING_DATE = new Date('2027-07-07T06:00:00Z');
const RSVP_KEY = 'wedding-rsvps';
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSfksHDpRHD6ThPH03NCvT8qr8J-mqjbaEdSbpQJXybDsJaGCg/viewform';
const RSVP_ENDPOINT = (import.meta.env.VITE_RSVP_ENDPOINT || '').trim();
// Production never falls back to localStorage or pretends to save an answer.
const DEMO_MODE = import.meta.env.DEV && !RSVP_ENDPOINT;
const RSVP_READY = DEMO_MODE || isRsvpEndpoint(RSVP_ENDPOINT);
// Укажите ссылку на реестр подарков; пока её нет, блок не показывается.
const GIFT_REGISTRY_URL = '';
const navItems = [
  ['#story', 'Наша история'],
  ['#details', 'Детали'],
  ['#schedule', 'Программа'],
  ['#rsvp', 'Ответить'],
];

function Icon({ name, size = 20 }) {
  const paths = {
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    bus: <><path d="M5 17h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2Z"/><path d="M3 11h18M7 17l-1 3m12-3 1 3M7 8h.01M17 8h.01"/></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Countdown() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const diff = Math.max(0, WEDDING_DATE.getTime() - now);
  const parts = [
    [Math.floor(diff / 86400000), 'дней'],
    [Math.floor((diff % 86400000) / 3600000), 'часов'],
    [Math.floor((diff % 3600000) / 60000), 'минут'],
    [Math.floor((diff % 60000) / 1000), 'секунд'],
  ];
  return <div className="countdown" aria-label="Обратный отсчёт до свадьбы">
    {parts.map(([value, label]) => <div className="countdown-part" key={label}><span>{String(value).padStart(2, '0')}</span><small>{label}</small></div>)}
  </div>;
}

function Header() {
  const [open, setOpen] = useState(false);
  return <header className="site-header">
    <a className="monogram" href="#top" aria-label="Павел и Виктория, наверх">П<span>&</span>В</a>
    <button className="menu-toggle" aria-label={open ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={open} onClick={() => setOpen(!open)}>{open ? '×' : '☰'}</button>
    <nav className={open ? 'main-nav is-open' : 'main-nav'} aria-label="Основная навигация">
      {navItems.map(([href, label]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
    </nav>
  </header>;
}

function Hero() {
  return <section className="hero" id="top">
    <div className="hero-copy">
      <p className="eyebrow light">ИРКУТСК · 07 ИЮЛЯ 2027</p>
      <h1>Павел <span>и</span><br />Виктория</h1>
      <p className="hero-subtitle">Две дороги. Одна большая история.<br />И самый важный день — впереди.</p>
      <a className="button button-light" href="#details">Будьте с нами <Icon name="arrow" size={18} /></a>
      <p className="hero-date">СРЕДА <i></i> 14:00 <i></i> БАЙКАЛ</p>
    </div>
    <div className="hero-image-wrap">
      <img className="hero-image" src="./photos/1.jpg" alt="Павел и Виктория вместе" fetchPriority="high" />
      <div className="image-caption"><Icon name="heart" size={16} /> наша история продолжается</div>
    </div>
    <div className="hero-bottom-note">СВАДЬБА У БАЙКАЛА <span>✳</span> 07 / 07 / 2027</div>
  </section>;
}

function Story() {
  return <section className="section story-section" id="story">
    <div className="section-kicker"><span>01</span><span className="kicker-line"/><span>НАША ИСТОРИЯ</span></div>
    <div className="story-grid">
      <div className="story-photo-frame"><img src="./photos/2.jpg" alt="Павел и Виктория в путешествии" loading="lazy" /><span className="photo-stamp">вместе<br />лучше</span></div>
      <div className="story-text">
        <p className="eyebrow">Узрите, почтенные гости, Указ наш!</p>
        <p>В год 2027, месяца июля в 7-й день, когда солнце стоит в зените, мы, Виктория — воительница с сердцем, горящим как степной костёр, и Павел — воин, познавший силу мира, чьё слово твёрже стали, а верность крепче бетонных стен, решили объединить свои жизненные пути в одну колею.</p>
        <p>Не в голой степи раскинем мы шатёр, но на земле благословенной Пантелеем Пяндой и Яковом Похабовым — у берегов Байкала, ныне в граде Иркутском, где испокон веков степь и горы встречаются с водой, где ветер кочевой целует волны великого Моря, где сходятся пути всех, кому суждено найти друг друга.</p>
        <p>Этот день — не просто свадьба. Это наш общий праздник! Тех, с кем мы давно не виделись, но чьи лица помним, как родные. Тех, с кем судьба развела по разным дорогам, но чьи голоса звучат в памяти, как песни у костра. Тех, кто растил нас, кто вёл за руку по первой дороге, кто помогал в пути и продолжает помогать по сей день.</p>
        <p>Приходите с открытым сердцем — места в нашем шатре хватит всем, а историй и гуляний — на всю ночь!</p>
        <p>Да будет пир наш богат, да будут речи наши теплы, а союз наш верен и нерушим, ибо клятва заключится на берегу Байкала!</p>
        <div className="signature">С любовью, <span>Павел и Виктория</span></div>
      </div>
    </div>
  </section>;
}

function CountdownSection() {
  return <section className="countdown-section">
    <div className="countdown-heading"><span className="eyebrow light">ДО НАШЕЙ ВСТРЕЧИ ОСТАЛОСЬ</span><div className="countdown-date">07 <span>·</span> 07 <span>·</span> 27</div></div>
    <Countdown />
    <span className="countdown-flower" aria-hidden="true">✳</span>
  </section>;
}

const moments = [
  { time: '13:00', title: 'Выезд на площадку', text: 'Начинаем путь к месту праздника.' },
  { time: '13:30', title: 'Трансфер для гостей', text: 'Садимся в автобус и едем вместе.' },
  { time: '14:00', title: 'Прибытие', text: 'Встречаемся у Байкала.' },
  { time: '14:30', title: 'Welcome-зона', text: 'Знакомимся, обнимаемся, настраиваемся на праздник.' },
  { time: '15:00', title: 'Церемония', text: 'Самое главное «да» этого дня.' },
  { time: '16:00', title: 'Начало программы', text: 'Празднуем, танцуем, поднимаем бокалы.' },
  { time: '21:00', title: 'Финал программы', text: 'Но вечер на этом не заканчивается.' },
  { time: '22:00', title: 'Финал музыки', text: 'Диджей завершает свою миссию.' },
];

function Details() {
  const latitude = '51.906710';
  const longitude = '104.805699';
  const mapUrl = `https://yandex.ru/maps/?ll=${longitude}%2C${latitude}&z=16&pt=${longitude}%2C${latitude}%2Cpm2rdm`;
  return <section className="section details-section" id="details">
    <div className="section-kicker"><span>02</span><span className="kicker-line"/><span>ГДЕ И КОГДА</span></div>
    <div className="details-heading"><h2>Сохраняйте<br /><em>эту дату</em></h2><p>Будем счастливы разделить этот день с вами — среди близких, у воды и под большим сибирским небом.</p></div>
    <div className="details-cards">
      <article className="detail-card"><span className="detail-icon"><Icon name="clock" size={23} /></span><p className="eyebrow">ДАТА И ВРЕМЯ</p><h3>7 июля 2027</h3><p>Начало в 14:00</p><a href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Свадьба+Павла+и+Виктории&dates=20270707T060000Z/20270707T130000Z&details=Ждём+вас+на+берегу+Байкала" target="_blank" rel="noreferrer">Добавить в календарь <Icon name="arrow" size={15} /></a></article>
      <article className="detail-card"><span className="detail-icon"><Icon name="pin" size={23} /></span><p className="eyebrow">МЕСТО ВСТРЕЧИ</p><h3>У берега Байкала</h3><p>Прибрежная ул., 5А<br />Ангарские Хутора · 60 км от Иркутска</p><a href={mapUrl} target="_blank" rel="noreferrer">Открыть карту <Icon name="arrow" size={15} /></a></article>
      <article className="detail-card"><span className="detail-icon">✳</span><p className="eyebrow">ДРЕСС-КОД</p><h3>Сибирский шик</h3><p>Элементы национальных костюмов стратегически необходимы! Будем рады деталям с характером.</p><a href="#rsvp">Рассказать о планах <Icon name="arrow" size={15} /></a></article>
    </div>
    <div className="transport-note"><span className="transport-icon"><Icon name="bus" size={22} /></span><p><strong>О трансфере.</strong> Гостей ждёт автобус в 13:30. Отправление и точку сбора сообщим ближе к дате — отметьте в анкете, если вам понадобится место.</p></div>
  </section>;
}

function Schedule() {
  return <section className="schedule-section" id="schedule">
    <div className="section schedule-inner">
      <div className="section-kicker"><span>03</span><span className="kicker-line"/><span>ПЛАН НАШЕГО ДНЯ</span></div>
      <div className="schedule-heading"><h2>День, который<br /><em>запомним</em></h2><p>Не опаздывайте — приключения начнутся по расписанию.</p></div>
      <div className="timeline">{moments.map((moment, index) => <article className="timeline-item" key={moment.time}>
        <div className="timeline-time">{moment.time}</div><div className="timeline-dot" aria-hidden="true">{index === 4 ? <Icon name="heart" size={14} /> : null}</div><div className="timeline-copy"><h3>{moment.title}</h3><p>{moment.text}</p></div>
      </article>)}</div>
    </div>
  </section>;
}

const galleryPhotos = [
  ['10.jpg', 'свободный дух'],
  ['11.jpg', 'наша команда'],
  ['12.jpg', 'куда глаза глядят'],
  ['13.jpg', 'и дальше — вместе'],
  ['14.jpg', 'новые воспоминания'],
  ['15.jpg', 'наши мгновения'],
  ['16.jpg', 'рядом'],
  ['17.jpg', 'вместе'],
];

function Gallery() {
  return <section className="section gallery-section">
    <div className="section-kicker"><span>04</span><span className="kicker-line"/><span>МАЛЕНЬКИЕ МОМЕНТЫ</span></div>
    <div className="gallery-heading"><h2>И это только<br /><em>начало</em></h2><p>Берём с собой лучшие воспоминания — и делаем новые.</p></div>
    <div className="photo-grid">
      {galleryPhotos.map(([filename, caption], index) => <figure className={`photo${filename === '14.jpg' ? ' photo-crop-left' : ''}`} key={filename}>
        <img src={`./photos/${filename}`} alt={`Момент из истории Павла и Виктории, фото ${index + 1}`} loading="lazy" />
        <figcaption>{caption}</figcaption>
      </figure>)}
    </div>
  </section>;
}

function Gifts() {
  if (!GIFT_REGISTRY_URL) return null;
  return <section className="gift-section"><div className="gift-inner"><span className="gift-icon"><Icon name="heart" size={22} /></span><div><p className="eyebrow">ПОЖЕЛАНИЯ И ПОДАРКИ</p><h2>Самое ценное — вы рядом</h2><p>Если захотите порадовать нас подарком, мы собрали пожелания по ссылке.</p></div><a className="button button-dark" href={GIFT_REGISTRY_URL} target="_blank" rel="noreferrer">Открыть реестр <Icon name="arrow" size={18} /></a></div></section>;
}

function RSVP() {
  const [status, setStatus] = useState('attending');
  const [guestCount, setGuestCount] = useState('1');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const pendingRequest = useRef(null);
  const inFlight = useRef(false);
  async function handleSubmit(event) {
    event.preventDefault();
    if (inFlight.current || !RSVP_READY) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const entry = {
      name: String(data.get('name')).trim(),
      attendance: String(data.get('attendance')),
      guests: status === 'attending' ? String(data.get('guests') || '1') : '0',
      food: String(data.get('food') || '').trim(),
      transfer: data.get('transfer') === 'on',
      comment: String(data.get('comment') || '').trim(),
    };
    if (!entry.name) return setError('Пожалуйста, укажите имя и фамилию.');
    const fingerprint = JSON.stringify(entry);
    if (pendingRequest.current?.fingerprint !== fingerprint) {
      pendingRequest.current = { fingerprint, id: crypto.randomUUID() };
    }
    const payload = { ...entry, id: pendingRequest.current.id };
    inFlight.current = true;
    setSubmitting(true);
    setError('');
    try {
      if (DEMO_MODE) {
        const responses = JSON.parse(localStorage.getItem(RSVP_KEY) || '[]');
        localStorage.setItem(RSVP_KEY, JSON.stringify([{ ...payload, submittedAt: new Date().toISOString() }, ...responses]));
      } else {
        await sendRsvp(RSVP_ENDPOINT, payload);
      }
      pendingRequest.current = null;
      setError('');
      setSubmitted(true);
      form.reset();
      setStatus('attending');
      setGuestCount('1');
    } catch {
      setError(DEMO_MODE ? 'Не удалось сохранить демо-ответ в браузере.' : 'Не удалось подтвердить сохранение. Проверьте подключение и повторите отправку, не меняя данные — повтор не создаст дубликат. Можно также связаться с Татьяной.');
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }
  return <section className="rsvp-section" id="rsvp">
    <div className="rsvp-decoration" aria-hidden="true">✳</div>
    <div className="rsvp-inner">
      <div className="section-kicker light"><span>05</span><span className="kicker-line"/><span>ВАШ ОТВЕТ</span></div>
      <div className="rsvp-grid">
        <div className="rsvp-intro"><p className="eyebrow light">БУДЕМ ЖДАТЬ ВЕСТОЧКУ ДО 30 АПРЕЛЯ 2027</p><h2>Вы с нами?</h2><p>Пожалуйста, ответьте до 30 апреля 2027 года, даже если не сможете прийти. Нам важно знать и спланировать праздник для каждого.</p><div className="contact-card"><span>Остались вопросы?</span><a href="tel:+79954950046">Татьяна · +7 995 495-00-46</a></div></div>
        <div className="rsvp-form-wrap">{submitted ? <div className="success-message" role="status"><span className="success-heart"><Icon name="heart" size={30} /></span><h3>Спасибо за ответ!</h3><p>{DEMO_MODE ? 'Демо-ответ сохранён только в этом браузере.' : 'Ваш ответ записан в таблицу организаторов. Спасибо!'}</p><button className="text-button" onClick={() => setSubmitted(false)}>Отправить ещё один ответ</button></div> : <form className="rsvp-form" onSubmit={handleSubmit} aria-busy={submitting}>
          {!RSVP_READY && <p className="form-error" role="status">Анкета на сайте пока подключается. <a href={GOOGLE_FORM_URL} target="_blank" rel="noreferrer">Ответить через Google Форму</a> или свяжитесь с Татьяной.</p>}
          <fieldset className="rsvp-inputs" disabled={submitting || !RSVP_READY}>
          <label className="field-label" htmlFor="guest-name">Ваше имя и фамилия <span>*</span></label>
          <input id="guest-name" name="name" type="text" autoComplete="name" placeholder="Например, Анна Иванова" required maxLength="100" />
          <fieldset className="attendance-field"><legend>Сможете прийти? <span>*</span></legend><div className="radio-options">
            <label className={status === 'attending' ? 'radio-card selected' : 'radio-card'}><input type="radio" name="attendance" value="attending" checked={status === 'attending'} onChange={() => setStatus('attending')} required /><span className="radio-mark"/>С радостью буду!</label>
            <label className={status === 'declined' ? 'radio-card selected' : 'radio-card'}><input type="radio" name="attendance" value="declined" checked={status === 'declined'} onChange={() => setStatus('declined')} /><span className="radio-mark"/>К сожалению, нет</label>
          </div></fieldset>
          {status === 'attending' && <>
            <fieldset className="guest-count-field"><legend>Сколько вас будет?</legend><div className="guest-count-options">{[1, 2, 3, 4, 5].map((num) => <label className="guest-count-option" key={num}><input type="radio" name="guests" value={num} checked={guestCount === String(num)} onChange={() => setGuestCount(String(num))} /><span>{num}</span></label>)}</div></fieldset>
            <label className="field-label" htmlFor="food">Пожелания по еде / аллергии</label><input id="food" name="food" type="text" placeholder="Если есть — напишите" maxLength="300" />
            <label className="checkbox-line"><input type="checkbox" name="transfer" /><span className="checkbox-ui"/>Нужен трансфер из Иркутска</label>
          </>}
          <label className="field-label" htmlFor="comment">Комментарий <span className="optional">необязательно</span></label><textarea id="comment" name="comment" rows="3" placeholder="Что ещё нам важно знать?" maxLength="500" />
          </fieldset>
          <button className="button button-gold" type="submit" disabled={submitting || !RSVP_READY}>{submitting ? 'Отправляем…' : 'Отправить ответ'} {!submitting && <Icon name="arrow" size={18} />}</button>
          {error && <p className="form-error" role="alert">{error}</p>}
          <p className="privacy-note">{DEMO_MODE ? 'Демо-режим: ответ сохранится только в этом браузере.' : 'Ответ получат организаторы в Google Таблице. Вход в Google не нужен.'}</p>
        </form>}</div>
      </div>
    </div>
  </section>;
}

function Footer() {
  return <footer className="site-footer"><a className="monogram footer-monogram" href="#top">П<span>&</span>В</a><p>До встречи на берегу Байкала</p>{import.meta.env.DEV && <a className="admin-link" href="./admin.html">Для организаторов</a>}<span className="footer-date">07 · 07 · 2027</span></footer>;
}

function App() {
  return <><Header /><main><Hero /><Story /><CountdownSection /><Details /><Schedule /><Gallery /><Gifts /><RSVP /></main><Footer /></>;
}

createRoot(document.getElementById('root')).render(<App />);
