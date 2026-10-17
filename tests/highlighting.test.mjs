import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { parse } from 'parse5';
import { createSlideHighlighter, highlightSlides } from '../scripts/build-site.mjs';

let highlighter;
before(async () => { highlighter = await createSlideHighlighter(); });
after(() => highlighter.dispose());

function nodes(node) {
  return [node, ...(node.childNodes ?? []).flatMap(nodes)];
}

function text(node) {
  return node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');
}

function attribute(node, name) {
  return node.attrs?.find((item) => item.name === name)?.value;
}

function styleAt(code, needle, within = 0) {
  const match = text(code).indexOf(needle);
  assert.notEqual(match, -1, `Missing code text: ${needle}`);
  const offset = match + within;
  let position = 0;
  for (const node of nodes(code).filter((item) => item.nodeName === '#text')) {
    const end = position + node.value.length;
    if (position <= offset && offset < end) return attribute(node.parentNode, 'style');
    position = end;
  }
  assert.fail(`Missing highlighted text: ${needle}`);
}

function escapeHtml(source) {
  return source.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

test('opt-in workflow highlighting distinguishes Bash, JavaScript and Actions expressions from YAML', async () => {
  const workflow = '- shell: bash\n'
    + '  run: |\n'
    + '    echo "$HOME"\n'
    + '    echo "${{ format(\'hello {0}\', github.actor) }}"\n'
    + '- uses: actions/github-script@v7\n'
    + '  with:\n'
    + '    script: |\n'
    + '      const report = { jobs: [1] };\n';
  const source = '<section class="slide">'
    + ['none', 'github-actions'].map((mode) => '<pre><code class="language-yaml"'
      + ` data-embedded="${mode}">${escapeHtml(workflow)}</code></pre>`).join('')
    + '</section>';
  const result = await highlightSlides(source, highlighter);
  const [yaml, mixed] = nodes(parse(result.html)).filter((node) => node.tagName === 'code');
  assert.deepEqual([text(yaml), text(mixed)], [workflow, workflow]);
  assert.equal(styleAt(yaml, 'echo'), 'color:#9ECBFF');
  assert.equal(styleAt(mixed, 'echo'), 'color:#79B8FF');
  assert.equal(styleAt(mixed, 'const'), 'color:#F97583');
  assert.equal(styleAt(mixed, 'format'), 'color:#B392F0');
  assert.equal(styleAt(mixed, "'hello"), 'color:#9ECBFF');
  assert.equal(attribute(mixed, 'data-embedded'), 'github-actions');
});

test('highlights parsed inline and block scripts without rewriting YAML scalar spelling', async () => {
  for (const [workflow, command] of [
    ['shell: bash\nrun: echo "$HOME" # a YAML comment\n', 'echo'],
    ["run: 'echo ''hello'' \"$HOME\"'\nshell: bash\n", 'echo'],
    [String.raw`shell: bash
run: "echo \"A & B\"; echo \"$HOME\"\n"
`, 'echo'],
    [String.raw`shell: bash
run: "\u0065cho \"$HOME\""
`, '\\u0065cho'],
    ['shell: bash\nrun: >-\n  echo\n  "$HOME"\n', 'echo'],
    ['shell: bash\nrun: |2- # explicit indentation\n  echo "$HOME"\n\n', 'echo'],
  ]) {
    const source = '<article class="ci-lab"><pre><code class="language-yaml" data-embedded="github-actions">'
      + escapeHtml(workflow) + '</code></pre></article>';
    const result = await highlightSlides(source, highlighter);
    const code = nodes(parse(result.html)).find((node) => node.tagName === 'code');
    assert.equal(text(code), workflow);
    assert.equal(styleAt(code, command), 'color:#79B8FF', workflow);
    assert.equal(styleAt(code, '$HOME'), 'color:#E1E4E8', workflow);
  }
});

test('colors nested embedded brackets without treating strings or comments as code', async () => {
  const workflow = "- if: ${{ contains(fromJSON('[\"a\", \"b\"]'), 'a') && github.ref != 'it''s }}' }}\n"
    + '  uses: actions/github-script@v7\n'
    + '  with:\n'
    + '    script: |\n'
    + '      const values = { items: [Math.max(1, 2)] };\n'
    + '      const literal = "([text])";\n'
    + '      // ({[comment]})\n'
    + '      const unfinished = [\n'
    + '- uses: actions/github-script@v7\n'
    + '  with:\n'
    + '    script: const later = [3];\n';
  const { html } = await highlightSlides('<section class="slide"><pre>'
    + '<code class="language-yaml" data-embedded="github-actions">'
    + escapeHtml(workflow) + '</code></pre></section>', highlighter);
  const code = nodes(parse(html)).find((node) => node.tagName === 'code');
  assert.equal(text(code), workflow);
  assert.equal(styleAt(code, '${{'), 'color:#ffd700');
  assert.equal(styleAt(code, 'contains(', 'contains'.length), 'color:#da70d6');
  assert.equal(styleAt(code, 'fromJSON(', 'fromJSON'.length), 'color:#58e6ff');
  assert.equal(styleAt(code, '["a"'), 'color:#9ECBFF');
  assert.equal(styleAt(code, "}}'"), 'color:#9ECBFF');
  assert.equal(styleAt(code, '&&'), 'color:#F97583');
  assert.equal(styleAt(code, '!='), 'color:#F97583');
  assert.equal(styleAt(code, '{ items'), 'color:#ffd700');
  assert.equal(styleAt(code, '[Math'), 'color:#da70d6');
  assert.equal(styleAt(code, '(1, 2)'), 'color:#58e6ff');
  assert.equal(styleAt(code, '([text])'), 'color:#9ECBFF');
  assert.equal(styleAt(code, '({[comment]})'), 'color:#6A737D');
  assert.equal(styleAt(code, '[\n'), 'color:#ff5e57');
  assert.equal(styleAt(code, '[3]'), 'color:#ffd700');
});

test('YAML decoding and expression injection preserve the host language state', async () => {
  const workflow = `steps:
  - shell: bash
    run: |
      echo '\${{ format('it''s "fine" }} {0}', github.actor) }}'
      cat <<'EOF'
      const insideHeredoc = [1];
      EOF
      echo "$HOME"
  - uses: actions/github-script@v7
    with:
      script: |
        const actor = '\${{ format('it''s', github.actor) }}';
        const value = { items: [1] };
  - uses: actions/github-script@v7
    with:
      script: >-
        // Folded into the comment:
        const swallowed = 1;
`;
  const { html } = await highlightSlides('<section class="slide"><pre>'
    + '<code class="language-yaml" data-embedded="github-actions">'
    + escapeHtml(workflow) + '</code></pre></section>', highlighter);
  const code = nodes(parse(html)).find((node) => node.tagName === 'code');
  assert.equal(text(code), workflow);
  assert.equal(styleAt(code, 'format'), 'color:#B392F0');
  assert.equal(styleAt(code, '"fine"'), 'color:#9ECBFF');
  assert.equal(styleAt(code, 'const insideHeredoc'), 'color:#9ECBFF');
  assert.equal(styleAt(code, 'echo "$HOME"'), 'color:#79B8FF');
  assert.equal(styleAt(code, 'const value'), 'color:#F97583');
  assert.equal(styleAt(code, '{ items'), 'color:#ffd700');
  assert.equal(styleAt(code, 'const swallowed'), 'color:#6A737D');
});

test('Actions expressions support multiline functions, filters, literals and operators', async () => {
  const workflow = `if: >-
  \${{ !cancelled() &&
      contains(github.event.issue.labels.*.name, 'ready') &&
      -1.2e3 < 0x10 && (true || null == false) }}
`;
  const { html } = await highlightSlides('<section class="slide"><pre>'
    + '<code class="language-yaml" data-embedded="github-actions">'
    + escapeHtml(workflow) + '</code></pre></section>', highlighter);
  const code = nodes(parse(html)).find((node) => node.tagName === 'code');
  assert.equal(text(code), workflow);
  for (const literal of ['-1.2e3', '0x10', 'true', 'null', 'false']) {
    assert.equal(styleAt(code, literal), 'color:#79B8FF', literal);
  }
  for (const operator of ['!', '*', '<', '&&', '||', '==']) {
    assert.equal(styleAt(code, operator), 'color:#F97583', operator);
  }
  assert.equal(styleAt(code, 'cancelled'), 'color:#B392F0');
  assert.equal(styleAt(code, "'ready'"), 'color:#9ECBFF');
});

test('Actions property identifiers keep legal hyphens instead of becoming literal tokens', async () => {
  const workflow = 'env:\n  FLAG: ${{ inputs.true-flag- || needs.null-safe.outputs.false-positive }}\n';
  const { html } = await highlightSlides('<section class="slide"><pre>'
    + '<code class="language-yaml" data-embedded="github-actions">'
    + escapeHtml(workflow) + '</code></pre></section>', highlighter);
  const code = nodes(parse(html)).find((node) => node.tagName === 'code');
  assert.equal(text(code), workflow);
  for (const name of ['true-flag-', 'null-safe', 'false-positive']) {
    assert.equal(styleAt(code, name), 'color:#E1E4E8', name);
  }
});

test('workflow structure selects only explicit supported hosts and ignores YAML comments', async () => {
  const workflow = `# \${{ deliberately unterminated example in a YAML comment
env:
  SHELL_NAME: &bash bash
  EXAMPLE: 'echo env-only'
defaults:
  run:
    shell: bash
jobs:
  demo:
    steps:
      - run: echo default-only
      - shell: bash -e {0}
        run: echo custom-only
      - shell: *bash
        run: echo alias-only
      - { shell: bash, run: 'echo actual' }
      - uses: another/github-script@v7
        with:
          script: const notJavaScript = 1;
      - uses: actions/github-script@0123456789abcdef
        with:
          script: const genuine = 1;
`;
  const { html } = await highlightSlides('<section class="slide"><pre>'
    + '<code class="language-yaml" data-embedded="github-actions">'
    + escapeHtml(workflow) + '</code></pre></section>', highlighter);
  const code = nodes(parse(html)).find((node) => node.tagName === 'code');
  assert.equal(text(code), workflow);
  for (const command of ['echo env-only', 'echo default-only', 'echo custom-only', 'echo alias-only', 'const notJavaScript']) {
    assert.equal(styleAt(code, command), 'color:#9ECBFF', command);
  }
  assert.equal(styleAt(code, 'echo actual'), 'color:#79B8FF');
  assert.equal(styleAt(code, 'const genuine'), 'color:#F97583');
});

test('mixed-language highlighting keeps metadata, entities and Unicode text and is idempotent', async () => {
  const workflow = 'shell: bash\nrun: |\n  echo "&lt; <tag> π 🧪 ${{ github.actor }}"\n\n';
  const source = '<!doctype html><section class="slide" id="mixed" data-title="Mixed">'
    + '<pre tabindex="0" data-example="kept"><code class="language-yaml" data-embedded="github-actions"'
    + ' data-workflow="sample" data-part="2" aria-label="Example">'
    + escapeHtml(workflow).replace('π', '&#x3c0;')
    + '</code></pre><p>Untouched instructions</p></section>';
  const first = await highlightSlides(source, highlighter);
  const second = await highlightSlides(first.html, highlighter);
  const code = nodes(parse(second.html)).find((node) => node.tagName === 'code');
  assert.equal(text(code), workflow);
  assert.equal(attribute(code, 'data-embedded'), 'github-actions');
  assert.equal(attribute(code, 'data-workflow'), 'sample');
  assert.equal(attribute(code, 'data-part'), '2');
  assert.equal(attribute(code, 'aria-label'), 'Example');
  assert.ok(first.html.startsWith(source.slice(0, source.indexOf('<code'))));
  assert.ok(first.html.endsWith(source.slice(source.indexOf('</code>'))));
  assert.equal(second.html, first.html);
  assert.equal(nodes(parse(second.html)).filter((node) => node.tagName === 'code').length, 1);
});

test('absent and none markers retain identical YAML-only behavior, including invalid teaching snippets', async () => {
  const workflow = 'shell: bash\nrun: echo "${{ deliberately unfinished"\ninvalid: [\n';
  const source = '<section class="slide">'
    + ['', ' data-embedded="none"'].map((attributes) => '<pre><code class="language-yaml"'
      + attributes + '>' + escapeHtml(workflow) + '</code></pre>').join('')
    + '</section>';
  const { html } = await highlightSlides(source, highlighter);
  const codes = nodes(parse(html)).filter((node) => node.tagName === 'code');
  assert.deepEqual(codes.map(text), [workflow, workflow]);
  assert.equal(styleAt(codes[0], 'echo'), styleAt(codes[1], 'echo'));
  assert.equal(styleAt(codes[1], 'echo'), 'color:#9ECBFF');
});

test('invalid embedded modes, YAML and expression syntax fail with the example location', async () => {
  for (const [language, mode, code, message] of [
    ['yaml', 'unknown', 'run: echo hi', /unsupported embedded highlighting mode "unknown"/],
    ['javascript', 'github-actions', 'const value = 1;', /github-actions.*requires.*YAML/],
    ['yaml', 'github-actions', 'steps: [', /invalid GitHub Actions YAML/],
    ['yaml', 'github-actions', 'if: ${{ true', /unterminated GitHub Actions expression/],
    ['yaml', 'github-actions', 'if: ${{ }}', /empty GitHub Actions expression/],
    ['yaml', 'github-actions', 'if: ${{ "not an Actions string" }}', /invalid GitHub Actions expression token/],
    ['yaml', 'github-actions', 'if: ${{ ${{ true }} }}', /nested GitHub Actions expression/],
  ]) {
    const source = '<section class="slide" data-title="Mixed"><pre>'
      + `<code class="language-${language}" data-embedded="${mode}">`
      + escapeHtml(code) + '</code></pre></section>';
    await assert.rejects(highlightSlides(source, highlighter, 'lesson.html'), (error) => {
      assert.match(error.message, /^lesson\.html: Mixed:/);
      assert.match(error.message, message);
      return true;
    });
  }
});

test('preserves exact code, slide attributes, assembly markers and surrounding HTML', async () => {
  const code = 'on: push\njobs:\n  check:\n    if: ${{ true && 1 < 2 }}\n';
  const source = '<!doctype html><html lang="pl"><body><section class="slide" id="example" data-title="Example">'
    + '<pre tabindex="0"><code class="language-yaml" data-workflow="example" data-part="1">'
    + code.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    + '</code></pre></section><footer>Controls remain here</footer></body></html>';
  const result = await highlightSlides(source, highlighter);
  const document = parse(result.html);
  const outputCode = nodes(document).find((node) => node.tagName === 'code');
  assert.equal(result.blocks, 1);
  assert.equal(text(outputCode), code);
  assert.equal(attribute(outputCode, 'class'), 'language-yaml shiki');
  assert.equal(attribute(outputCode, 'data-workflow'), 'example');
  assert.equal(attribute(outputCode, 'data-part'), '1');
  assert.ok(result.html.startsWith(source.slice(0, source.indexOf('<code'))));
  assert.ok(result.html.endsWith(source.slice(source.indexOf('</code>'))));
  assert.ok(nodes(outputCode).some((node) => attribute(node, 'style')?.includes('color:')));
});

test('colors nested bracket pairs at different depths with the requested transformer', async () => {
  const source = '<section class="slide"><pre><code class="language-javascript">'
    + 'const value = { list: [Math.max(1, 2)] };'
    + '</code></pre></section>';
  const { html } = await highlightSlides(source, highlighter);
  const spans = nodes(parse(html)).filter((node) => node.tagName === 'span');
  const colors = new Map(spans.filter((node) => ['{', '}', '[', ']', '(', ')'].includes(text(node)))
    .map((node) => [text(node), attribute(node, 'style')]));
  assert.equal(colors.get('{'), 'color:#ffd700');
  assert.equal(colors.get('}'), colors.get('{'));
  assert.equal(colors.get('['), 'color:#da70d6');
  assert.equal(colors.get(']'), colors.get('['));
  assert.equal(colors.get('('), 'color:#58e6ff');
  assert.equal(colors.get(')'), colors.get('('));
});

test('does not change text diagrams, inline code or code outside slides', async () => {
  const source = '<p><code>inline</code></p><pre><code>outside</code></pre>'
    + '<section class="slide"><pre><code class="language-text">A → B\n├── C\n</code></pre></section>';
  const { html, blocks } = await highlightSlides(source, highlighter);
  assert.equal(blocks, 1);
  assert.ok(html.startsWith(source.slice(0, source.indexOf('<section'))));
  const codes = nodes(parse(html)).filter((node) => node.tagName === 'code');
  assert.equal(text(codes[2]), 'A → B\n├── C\n');
});

test('highlights CI laboratory examples without changing their instructions or code', async () => {
  const source = '<article class="doc ci-lab"><h2>First workflow</h2>'
    + '<pre><code class="language-yaml">on: push\njobs: {}</code></pre>'
    + '<details><summary>Hint</summary><p>Read the job log.</p></details></article>';
  const result = await highlightSlides(source, highlighter, 'laboratory');
  const code = nodes(parse(result.html)).find((node) => node.tagName === 'code');
  assert.equal(result.blocks, 1);
  assert.equal(text(code), 'on: push\njobs: {}');
  assert.ok(attribute(code, 'class').includes('shiki'));
  assert.ok(result.html.includes('<details><summary>Hint</summary><p>Read the job log.</p></details>'));
});

test('repeated highlighting is deterministic and does not add nested pre or code elements', async () => {
  const source = '<section class="slide"><pre><code class="language-json">{"list":[1,2]}</code></pre></section>';
  const first = await highlightSlides(source, highlighter);
  const second = await highlightSlides(first.html, highlighter);
  assert.equal(second.html, first.html);
  const elements = nodes(parse(second.html));
  assert.equal(elements.filter((node) => node.tagName === 'pre').length, 1);
  assert.equal(elements.filter((node) => node.tagName === 'code').length, 1);
});

test('missing and unknown languages cause explicit build failures', async () => {
  for (const [attributes, message] of [
    ['', /add exactly one language-/],
    ['class="language-yaml language-bash"', /add exactly one language-/],
    ['class="language-no-such-language"', /unsupported Shiki language/],
  ]) {
    await assert.rejects(
      highlightSlides(`<section class="slide"><pre><code ${attributes}>value</code></pre></section>`, highlighter),
      message,
    );
  }
});

test('every code block in both source presentations is annotated and keeps its content', async () => {
  for (const relative of ['lectures/docker/index.html', 'lectures/ci/index.html']) {
    const source = await readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
    const result = await highlightSlides(source, highlighter, relative);
    const sourceCodes = nodes(parse(source)).filter((node) => node.tagName === 'code');
    const outputCodes = nodes(parse(result.html)).filter((node) => node.tagName === 'code');
    assert.deepEqual(outputCodes.map(text), sourceCodes.map(text), relative);
    const preCount = nodes(parse(source)).filter((node) => node.tagName === 'pre').length;
    assert.equal(result.blocks, preCount, relative);
    assert.ok(result.blocks > 0, relative);
  }
});
