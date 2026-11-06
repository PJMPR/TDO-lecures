function token(className, value) {
  const span = document.createElement('span');
  span.className = className;
  span.textContent = value;
  return span;
}

function appendValue(fragment, value) {
  const commentAt = value.search(/\s#/);
  const content = commentAt >= 0 ? value.slice(0, commentAt) : value;
  const comment = commentAt >= 0 ? value.slice(commentAt) : '';
  const scalarClass = /^(?:true|false|null|~|-?\d+(?:\.\d+)?(?:m|Mi|Gi)?)$/i.test(content.trim())
    ? 'yaml-number'
    : 'yaml-value';

  const parts = content.split(/([\[\]{}])/);
  for (const part of parts) {
    if (!part) continue;
    fragment.append(token(/[\[\]{}]/.test(part) ? 'yaml-bracket' : scalarClass, part));
  }
  if (comment) fragment.append(token('yaml-comment', comment));
}

function highlightYamlLine(line) {
  const fragment = document.createDocumentFragment();
  if (/^\s*#/.test(line)) {
    fragment.append(token('yaml-comment', line));
    return fragment;
  }
  if (/^\s*(?:---|\.\.\.)\s*$/.test(line)) {
    fragment.append(token('yaml-marker', line));
    return fragment;
  }

  const pair = line.match(/^(\s*(?:-\s+)?)([^:#\[\]{},]+?)(:)(.*)$/);
  if (pair) {
    fragment.append(document.createTextNode(pair[1]));
    fragment.append(token('yaml-key', pair[2]));
    fragment.append(token('yaml-punctuation', pair[3]));
    appendValue(fragment, pair[4]);
    return fragment;
  }

  const item = line.match(/^(\s*-\s+)(.*)$/);
  if (item) {
    fragment.append(token('yaml-punctuation', item[1]));
    appendValue(fragment, item[2]);
    return fragment;
  }

  appendValue(fragment, line);
  return fragment;
}

for (const code of document.querySelectorAll('code.language-yaml:not(.shiki)')) {
  const source = code.textContent;
  const lines = source.split('\n');
  code.replaceChildren();
  lines.forEach((line, index) => {
    code.append(highlightYamlLine(line));
    if (index < lines.length - 1) code.append(document.createTextNode('\n'));
  });
  code.classList.add('yaml-highlighted');
}
