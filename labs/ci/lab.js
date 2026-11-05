(() => {
  const contents = document.querySelector('[data-lab-toc]');
  if (contents) {
    const desktop = window.matchMedia('(min-width: 801px)');
    const synchronize = () => { contents.open = desktop.matches; };
    synchronize();
    desktop.addEventListener('change', synchronize);
  }

  const copyIcon = '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M8 7V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2v2a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3h3Zm2 0h4a3 3 0 0 1 3 3v4h2V5h-9v2Zm4 2H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1Z"/></svg>';

  async function writeClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
      document.body.append(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
  }

  function showCopied(button, iconOnly = false) {
    const original = button.innerHTML;
    button.classList.add('copied');
    button.setAttribute('aria-label', 'Skopiowano');
    button.innerHTML = iconOnly ? '✓' : 'Skopiowano ✓';
    window.setTimeout(() => {
      button.classList.remove('copied');
      button.innerHTML = original;
      button.setAttribute('aria-label', iconOnly ? 'Kopiuj tę komendę' : 'Kopiuj cały blok');
    }, 1600);
  }

  function rawCode(code) {
    const clone = code.cloneNode(true);
    clone.querySelectorAll('.command-copy').forEach((button) => button.remove());
    return clone.textContent.replace(/\n$/, '');
  }

  const modal = document.createElement('dialog');
  modal.className = 'lab-modal';
  modal.setAttribute('aria-labelledby', 'lab-modal-title');
  modal.innerHTML = `
    <div class="lab-modal__frame">
      <header class="lab-modal__header">
        <div><div class="lab-modal__eyebrow">Powiększony podgląd</div><h3 id="lab-modal-title"></h3></div>
        <div class="lab-modal__actions"><button type="button" class="lab-modal__copy">Kopiuj</button><button type="button" class="lab-modal__close" aria-label="Zamknij">×</button></div>
      </header>
      <div class="lab-modal__content"></div>
    </div>`;
  document.body.append(modal);

  const modalTitle = modal.querySelector('#lab-modal-title');
  const modalContent = modal.querySelector('.lab-modal__content');
  const modalCopy = modal.querySelector('.lab-modal__copy');
  const modalClose = modal.querySelector('.lab-modal__close');
  let modalOpener = null;
  let modalText = '';

  function openModal(title, element, opener, copyText = '') {
    modalTitle.textContent = title;
    modalOpener = opener;
    modalText = copyText;
    modalCopy.hidden = !copyText;
    const clone = element.cloneNode(true);
    clone.querySelectorAll('.block-actions,.visual-action,.command-copy').forEach((control) => control.remove());
    clone.removeAttribute('tabindex');
    modalContent.replaceChildren(clone);
    modal.showModal();
    modalClose.focus();
  }

  function closeModal() {
    modal.close();
    modalOpener?.focus();
  }

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('cancel', (event) => { event.preventDefault(); closeModal(); });
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  modalCopy.addEventListener('click', async () => {
    await writeClipboard(modalText);
    showCopied(modalCopy);
  });

  document.querySelectorAll('.doc pre > code').forEach((code) => {
    const pre = code.parentElement;
    if (pre.closest('.lab-modal')) return;
    const languageClass = [...code.classList].find((name) => name.startsWith('language-')) || '';
    const language = languageClass.replace('language-', '').toLowerCase();
    const terminal = ['powershell', 'bash', 'shell', 'console'].includes(language);

    if (terminal) {
      const lines = code.innerHTML.split('\n');
      code.replaceChildren();
      lines.forEach((lineHtml, index) => {
        const line = document.createElement('span');
        line.className = 'command-line';
        line.innerHTML = lineHtml;
        const command = line.textContent.trim();
        if (command && !command.startsWith('#')) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'command-copy';
          button.innerHTML = copyIcon;
          button.title = 'Kopiuj tę komendę';
          button.setAttribute('aria-label', 'Kopiuj tę komendę');
          button.addEventListener('click', async () => {
            await writeClipboard(command);
            showCopied(button, true);
          });
          line.append(button);
        }
        code.append(line);
        if (index < lines.length - 1) code.append(document.createTextNode('\n'));
      });
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.append(pre);
    const actions = document.createElement('div');
    actions.className = 'block-actions';

    const enlarge = document.createElement('button');
    enlarge.type = 'button';
    enlarge.className = 'block-action';
    enlarge.textContent = '⛶ Powiększ';
    enlarge.setAttribute('aria-label', 'Powiększ ten blok');
    enlarge.addEventListener('click', () => openModal(terminal ? 'Polecenia terminala' : 'Kod konfiguracji', pre, enlarge, rawCode(code)));

    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'block-action';
    copy.innerHTML = `${copyIcon}<span>Kopiuj</span>`;
    copy.setAttribute('aria-label', 'Kopiuj cały blok');
    copy.addEventListener('click', async () => {
      await writeClipboard(rawCode(code));
      showCopied(copy);
    });
    actions.append(enlarge, copy);
    wrapper.append(actions);
  });

  document.querySelectorAll('.lab-diagram').forEach((diagram) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'visual-action';
    button.textContent = '⛶ Powiększ';
    button.setAttribute('aria-label', 'Powiększ diagram');
    button.addEventListener('click', () => {
      const title = diagram.querySelector('figcaption')?.textContent || 'Diagram';
      openModal(title, diagram, button);
    });
    diagram.append(button);
  });

  document.querySelectorAll('.doc img').forEach((image) => {
    if (image.closest('.lab-diagram,.visual-block')) return;
    const wrapper = document.createElement('figure');
    wrapper.className = 'visual-block';
    image.parentNode.insertBefore(wrapper, image);
    wrapper.append(image);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'visual-action';
    button.textContent = '⛶ Powiększ';
    button.setAttribute('aria-label', 'Powiększ obraz');
    button.addEventListener('click', () => openModal(image.alt || 'Obraz', wrapper, button));
    wrapper.append(button);
  });
})();
