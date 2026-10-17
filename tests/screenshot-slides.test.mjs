import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { parse } from 'parse5';

const html = await readFile(new URL('../lectures/ci/index.html', import.meta.url), 'utf8');
const nodes = (node) => [node, ...(node.childNodes ?? []).flatMap(nodes)];
const attribute = (node, name) => node.attrs?.find((item) => item.name === name)?.value;
const hasClass = (node, name) => attribute(node, 'class')?.split(/\s+/).includes(name);
const text = (node) => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');
const all = nodes(parse(html));
const slides = all.filter((node) => node.tagName === 'section' && hasClass(node, 'slide'));
const hooks = all.filter((node) => attribute(node, 'data-screenshot') !== undefined);
const imageHooks = hooks.filter((node) => node.tagName === 'figure');
const groups = [
  ['pierwszy-run', ['hello-run']],
  ['setup-job', ['hello-setup']],
  ['ide-kolorowanie', ['ide-injections']],
  ['narzedzia-yaml', ['ide-autocomplete']],
  ['podstawowe-needs', ['jobs-needs-graph']],
  ['formularz-inputs', ['dispatch-inputs']],
  ['env-vars-secrets', ['settings-vars', 'settings-secrets']],
  ['annotations', ['pr-annotations']],
  ['job-summary', ['run-summary']],
  ['github-script-komentarz', ['api-pr-comment']],
  ['pliki-i-artefakty', ['component-artifact']],
  ['matrix-podstawy', ['matrix-graph']],
  ['cache-hit-miss', ['cache-hit']],
  ['status-a-check-run', ['status-check-types']],
  ['ruleset', ['ruleset-required']],
  ['required-zero-jeden', ['required-0-pending', 'required-1-pending', 'required-1-done']],
  ['required-dwa', ['required-2-pending', 'required-2-done', 'required-2-failure']],
  ['staly-required-gate', ['required-gate-graph']],
  ['latex-artefakt', ['latex-artifact']],
  ['latex-api-policy', ['latex-artifact-only']],
  ['latex-prerelease', ['latex-prerelease']],
  ['latex-release', ['latex-release']],
];

test('keeps all 27 unique hooks, with one linked PNG per evidence figure', () => {
  assert.equal(hooks.length, 27);
  assert.equal(new Set(hooks.map((node) => attribute(node, 'data-screenshot'))).size, 27);
  assert.deepEqual(imageHooks.map((node) => attribute(node, 'data-screenshot')), groups.flatMap(([, ids]) => ids));
  const ids = all.map((node) => attribute(node, 'id')).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length, 'HTML ids must remain unique');

  for (const figure of imageHooks) {
    const id = attribute(figure, 'data-screenshot');
    assert.equal(figure.tagName, 'figure', id);
    assert.ok(attribute(figure, 'data-screenshot-caption')?.trim(), id);
    const images = nodes(figure).filter((node) => node.tagName === 'img');
    assert.equal(images.length, 1, id);
    assert.equal(attribute(images[0], 'src'), `screenshots/${id}.png`, id);
    assert.ok(attribute(images[0], 'alt')?.trim(), id);
    assert.equal(images[0].parentNode.tagName, 'a', id);
    const links = nodes(figure).filter((node) => node.tagName === 'a');
    assert.equal(links.length, 2, id);
    for (const link of links) {
      assert.equal(attribute(link, 'href'), `screenshots/${id}.png`, id);
      assert.equal(attribute(link, 'target'), '_blank', id);
      assert.ok(attribute(link, 'rel')?.split(/\s+/).includes('noopener'), id);
    }
    const caption = nodes(figure).find((node) => node.tagName === 'figcaption');
    assert.match(text(caption), /Otwórz pełny rozmiar/, id);
  }
  assert.equal(all.filter((node) => node.tagName === 'img'
    && attribute(node, 'src')?.startsWith('screenshots/')).length, 27);
});

test('inserts evidence immediately after its explanation, in hook order and the same section', () => {
  for (const [sourceId, ids] of groups) {
    const sourceIndex = slides.findIndex((slide) => attribute(slide, 'id') === sourceId);
    assert.notEqual(sourceIndex, -1, sourceId);
    ids.forEach((id, offset) => {
      const slide = slides[sourceIndex + offset + 1];
      assert.equal(attribute(slide, 'id'), `screenshot-${id}`, id);
      assert.ok(hasClass(slide, 'screenshot-slide'), id);
      assert.ok(attribute(slide, 'data-title')?.trim(), id);
      assert.equal(attribute(slide, 'data-section'), attribute(slides[sourceIndex], 'data-section'), id);
      assert.equal(nodes(slide).filter((node) => attribute(node, 'data-screenshot') !== undefined).length, 1, id);
      assert.equal(attribute(slide, 'data-section-start'), undefined, id);
    });
  }
  const starts = slides.filter((slide) => attribute(slide, 'data-section-start') !== undefined);
  const links = all.filter((node) => attribute(node, 'data-section-link') !== undefined);
  assert.equal(starts.length, 16);
  assert.deepEqual(links.map((node) => attribute(node, 'data-section-link')),
    starts.map((slide) => attribute(slide, 'data-section')));
});

test('keeps the comparison rows and describes the pending two-run observation as ruleset evidence', () => {
  for (const sourceId of ['required-zero-jeden', 'required-dwa']) {
    const slide = slides.find((node) => attribute(node, 'id') === sourceId);
    const body = nodes(slide).find((node) => node.tagName === 'tbody');
    const rows = nodes(body).filter((node) => node.tagName === 'tr');
    assert.equal(rows.length, 3);
    assert.equal(nodes(body).filter((node) => attribute(node, 'data-screenshot') !== undefined).length, 0);
  }
  for (const id of ['required-1-pending', 'required-2-pending']) {
    const pending = hooks.find((node) => attribute(node, 'data-screenshot') === id);
    assert.equal(attribute(pending, 'data-observed-policy'), 'ruleset', id);
    assert.equal(attribute(pending, 'data-observed-merge-state'), 'BLOCKED', id);
    assert.doesNotMatch(attribute(pending, 'data-screenshot-caption'), /w przygotowaniu|klasyczn/, id);
  }
});

test('uses the supplied real IDE images instead of manual placeholders', async () => {
  const ide = hooks.filter((node) => attribute(node, 'data-screenshot-source') === 'ide');
  assert.deepEqual(ide.map((node) => attribute(node, 'data-screenshot')), ['ide-injections', 'ide-autocomplete']);
  assert.equal(hooks.filter((node) => attribute(node, 'data-screenshot-source') === 'browser').length, 25);
  for (const frame of ide) {
    assert.equal(frame.tagName, 'figure');
    const image = nodes(frame).find((node) => node.tagName === 'img');
    const content = await readFile(new URL(`../lectures/ci/${attribute(image, 'src')}`, import.meta.url));
    assert.equal(content.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  }
  assert.match(attribute(ide[1], 'data-screenshot-caption'), /actions\/github-script/);
  assert.doesNotMatch(html, /manual-ide|Ręczny kadr z IDE do uzupełnienia/);
});
