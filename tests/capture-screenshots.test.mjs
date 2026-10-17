import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { capturePage, paddedScreenshotClip, privatePath, validateConfig } from '../scripts/capture-screenshots.mjs';

test('keeps browser state and private capture manifests outside the repository', () => {
  const repository = fileURLToPath(new URL('../', import.meta.url));
  for (const path of [repository, join(repository, 'assets/captures.json')]) {
    assert.throws(() => privatePath(path, 'capture manifest'), /outside the repository/);
  }
  const external = join(tmpdir(), 'tdo-private/captures.json');
  assert.equal(privatePath(external, 'capture manifest'), external);
});

const capture = () => ({
  id: 'hello-run',
  url: 'https://github.com/owner/repo/actions/runs/123',
  selector: 'main',
  expect: ['Powitanie'],
});

test('accepts explicit crops, visible assertions and safe interaction steps', () => {
  const config = { captures: [{
    ...capture(),
    actions: [{ type: 'expand', selector: 'button[aria-expanded]' }],
    mask: ['.secret-value'],
  }] };
  assert.equal(validateConfig(config), config);
});

test('rejects missing, duplicate and path-traversing capture identifiers', () => {
  for (const captures of [[], [{ ...capture(), id: '../profile' }], [capture(), capture()]]) {
    assert.throws(() => validateConfig({ captures }));
  }
});

test('requires real GitHub contexts and explicit evidence in each crop', () => {
  for (const invalid of [
    { url: 'https://example.com/' },
    { url: 'https://github.com.example.com/' },
    { selector: '' },
    { expect: [] },
    { expect: [42] },
    { actions: [{ type: 'evaluate', selector: 'main' }] },
    { actions: {} },
    { mask: [''] },
    { bounds: [] },
    { workflow: { repo: '-bad', runId: '123', rerun: true, status: 'in_progress' } },
    { workflow: { repo: 'owner/repo', runId: '123;bad', rerun: true, status: 'in_progress' } },
    { controls: [{ selector: 'button', enabled: 'false' }] },
  ]) {
    assert.throws(() => validateConfig({ captures: [{ ...capture(), ...invalid }] }));
  }
});

test('requests native dark mode and refuses to capture a light GitHub page', async () => {
  let emulated = false;
  const page = {
    async setViewportSize() {},
    async emulateMedia(options) {
      assert.deepEqual(options, { colorScheme: 'dark' });
      emulated = true;
    },
    async goto() {},
    url: () => capture().url,
    evaluate: async () => 'light',
  };
  await assert.rejects(capturePage(page, capture(), 'unused'), /GitHub is not using dark mode/);
  assert.equal(emulated, true);
});

test('keeps outer card decorations and margins inside a viewport-relative screenshot', () => {
  assert.deepEqual(paddedScreenshotClip(
    { x: 300, y: 200, width: 800, height: 136 },
    { top: 24, right: 24, bottom: 24, left: 88 },
    { width: 1600, height: 1200 },
  ), { x: 212, y: 176, width: 912, height: 184 });
});

test('refuses margins outside the viewport instead of silently clipping the screenshot', () => {
  assert.throws(() => paddedScreenshotClip(
    { x: 10, y: 20, width: 800, height: 900 },
    { top: 24, right: 24, bottom: 24, left: 88 },
    { width: 1000, height: 1000 },
  ), /larger viewport/);
});

test('validates per-capture viewport and margins without combining crop modes', () => {
  const padding = { top: 24, right: 24, bottom: 24, left: 88 };
  const viewport = { width: 1600, height: 1200 };
  assert.doesNotThrow(() => validateConfig({ captures: [{ ...capture(), padding, viewport }] }));
  for (const invalid of [
    { padding: { ...padding, left: -1 } },
    { padding: { ...padding, top: '24' } },
    { padding, bounds: ['h1'] },
    { viewport: { width: 0, height: 1200 } },
    { viewport: { width: 1600 } },
  ]) {
    assert.throws(() => validateConfig({ captures: [{ ...capture(), ...invalid }] }));
  }
});
