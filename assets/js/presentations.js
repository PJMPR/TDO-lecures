const presentationPickers = [...document.querySelectorAll('.presentation-picker')];

presentationPickers.forEach((picker) => {
  picker.addEventListener('toggle', () => {
    if (picker.open) {
      presentationPickers.forEach((other) => {
        if (other !== picker) other.open = false;
      });
    }
  });
});

document.addEventListener('click', (event) => {
  presentationPickers.forEach((picker) => {
    if (!picker.contains(event.target)) picker.open = false;
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const openPicker = presentationPickers.find((picker) => picker.open);
  if (!openPicker) return;
  openPicker.open = false;
  openPicker.querySelector('summary').focus();
  event.preventDefault();
  event.stopImmediatePropagation();
});
