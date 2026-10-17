import { execFile } from 'node:child_process';
import { copyFile, lstat, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { parse, parseFragment, serialize } from 'parse5';
import { bundledLanguages, createHighlighter } from 'shiki';
import { transformerColorizedBrackets } from '@shikijs/colorized-brackets';
import { actionsExpressionGrammar, workflowHighlighting } from './workflow-highlighting.mjs';

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'dist', 'site');
const publicPaths = [
  '.nojekyll', 'index.html', 'README.md', 'zajecia-02-scope.md',
  'assets', 'lectures', 'labs', 'demos', 'projects',
];
const theme = 'github-dark';
const bracketTransformer = transformerColorizedBrackets({
  themes: {
    [theme]: ['#ffd700', '#da70d6', '#58e6ff', '#ff5e57'],
  },
  langs: {
    actions: {
      bracketPairs: [
        { opener: '${{', closer: '}}' },
        { opener: '(', closer: ')' },
        { opener: '[', closer: ']' },
      ],
    },
  },
});

function attribute(node, name) {
  return node.attrs?.find((item) => item.name === name)?.value;
}

function hasClass(node, name) {
  return attribute(node, 'class')?.split(/\s+/).includes(name) ?? false;
}

function descendants(node) {
  return (node.childNodes ?? []).flatMap((child) => [child, ...descendants(child)]);
}

function text(node) {
  return node.nodeName === '#text'
    ? node.value
    : (node.childNodes ?? []).map(text).join('');
}

function codeBlocks(document, label) {
  const blocks = [];
  for (const pre of descendants(document).filter((node) => node.tagName === 'pre')) {
    let container = pre.parentNode;
    while (container && !hasClass(container, 'slide') && !hasClass(container, 'ci-lab')) {
      container = container.parentNode;
    }
    if (!container) continue;

    const location = `${label}: ${attribute(container, 'data-title') ?? 'code example'}`;
    const children = (pre.childNodes ?? []).filter((node) => node.tagName === 'code');
    if (children.length !== 1) {
      throw new Error(`${location}: each slide code block must contain one <code> element.`);
    }
    const code = children[0];
    const languages = (attribute(code, 'class') ?? '').split(/\s+/)
      .filter((name) => name.startsWith('language-'));
    if (languages.length !== 1) {
      throw new Error(`${location}: add exactly one language-* class to the code block.`);
    }
    const language = languages[0].slice('language-'.length);
    if (language !== 'text' && !Object.hasOwn(bundledLanguages, language)) {
      throw new Error(`${location}: unsupported Shiki language "${language}".`);
    }
    const embedded = attribute(code, 'data-embedded');
    if (embedded !== undefined && !['none', 'github-actions'].includes(embedded)) {
      throw new Error(`${location}: unsupported embedded highlighting mode "${embedded}".`);
    }
    if (embedded === 'github-actions' && !['yaml', 'yml'].includes(language)) {
      throw new Error(`${location}: data-embedded="github-actions" requires a YAML language class.`);
    }
    if (!code.sourceCodeLocation?.endTag) {
      throw new Error(`${location}: the <code> element needs an explicit closing tag.`);
    }
    blocks.push({ code, language, embedded, location });
  }
  return blocks;
}

export async function createSlideHighlighter() {
  return createHighlighter({
    themes: [theme],
    langs: ['yaml', 'json', 'bash', 'powershell', 'javascript', 'typescript', 'dockerfile', actionsExpressionGrammar],
  });
}

export async function highlightSlides(source, highlighter, label = 'presentation') {
  const document = parse(source, { sourceCodeLocationInfo: true });
  const blocks = codeBlocks(document, label);
  await highlighter.loadLanguage(
    ...new Set(blocks.map(({ language }) => language).filter((language) => language !== 'text')),
  );

  const edits = [];
  for (const { code, language, embedded, location: blockLocation } of blocks) {
    const sourceText = text(code);
    const transformers = [bracketTransformer];
    if (embedded === 'github-actions') {
      transformers.push(workflowHighlighting(sourceText, blockLocation, bracketTransformer));
    }
    const highlighted = highlighter.codeToHtml(sourceText, {
      lang: language,
      theme,
      transformers,
    });
    const highlightedCode = descendants(parseFragment(highlighted))
      .find((node) => node.tagName === 'code');
    if (!highlightedCode || text(highlightedCode) !== sourceText) {
      throw new Error(`${label}: highlighting changed the code text.`);
    }

    const location = code.sourceCodeLocation;
    edits.push({
      start: location.startTag.endOffset,
      end: location.endTag.startOffset,
      value: serialize(highlightedCode),
    });
    if (!hasClass(code, 'shiki')) {
      const classLocation = location.attrs.class;
      const classes = `${attribute(code, 'class')} shiki`;
      edits.push({
        start: classLocation.startOffset,
        end: classLocation.endOffset,
        value: `class="${classes}"`,
      });
    }
  }

  let html = source;
  for (const edit of edits.sort((left, right) => right.start - left.start)) {
    html = html.slice(0, edit.start) + edit.value + html.slice(edit.end);
  }
  return { html, blocks: blocks.length };
}

async function gitFiles(...options) {
  const { stdout } = await execFileAsync('git', [
    'ls-files', '-z', ...options, '--', ...publicPaths,
  ], { cwd: root });
  return stdout.split('\0').filter(Boolean);
}

export function assertScreenshotContent(content, relative) {
  if (content.subarray(0, 80).toString('utf8').startsWith('version https://git-lfs.github.com/spec/v1')) {
    throw new Error(`Git LFS screenshot not downloaded: ${relative}. Run git lfs pull before building the site.`);
  }
  if (!content.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) {
    throw new Error(`Invalid PNG screenshot: ${relative}`);
  }
}

export async function buildSite() {
  const [files, deleted] = await Promise.all([
    gitFiles('--cached', '--others', '--exclude-standard', '--deduplicate'),
    gitFiles('--deleted'),
  ]);
  const removed = new Set(deleted);
  const sources = files.filter((file) => !removed.has(file));
  const highlighter = await createSlideHighlighter();
  try {
    // Only this generated directory is replaced; sources and student projects are untouched.
    await rm(output, { recursive: true, force: true });
    for (const relative of sources) {
      const source = join(root, relative);
      const destination = join(output, relative);
      if (!(await lstat(source)).isFile()) {
        throw new Error(`Refusing to publish a non-file entry: ${relative}`);
      }
      await mkdir(dirname(destination), { recursive: true });
      if ((relative.startsWith('lectures/') || relative.startsWith('labs/ci/'))
          && relative.endsWith('.html')) {
        const result = await highlightSlides(await readFile(source, 'utf8'), highlighter, relative);
        await writeFile(destination, result.html);
        console.log(`${relative}: ${result.blocks} code blocks highlighted.`);
      } else {
        if (relative.startsWith('lectures/ci/screenshots/') && relative.endsWith('.png')) {
          assertScreenshotContent(await readFile(source), relative);
        }
        await copyFile(source, destination);
      }
    }
    console.log('Static site ready in dist/site.');
  } finally {
    highlighter.dispose();
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await buildSite();
}
