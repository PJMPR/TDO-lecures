(() => {
  const deck = document.querySelector('.ci-deck .deck');
  const slides = [...document.querySelectorAll('.ci-deck .slide')];
  const picker = document.querySelector('.section-picker');
  const label = document.querySelector('[data-current-section]');
  const position = document.querySelector('[data-section-position]');
  const previous = document.querySelector('[data-section-prev]');
  const next = document.querySelector('[data-section-next]');
  if (!deck || !slides.length || !picker || !label || !position || !previous || !next) return;

  const sections = slides.flatMap((slide, index) => slide.hasAttribute('data-section-start')
    ? [{ slide, index, key: slide.dataset.section, title: slide.dataset.sectionTitle }]
    : []);
  const links = [...picker.querySelectorAll('[data-section-link]')];
  if (!sections.length) return;

  for (const link of links) {
    const section = sections.find((item) => item.key === link.dataset.sectionLink);
    if (section) link.href = `#${section.index + 1}`;
    link.addEventListener('click', () => {
      picker.open = false;
      picker.querySelector('summary').focus();
    });
  }

  function setJump(link, section) {
    if (section) {
      link.href = `#${section.index + 1}`;
      link.removeAttribute('aria-disabled');
      link.removeAttribute('tabindex');
      link.title = section.title;
    } else {
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
      link.setAttribute('tabindex', '-1');
      link.removeAttribute('title');
    }
  }

  function sync() {
    const current = slides.findIndex((slide) => slide.classList.contains('active'));
    if (current < 0) return;
    const sectionIndex = sections.findLastIndex((section) => section.index <= current);
    if (sectionIndex < 0) return;
    const section = sections[sectionIndex];
    const end = sections[sectionIndex + 1]?.index ?? slides.length;
    label.textContent = `${String(sectionIndex + 1).padStart(2, '0')} · ${section.title}`;
    position.textContent = `Slajd ${current - section.index + 1} z ${end - section.index}`;
    for (const link of links) {
      if (link.dataset.sectionLink === section.key) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    setJump(previous, sections[sectionIndex - 1]);
    setJump(next, sections[sectionIndex + 1]);
  }

  // Shared navigation changes .active even when replaceState does not emit hashchange.
  new MutationObserver(sync).observe(deck, {
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  });
  sync();
})();
