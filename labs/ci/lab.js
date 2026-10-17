(() => {
  const contents = document.querySelector('[data-lab-toc]');
  if (!contents) return;

  const desktop = window.matchMedia('(min-width: 801px)');
  const synchronize = () => { contents.open = desktop.matches; };
  synchronize();
  desktop.addEventListener('change', synchronize);
})();
