import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { parse } from 'yaml';
import { assertScreenshotContent } from '../scripts/build-site.mjs';

test('accepts a materialized PNG header', () => {
  assert.doesNotThrow(() => assertScreenshotContent(
    Buffer.from('89504e470d0a1a0a00000000', 'hex'),
    'lectures/ci/screenshots/example.png',
  ));
});

test('rejects an unresolved LFS pointer with recovery instructions', () => {
  const pointer = Buffer.from('version https://git-lfs.github.com/spec/v1\n'
    + `oid sha256:${'a'.repeat(64)}\nsize 123\n`);
  assert.throws(() => assertScreenshotContent(pointer, 'example.png'),
    /Git LFS screenshot not downloaded: example\.png\. Run git lfs pull/);
});

test('rejects empty or non-PNG screenshot content', () => {
  for (const content of [Buffer.alloc(0), Buffer.from('<html>Not found</html>')]) {
    assert.throws(() => assertScreenshotContent(content, 'example.png'), /Invalid PNG screenshot/);
  }
});

test('both site workflows materialize LFS assets before building', async () => {
  for (const name of ['preview', 'pages']) {
    const workflow = parse(await readFile(new URL(`../.github/workflows/${name}.yml`, import.meta.url), 'utf8'));
    for (const job of Object.values(workflow.jobs)) {
      const checkout = job.steps.find((step) => step.uses?.startsWith('actions/checkout@'));
      assert.equal(checkout?.with?.lfs, true, `${name} must download screenshot contents`);
    }
  }
});
