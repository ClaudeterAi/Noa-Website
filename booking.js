/* NOA — Booking flow logic
   Steps: 1 calendar  →  2 floor plan  →  3 review & pay
   Modals: day picker, seat detail
*/

(function(){

// ---- Data ------------------------------------------------------------
const MONTH_NAMES = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
const DAY_NAMES_FULL = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
const DAY_LABEL = { 0:'NOA SUNDAYS', 1:'NOA MONDAYS', 2:'NOA TUESDAYS', 3:'NOA WEDNESDAYS', 4:'NOA THURSDAYS', 5:'NOA FRIDAYS', 6:'NOA SATURDAYS' };
// Stock images per weekday — Unsplash, all free
const DAY_IMG = {
  0: 'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=400&q=80', // pool/swim
  1: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80', // bw woman beach
  2: 'https://images.unsplash.com/photo-1520637836862-4d197d17c97a?w=400&q=80', // boat aerial
  3: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=400&q=80', // pool lounger
  4: 'https://images.unsplash.com/photo-1519181245277-cffeb31da2e3?w=400&q=80', // hat beach
  5: 'https://images.unsplash.com/photo-1571266028243-d220bc1b3e29?w=400&q=80', // DJ
  6: 'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=400&q=80',   // drink
};
const TODAY = new Date(2026, 4, 11); // May 11 2026 — clamp past days

// Seat catalogue (NOA, AED)
// price = afternoon price; mPrice = morning price. capacity per booking unit.
const SEATS = {
  'cabana-1':         { type:'Cabana',           cls:'cabana',        pax:8, price:8500,  mPrice:6500, img:'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=900&q=80', desc:'Private cabana with daybed, dining table, dedicated host and shade. Premium positioning on the upper deck.' },
  'cabana-2':         { type:'Cabana',           cls:'cabana',        pax:8, price:8500,  mPrice:6500, img:'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=900&q=80', desc:'Private cabana with daybed, dining table, dedicated host and shade.' },
  'cabana-3':         { type:'Cabana',           cls:'cabana',        pax:8, price:8500,  mPrice:6500, img:'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=900&q=80', desc:'Private cabana with daybed, dining table, dedicated host and shade.' },
  'front-cabana-1':   { type:'Front Cabana',     cls:'front-cabana',  pax:8, price:12000, mPrice:9000, img:'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=900&q=80', desc:'Front-row cabana facing the open Gulf. The most secluded position on the deck.' },
  'lower-cabana-1':   { type:'Cabana',           cls:'cabana',        pax:8, price:8500,  mPrice:6500, img:'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=900&q=80', desc:'Lower-deck cabana, pool-adjacent, shaded.' },
  'lower-cabana-2':   { type:'Cabana',           cls:'cabana',        pax:8, price:8500,  mPrice:6500, img:'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=900&q=80', desc:'Lower-deck cabana, pool-adjacent, shaded.' },
  'lower-cabana-3':   { type:'Cabana',           cls:'cabana',        pax:8, price:8500,  mPrice:6500, img:'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=900&q=80', desc:'Lower-deck cabana, pool-adjacent, shaded.' },
  'lower-cabana-vip': { type:'Front Cabana',     cls:'front-cabana',  pax:8, price:12000, mPrice:9000, img:'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=900&q=80', desc:'Lower-deck VIP cabana — closest to the bow waterline.' },
  // Pool daybeds — top row
  'daybed-t-1': { type:'Pool Daybed', cls:'daybed', pax:2, price:2200, mPrice:1600, img:'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80', desc:'Reserved poolside daybed with parasol, side table and drinks service.' },
  'daybed-t-2': { type:'Pool Daybed', cls:'daybed', pax:2, price:2200, mPrice:1600, img:'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80', desc:'Reserved poolside daybed with parasol, side table and drinks service.' },
  'daybed-t-3': { type:'Pool Daybed', cls:'daybed', pax:2, price:2200, mPrice:1600, img:'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80', desc:'Reserved poolside daybed with parasol, side table and drinks service.' },
  'daybed-t-4': { type:'Pool Daybed', cls:'daybed', pax:2, price:2200, mPrice:1600, img:'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80', desc:'Reserved poolside daybed with parasol, side table and drinks service.' },
  'daybed-t-5': { type:'Pool Daybed', cls:'daybed', pax:2, price:2200, mPrice:1600, img:'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80', desc:'Reserved poolside daybed with parasol, side table and drinks service.' },
  'daybed-t-6': { type:'Pool Daybed', cls:'daybed', pax:2, price:2200, mPrice:1600, img:'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80', desc:'Reserved poolside daybed with parasol, side table and drinks service.' },
  // Pool daybeds — bottom row (front-row, west-facing, more expensive)
  'daybed-b-1': { type:'Front-Row Daybed', cls:'front-daybed', pax:2, price:3400, mPrice:2400, img:'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=900&q=80', desc:'Front-row daybed at the pool\'s outer edge — directly above the Gulf, west-facing for sunset.' },
  'daybed-b-2': { type:'Front-Row Daybed', cls:'front-daybed', pax:2, price:3400, mPrice:2400, img:'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=900&q=80', desc:'Front-row daybed at the pool\'s outer edge.' },
  'daybed-b-3': { type:'Front-Row Daybed', cls:'front-daybed', pax:2, price:3400, mPrice:2400, img:'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=900&q=80', desc:'Front-row daybed at the pool\'s outer edge.' },
  'daybed-b-4': { type:'Front-Row Daybed', cls:'front-daybed', pax:2, price:3400, mPrice:2400, img:'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=900&q=80', desc:'Front-row daybed at the pool\'s outer edge.' },
  'daybed-b-5': { type:'Front-Row Daybed', cls:'front-daybed', pax:2, price:3400, mPrice:2400, img:'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=900&q=80', desc:'Front-row daybed at the pool\'s outer edge.' },
  'daybed-b-6': { type:'Front-Row Daybed', cls:'front-daybed', pax:2, price:3400, mPrice:2400, img:'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=900&q=80', desc:'Front-row daybed at the pool\'s outer edge.' },
  // Balcony sofas — right side
  'balcony-1': { type:'Balcony Sofa', cls:'balcony-sofa', pax:6, price:6500, mPrice:4500, img:'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80', desc:'Spacious balcony sofa with a front-row view of the pool and the open Gulf. Includes AED 4,000 F&B credit.' },
  'balcony-2': { type:'Balcony Sofa', cls:'balcony-sofa', pax:6, price:6500, mPrice:4500, img:'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80', desc:'Spacious balcony sofa with a front-row view. Includes AED 4,000 F&B credit.' },
  'balcony-3': { type:'Balcony Sofa', cls:'balcony-sofa', pax:6, price:6500, mPrice:4500, img:'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80', desc:'Spacious balcony sofa with a front-row view. Includes AED 4,000 F&B credit.' },
  'balcony-4': { type:'Balcony Sofa', cls:'balcony-sofa', pax:6, price:6500, mPrice:4500, img:'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80', desc:'Spacious balcony sofa with a front-row view. Includes AED 4,000 F&B credit.' },
  'balcony-5': { type:'Balcony Sofa', cls:'balcony-sofa', pax:6, price:6500, mPrice:4500, img:'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80', desc:'Spacious balcony sofa with a front-row view. Includes AED 4,000 F&B credit.' },
  // DJ Lounge — bow stern area
  'dj-lounge-1': { type:'DJ Lounge', cls:'dj-lounge', pax:4, price:5500, mPrice:3800, img:'https://images.unsplash.com/photo-1571266028243-d220bc1b3e29?w=900&q=80', desc:'Lounge seating directly facing the DJ booth at the bow. Includes AED 2,500 F&B credit.' },
  'dj-lounge-2': { type:'DJ Lounge', cls:'dj-lounge', pax:4, price:5500, mPrice:3800, img:'https://images.unsplash.com/photo-1571266028243-d220bc1b3e29?w=900&q=80', desc:'Lounge seating directly facing the DJ booth at the bow.' },
  // General entry zone (central tables, standing)
  'entry-1': { type:'General Entry', cls:'entry', pax:1, price:900, mPrice:650, img:'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=900&q=80', desc:'Standing entry — full pool, deck and DJ access. Restaurant seating subject to availability.' },
  'entry-2': { type:'General Entry', cls:'entry', pax:1, price:900, mPrice:650, img:'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=900&q=80', desc:'Standing entry — full pool, deck and DJ access.' },
  'entry-3': { type:'General Entry', cls:'entry', pax:1, price:900, mPrice:650, img:'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=900&q=80', desc:'Standing entry — full pool, deck and DJ access.' },
  'entry-4': { type:'General Entry', cls:'entry', pax:1, price:900, mPrice:650, img:'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=900&q=80', desc:'Standing entry — full pool, deck and DJ access.' },
  'entry-5': { type:'General Entry', cls:'entry', pax:1, price:900, mPrice:650, img:'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=900&q=80', desc:'Standing entry — full pool, deck and DJ access.' },
  'entry-6': { type:'General Entry', cls:'entry', pax:1, price:900, mPrice:650, img:'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=900&q=80', desc:'Standing entry — full pool, deck and DJ access.' },
  'entry-7': { type:'General Entry', cls:'entry', pax:1, price:900, mPrice:650, img:'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=900&q=80', desc:'Standing entry — full pool, deck and DJ access.' },
  'entry-8': { type:'General Entry', cls:'entry', pax:1, price:900, mPrice:650, img:'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=900&q=80', desc:'Standing entry — full pool, deck and DJ access.' },
  'entry-9': { type:'General Entry', cls:'entry', pax:1, price:900, mPrice:650, img:'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=900&q=80', desc:'Standing entry — full pool, deck and DJ access.' },
  'entry-10': { type:'General Entry', cls:'entry', pax:1, price:900, mPrice:650, img:'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=900&q=80', desc:'Standing entry — full pool, deck and DJ access.' },
  'entry-11': { type:'General Entry', cls:'entry', pax:1, price:900, mPrice:650, img:'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=900&q=80', desc:'Standing entry — full pool, deck and DJ access.' },
  'entry-12': { type:'General Entry', cls:'entry', pax:1, price:900, mPrice:650, img:'https://images.unsplash.com/photo-1551918120-9739cb430c6d?w=900&q=80', desc:'Standing entry — full pool, deck and DJ access.' },
};

// Headliner Friday events
const HEADLINERS = {
  '2026-03-06': { name:'Claptone',  img:'https://images.unsplash.com/photo-1571266028243-d220bc1b3e29?w=900&q=80' },
  '2026-03-13': { name:'Peggy Gou', img:'https://images.unsplash.com/photo-1571266028243-d220bc1b3e29?w=900&q=80' },
  '2026-03-20': { name:'Black Coffee', img:'https://images.unsplash.com/photo-1571266028243-d220bc1b3e29?w=900&q=80' },
};

// ---- State -----------------------------------------------------------
let viewMonth = TODAY.getMonth();
let viewYear  = TODAY.getFullYear();
let chosenDate = null;     // Date object
let chosenSlot = null;     // 'morning' | 'afternoon'
let chosenSeat = null;     // seat id
let chosenGuests = null;   // number
let chosenArrival = null;  // time string
const taken = new Set();   // pretend-taken seats (random per date)
let cart = JSON.parse(sessionStorage.getItem('noa-cart') || '[]');

// ---- DOM -------------------------------------------------------------
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// ---- Calendar render -------------------------------------------------
function renderCalendar(){
  const monthLabel = $('#bkMonthLabel');
  if (monthLabel) monthLabel.textContent = MONTH_NAMES[viewMonth] + ' ' + viewYear;

  // Disable prev if at/before current month
  const prevBtn = $('#bkPrevMonth');
  if (prevBtn) {
    const isPast = (viewYear < TODAY.getFullYear()) ||
                   (viewYear === TODAY.getFullYear() && viewMonth <= TODAY.getMonth());
    prevBtn.disabled = isPast;
  }

  const cal = $('#bkCal');
  cal.innerHTML = '';
  // First day of month — JS uses 0=Sun, we want Mon-first
  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const offset = (firstDay + 6) % 7; // shift so Mon=0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  for (let i = 0; i < offset; i++) {
    const e = document.createElement('div');
    e.className = 'bk-day empty';
    cal.appendChild(e);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(viewYear, viewMonth, d);
    const dow = date.getDay();
    const iso = isoDate(date);
    const headliner = HEADLINERS[iso];
    const isPast = date < new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate());

    const cell = document.createElement('div');
    cell.className = 'bk-day' + (isPast ? ' disabled' : '');
    cell.dataset.iso = iso;
    cell.dataset.dow = String(dow);
    cell.innerHTML = `
      <div class="bk-day-n">${String(d).padStart(2,'0')}</div>
      <div class="bk-day-ev" style="background-image:url('${headliner ? headliner.img : DAY_IMG[dow]}')"></div>
      <div class="bk-day-ev-label">${headliner ? headliner.name.toUpperCase() : DAY_LABEL[dow]}</div>
    `;
    if (!isPast) {
      cell.addEventListener('click', () => openDayModal(date));
    }
    cal.appendChild(cell);
  }
}

function isoDate(d){
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}
function prettyDate(d){
  return DAY_NAMES_FULL[d.getDay()] + ', ' + String(d.getDate()).padStart(2,'0') + ' ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear();
}
function prettyDateShort(d){
  return DAY_NAMES_FULL[d.getDay()].slice(0,3) + ' ' + String(d.getDate()).padStart(2,'0') + ' ' + MONTH_NAMES[d.getMonth()].slice(0,3) + ' ' + d.getFullYear();
}

// ---- Day modal -------------------------------------------------------
function openDayModal(date){
  chosenDate = date;
  chosenSlot = null;
  const iso = isoDate(date);
  const headliner = HEADLINERS[iso];
  const eventName = headliner ? headliner.name : DAY_LABEL[date.getDay()];
  const img = headliner ? headliner.img : DAY_IMG[date.getDay()];

  $('#dayModalImg').style.backgroundImage = `url('${img}')`;
  $('#dayModalDate').textContent = prettyDate(date).toUpperCase();
  $('#dayModalEvent').textContent = eventName.toUpperCase();

  // Reset time buttons
  $$('.bk-time').forEach(b => b.classList.remove('selected'));
  // Morning slot sold out on weekends (just to demo)
  const morningSoldOut = (date.getDay() === 0); // Sundays morning sold out (example)
  const morningBtn = $('[data-time="morning"]');
  morningBtn.classList.toggle('sold-out', morningSoldOut);
  morningBtn.disabled = morningSoldOut;

  // Disable CTA until a time is picked
  $('#dayModalCta').disabled = true;

  $('#dayModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeDayModal(){
  $('#dayModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ---- Floor plan / Step 2 ---------------------------------------------
function goStep2(){
  if (!chosenDate || !chosenSlot) return;
  // Randomise a few "taken" seats for this date
  taken.clear();
  const seatIds = Object.keys(SEATS);
  const seed = chosenDate.getDate() + chosenDate.getMonth()*31;
  // deterministic-ish: every n-th seat taken
  seatIds.forEach((id, i) => { if ((i * 7 + seed) % 11 < 2) taken.add(id); });
  paintTakenSeats();

  // Header
  $('#bkFloorDate').textContent = prettyDateShort(chosenDate).toUpperCase();
  $('#bkFloorSlot').textContent = chosenSlot === 'morning' ? 'MORNING · 9:30AM–2PM' : 'AFTERNOON · 2PM–9:30PM';

  showStep(2);
}

function paintTakenSeats(){
  $$('#yachtMap .seat').forEach(s => {
    s.classList.toggle('taken', taken.has(s.dataset.seat));
  });
}

// ---- Seat hover + click ----------------------------------------------
function attachSeatHandlers(){
  const tt = $('#seatTooltip');
  $$('#yachtMap .seat').forEach(el => {
    const id = el.dataset.seat;
    const seat = SEATS[id];
    if (!seat) return;
    el.addEventListener('mousemove', e => {
      if (taken.has(id)) return;
      const price = chosenSlot === 'morning' ? seat.mPrice : seat.price;
      tt.innerHTML = `
        <div class="bk-tt-img" style="background-image:url('${seat.img}')"></div>
        <div class="bk-tt-row">
          <div class="bk-tt-name">${seat.type.toUpperCase()}</div>
          <div class="bk-tt-pax">${seat.pax} <span style="opacity:.55">👤</span></div>
          <div class="bk-tt-price">${price.toLocaleString()}</div>
        </div>
        <div class="bk-tt-btn">VIEW MORE</div>`;
      tt.classList.add('show');
      const x = Math.min(e.clientX + 18, window.innerWidth - 300);
      const y = Math.min(e.clientY + 18, window.innerHeight - 250);
      tt.style.left = x + 'px';
      tt.style.top  = y + 'px';
    });
    el.addEventListener('mouseleave', () => tt.classList.remove('show'));
    el.addEventListener('click', () => {
      if (taken.has(id)) return;
      tt.classList.remove('show');
      openSeatModal(id);
    });
  });
}

// ---- Seat modal ------------------------------------------------------
function openSeatModal(id){
  chosenSeat = id;
  const seat = SEATS[id];
  const price = chosenSlot === 'morning' ? seat.mPrice : seat.price;
  chosenGuests = seat.pax;
  chosenArrival = chosenSlot === 'morning' ? '09:30' : '14:00';

  $('#seatModalImg').src = seat.img;
  $('#seatModalName').textContent = seat.type;
  $('#seatModalSmallName').textContent = seat.type;
  $('#seatModalDesc').textContent = seat.desc;
  $('#seatModalDate').textContent = prettyDate(chosenDate).toUpperCase();
  $('#seatModalPkg').textContent = chosenSlot === 'morning' ? 'MORNING PACKAGE' : 'AFTERNOON PACKAGE';
  $('#seatModalTime').textContent = chosenSlot === 'morning' ? '9:30AM – 2PM' : '2PM – 9:30PM';
  $('#seatModalVibe').textContent = chosenSlot === 'morning' ? 'CHILL VIBE' : 'PARTY VIBE';
  $('#seatModalFB').textContent = seat.type === 'General Entry'
    ? 'No minimum spend'
    : `Includes AED ${(price/2).toLocaleString()} F&B Credit`;
  $('#seatModalPrice').textContent = 'AED ' + price.toLocaleString();
  $('#seatModalTotal').textContent = 'AED ' + price.toLocaleString();
  $('#seatModalTotalPax').textContent = seat.pax + ' guests';

  // Guest dropdown
  const gSel = $('#seatModalGuest');
  gSel.innerHTML = '';
  for (let i = 1; i <= seat.pax; i++) {
    const o = document.createElement('option');
    o.value = i; o.textContent = i;
    if (i === seat.pax) o.selected = true;
    gSel.appendChild(o);
  }

  // Arrival times based on slot
  const tSel = $('#seatModalArrival');
  tSel.innerHTML = '';
  const times = chosenSlot === 'morning'
    ? ['09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00']
    : ['14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','19:00','20:00'];
  times.forEach(t => {
    const o = document.createElement('option');
    o.value = t; o.textContent = t;
    tSel.appendChild(o);
  });

  $('#seatModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeSeatModal(){
  $('#seatModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ---- Cart -----------------------------------------------------------
function addToCart(){
  const seat = SEATS[chosenSeat];
  const price = chosenSlot === 'morning' ? seat.mPrice : seat.price;
  cart.push({
    id: Date.now(),
    seatId: chosenSeat,
    seatType: seat.type,
    img: seat.img,
    date: isoDate(chosenDate),
    dateLabel: prettyDateShort(chosenDate),
    slot: chosenSlot,
    pkg: chosenSlot === 'morning' ? 'MORNING' : 'AFTERNOON',
    guests: parseInt($('#seatModalGuest').value, 10),
    arrival: $('#seatModalArrival').value,
    price: price,
  });
  sessionStorage.setItem('noa-cart', JSON.stringify(cart));
  closeSeatModal();
  renderCart();
  showStep(3);
}

function renderCart(){
  const wrap = $('#bkCartItems');
  if (!cart.length) {
    wrap.innerHTML = '<div class="bk-cart-empty">Your cart is empty. Choose a date to start.</div>';
  } else {
    wrap.innerHTML = cart.map((c, i) => `
      <div class="bk-cart-item">
        <div class="bk-cart-img" style="background-image:url('${c.img}')"></div>
        <div>
          <div class="bk-cart-name">${c.seatType}</div>
          <div class="bk-cart-meta">${c.dateLabel} · ${c.pkg} · ${c.guests} GUEST${c.guests>1?'S':''} · ARRIVE ${c.arrival}</div>
        </div>
        <div style="text-align:right">
          <div class="bk-cart-price">AED ${c.price.toLocaleString()}</div>
          <a class="bk-cart-remove" data-i="${i}">Remove</a>
        </div>
      </div>`).join('');
    wrap.querySelectorAll('.bk-cart-remove').forEach(b => {
      b.addEventListener('click', () => {
        cart.splice(parseInt(b.dataset.i,10), 1);
        sessionStorage.setItem('noa-cart', JSON.stringify(cart));
        renderCart();
      });
    });
  }
  const subtotal = cart.reduce((s, c) => s + c.price, 0);
  const vat = Math.round(subtotal * 0.05);
  const total = subtotal + vat;
  $('#bkPaySubtotal').textContent = 'AED ' + subtotal.toLocaleString();
  $('#bkPayVat').textContent = 'AED ' + vat.toLocaleString();
  $('#bkPayTotal').textContent = 'AED ' + total.toLocaleString();
}

// ---- Step navigation -------------------------------------------------
function showStep(n){
  $$('.bk-step-section').forEach((el, i) => el.classList.toggle('active', i === n-1));
  $$('.bk-step-dot').forEach((d, i) => {
    d.classList.remove('active','done');
    if (i+1 === n) d.classList.add('active');
    else if (i+1 < n) d.classList.add('done');
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- Init ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  renderCalendar();
  attachSeatHandlers();
  renderCart();

  // Month nav
  $('#bkPrevMonth').addEventListener('click', () => {
    if (--viewMonth < 0) { viewMonth = 11; viewYear--; }
    renderCalendar();
  });
  $('#bkNextMonth').addEventListener('click', () => {
    if (++viewMonth > 11) { viewMonth = 0; viewYear++; }
    renderCalendar();
  });

  // Day modal
  $('#dayModalClose').addEventListener('click', closeDayModal);
  $('#dayModal').addEventListener('click', e => {
    if (e.target.id === 'dayModal') closeDayModal();
  });
  $$('.bk-time').forEach(b => {
    b.addEventListener('click', () => {
      if (b.classList.contains('sold-out')) return;
      $$('.bk-time').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      chosenSlot = b.dataset.time;
      $('#dayModalCta').disabled = false;
    });
  });
  $('#dayModalCta').addEventListener('click', () => { closeDayModal(); goStep2(); });

  // Seat modal
  $('#seatModalClose').addEventListener('click', closeSeatModal);
  $('#seatModal').addEventListener('click', e => {
    if (e.target.id === 'seatModal') closeSeatModal();
  });
  $('#seatModalGuest').addEventListener('change', () => {
    const seat = SEATS[chosenSeat];
    const price = chosenSlot === 'morning' ? seat.mPrice : seat.price;
    const g = parseInt($('#seatModalGuest').value, 10);
    // Per-person seats scale price; reservation seats hold flat price.
    const total = seat.type === 'General Entry' ? price * g : price;
    $('#seatModalTotal').textContent = 'AED ' + total.toLocaleString();
    $('#seatModalTotalPax').textContent = g + ' guest' + (g>1?'s':'');
  });
  $('#seatModalAddCart').addEventListener('click', addToCart);
  $('#seatModalAddon').addEventListener('click', () => {
    $('#seatModalAddon').classList.toggle('open');
    const arrow = $('#seatModalAddon span');
    if (arrow) arrow.textContent = $('#seatModalAddon').classList.contains('open') ? '⌃' : '⌄';
  });

  // Step nav buttons
  $('#bkBackToStep1').addEventListener('click', () => showStep(1));
  $('#bkGoToStep3').addEventListener('click', () => { if (cart.length) showStep(3); else alert('Pick a seat first.'); });
  $('#bkBackToStep2').addEventListener('click', () => showStep(2));

  // Pay form (mock)
  $('#bkPayForm').addEventListener('submit', e => {
    e.preventDefault();
    const ref = 'NOA-' + Date.now().toString(36).toUpperCase();
    cart = [];
    sessionStorage.removeItem('noa-cart');
    document.querySelector('.bk-review-wrap').innerHTML = `
      <div class="bk-confirm" style="grid-column:1/-1">
        <h2>Reservation confirmed.</h2>
        <p>A confirmation email has been sent. Your reference is <strong>${ref}</strong>. Pier check-in opens 30 minutes before your arrival time at Dubai Marina, Pier 7.</p>
        <a href="index.html" class="pkg-btn" style="background:#1a1a1a;color:#fff;display:inline-block;text-decoration:none;">Back to home</a>
      </div>`;
  });

  // Start at step 1
  showStep(cart.length ? 3 : 1);
});

})();
