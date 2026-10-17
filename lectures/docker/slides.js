const slides = [...document.querySelectorAll('.slide')];
const counter = document.querySelector('.slide-number');
const progress = document.querySelector('.progress span');
const previous = document.querySelector('[data-prev]');
const next = document.querySelector('[data-next]');

if (!slides.length || !counter || !progress || !previous || !next) {
  throw new Error('Nieprawidłowa struktura prezentacji.');
}

let current = 0;
function show(index, updateHash = true) {
  current = Math.max(0, Math.min(slides.length - 1, Number.isFinite(index) ? Math.trunc(index) : 0));
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === current);
    slide.setAttribute('aria-hidden', i === current ? 'false' : 'true');
  });
  counter.textContent = String(current + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
  progress.style.width = (((current + 1) / slides.length) * 100) + '%';
  document.title = (slides[current].dataset.title || 'Prezentacja') + ' · Technologie DevOps';
  if (updateHash) history.replaceState(null, '', '#' + (current + 1));
}

function move(delta) { show(current + delta); }
const interactive = 'a, button, input, select, textarea, summary, .presentation-picker, [contenteditable]';
const keyboardWidgets = 'input, select, textarea, summary, pre, [data-slide-scroll], .presentation-picker, [contenteditable]';
document.querySelectorAll('pre').forEach((block) => { block.tabIndex = 0; });

document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest?.(keyboardWidgets)) return;
  if (event.key === ' ' && event.target.closest?.('a, button')) return;
  if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key)) {
    event.preventDefault();
    move(1);
  } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) {
    event.preventDefault();
    move(-1);
  } else if (event.key === 'Home') {
    event.preventDefault();
    show(0);
  } else if (event.key === 'End') {
    event.preventDefault();
    show(slides.length - 1);
  } else if (event.key.toLowerCase() === 'f') {
    document.documentElement.requestFullscreen?.();
  }
});

previous.addEventListener('click', () => move(-1));
next.addEventListener('click', () => move(1));
window.addEventListener('hashchange', () => show(Number(location.hash.slice(1)) - 1, false));

let touchX = null;
document.addEventListener('touchstart', (event) => {
  touchX = event.target.closest?.('pre, [data-slide-scroll], ' + interactive) ? null : event.changedTouches[0].clientX;
}, { passive: true });
document.addEventListener('touchend', (event) => {
  if (touchX !== null && Math.abs(event.changedTouches[0].clientX - touchX) > 60) {
    move(event.changedTouches[0].clientX < touchX ? 1 : -1);
  }
  touchX = null;
}, { passive: true });
show(Number(location.hash.slice(1)) - 1, false);
