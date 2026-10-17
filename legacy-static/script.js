// NOA — shared client behavior

// Cursor follower (hidden on touch)
const isTouch = window.matchMedia('(hover:none)').matches;
if (!isTouch) {
  const c = document.getElementById('cur'), r = document.getElementById('cur2');
  if (c && r) {
    let mx = 0, my = 0, rx = 0, ry = 0;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      c.style.left = mx + 'px'; c.style.top = my + 'px';
    });
    (function loop() {
      rx += (mx - rx) * 0.1; ry += (my - ry) * 0.1;
      r.style.left = rx + 'px'; r.style.top = ry + 'px';
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a,button,.s-arrow,.evt,.split-cell,.pkg,.rest-img,.faq-q,.gal-cell,.event-row,.tariff-card').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('hl'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('hl'));
    });
  }
}

// Sticky nav on scroll
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => nav.classList.toggle('stuck', scrollY > 40), { passive: true });
}

// Mobile menu
function openMenu() {
  const m = document.getElementById('mobmenu');
  if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
}
function closeMenu() {
  const m = document.getElementById('mobmenu');
  if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
}

// Reveal-on-scroll
const obs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('on'); });
}, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.rv').forEach(el => obs.observe(el));

// FAQ accordion
function faqToggle(el) {
  const item = el.closest('.faq-item');
  const wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
  if (!wasOpen) item.classList.add('open');
}

// Smooth scroll for in-page anchors
function goto(sel) {
  const t = document.querySelector(sel);
  if (t) t.scrollIntoView({ behavior: 'smooth' });
}
document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const href = a.getAttribute('href');
  if (href === '#') return;
  const t = document.querySelector(href);
  if (t) { e.preventDefault(); closeMenu(); t.scrollIntoView({ behavior: 'smooth' }); }
}));
