import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgs, promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const defaultProfile = join(homedir(), '.tdo-browser-profile');
const operations = new Set(['click', 'wait', 'expand', 'scroll']);
const execFileAsync = promisify(execFile);
const defaultViewport = { width: 1440, height: 1000 };

export function privatePath(path, label) {
  const resolved = resolve(path);
  if (resolved === root || resolved.startsWith(`${root}/`)) {
    throw new Error(`Keep the private ${label} outside the repository.`);
  }
  return resolved;
}

export function validateConfig(config) {
  if (!config || !Array.isArray(config.captures) || config.captures.length === 0) {
    throw new Error('The manifest needs a nonempty captures array.');
  }
  const ids = new Set();
  for (const capture of config.captures) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(capture.id) || ids.has(capture.id)) {
      throw new Error(`Invalid or duplicate capture id: ${capture.id}`);
    }
    ids.add(capture.id);
    const url = new URL(capture.url);
    if (url.origin !== 'https://github.com') {
      throw new Error(`${capture.id}: only https://github.com URLs are allowed.`);
    }
    if (typeof capture.selector !== 'string' || !capture.selector.trim()) {
      throw new Error(`${capture.id}: provide an explicit crop selector.`);
    }
    if (capture.actions !== undefined && !Array.isArray(capture.actions)) {
      throw new Error(`${capture.id}: actions must be an array.`);
    }
    for (const action of capture.actions ?? []) {
      if (!operations.has(action.type) || typeof action.selector !== 'string' || !action.selector.trim()) {
        throw new Error(`${capture.id}: invalid browser action.`);
      }
    }
    if (!Array.isArray(capture.expect) || capture.expect.length === 0
        || capture.expect.some((value) => typeof value !== 'string' || !value.trim())) {
      throw new Error(`${capture.id}: provide the visible text that must be in the crop.`);
    }
    if (capture.mask !== undefined && (!Array.isArray(capture.mask)
        || capture.mask.some((value) => typeof value !== 'string' || !value.trim()))) {
      throw new Error(`${capture.id}: mask must contain CSS selectors.`);
    }
    if (capture.bounds !== undefined && (!Array.isArray(capture.bounds) || !capture.bounds.length
        || capture.bounds.some((value) => typeof value !== 'string' || !value.trim()))) {
      throw new Error(`${capture.id}: bounds must contain crop-edge selectors.`);
    }
    if (capture.padding !== undefined && (!capture.padding
        || !['top', 'right', 'bottom', 'left'].every((edge) =>
          Number.isInteger(capture.padding[edge]) && capture.padding[edge] >= 0 && capture.padding[edge] <= 256))) {
      throw new Error(`${capture.id}: padding needs four integer margins between 0 and 256.`);
    }
    if (capture.padding !== undefined && capture.bounds !== undefined) {
      throw new Error(`${capture.id}: padding and bounds are separate crop modes.`);
    }
    if (capture.viewport !== undefined && (!capture.viewport
        || !['width', 'height'].every((dimension) =>
          Number.isInteger(capture.viewport[dimension]) && capture.viewport[dimension] >= 320
            && capture.viewport[dimension] <= 8192))) {
      throw new Error(`${capture.id}: viewport needs integer width and height between 320 and 8192.`);
    }
    if (capture.workflow && (!/^[\w.-]+\/[\w.-]+$/.test(capture.workflow.repo)
        || typeof capture.workflow.runId !== 'string' || !/^\d+$/.test(capture.workflow.runId)
        || !['in_progress', 'completed'].includes(capture.workflow.status)
        || typeof capture.workflow.rerun !== 'boolean'
        || capture.workflow.repo !== url.pathname.split('/').slice(1, 3).join('/'))) {
      throw new Error(`${capture.id}: invalid workflow preparation.`);
    }
    if (capture.controls !== undefined && !Array.isArray(capture.controls)) {
      throw new Error(`${capture.id}: controls must be an array.`);
    }
    for (const control of capture.controls ?? []) {
      if (typeof control.selector !== 'string' || !control.selector.trim()
          || typeof control.enabled !== 'boolean') {
        throw new Error(`${capture.id}: controls need a selector and Boolean enabled state.`);
      }
    }
  }
  return config;
}

export function paddedScreenshotClip(box, padding, viewport) {
  if (!box || box.width <= 0 || box.height <= 0) throw new Error('Cannot measure the screenshot region.');
  const x = Math.floor(box.x - padding.left);
  const y = Math.floor(box.y - padding.top);
  const right = Math.ceil(box.x + box.width + padding.right);
  const bottom = Math.ceil(box.y + box.height + padding.bottom);
  if (!viewport || x < 0 || y < 0 || right > viewport.width || bottom > viewport.height) {
    throw new Error('Screenshot margins do not fit. Configure a larger viewport instead of clipping the image.');
  }
  return { x, y, width: right - x, height: bottom - y };
}

export async function prepareWorkflow(capture, allowRerun) {
  const workflow = capture.workflow;
  if (!workflow) return;
  if (workflow.rerun && !allowRerun) throw new Error(`${capture.id}: pass --rerun to replay this workflow.`);
  const readRun = async () => JSON.parse((await execFileAsync('gh', [
    'api', `repos/${workflow.repo}/actions/runs/${workflow.runId}`,
  ], { timeout: 30_000 })).stdout);
  const previous = await readRun();
  if (workflow.rerun) {
    await execFileAsync('gh', ['run', 'rerun', workflow.runId, '--repo', workflow.repo], { timeout: 30_000 });
  }
  const deadline = Date.now() + 5 * 60_000;
  while (Date.now() < deadline) {
    const run = await readRun();
    const newAttempt = !workflow.rerun || run.run_attempt > previous.run_attempt;
    if (newAttempt && run.status === 'completed' && run.conclusion !== 'success') {
      throw new Error(`${capture.id}: workflow concluded ${run.conclusion}, not success.`);
    }
    if (newAttempt && run.status === workflow.status) {
      console.log(`${capture.id}: workflow attempt ${run.run_attempt} is ${run.status}.`);
      return;
    }
    if (newAttempt && workflow.status === 'in_progress' && run.status === 'completed') {
      throw new Error(`${capture.id}: the in-progress screenshot window has already closed.`);
    }
    await sleep(2000);
  }
  throw new Error(`${capture.id}: timed out waiting for workflow ${workflow.status}.`);
}

async function waitForLogin(page) {
  await page.goto('https://github.com/', { waitUntil: 'domcontentloaded' });
  const accountMenu = page.getByRole('button', { name: 'Open user navigation menu' });
  if (!await accountMenu.isVisible()) {
    await page.goto('https://github.com/login', { waitUntil: 'domcontentloaded' });
    console.log('Log in in the browser window (including 2FA). No password is read by this script.');
    await accountMenu.waitFor({ state: 'visible', timeout: 15 * 60_000 });
  }
  console.log('Authenticated browser session ready.');
}

export async function capturePage(page, capture, output) {
  await page.setViewportSize(capture.viewport ?? defaultViewport);
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(capture.url, { waitUntil: 'domcontentloaded' });
  if (new URL(page.url()).pathname.startsWith('/login')) {
    throw new Error(`${capture.id}: the browser is not authenticated.`);
  }
  const colorScheme = await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
  if (colorScheme !== 'dark') {
    throw new Error(`${capture.id}: GitHub is not using dark mode. Select "Sync with system" in GitHub appearance settings.`);
  }
  for (const action of capture.actions ?? []) {
    const target = page.locator(action.selector);
    if (action.type === 'click') await target.click();
    if (action.type === 'wait') await target.waitFor({ state: 'visible' });
    if (action.type === 'scroll') await target.scrollIntoViewIfNeeded();
    if (action.type === 'expand') {
      await target.waitFor({ state: 'visible' });
      const expanded = await target.getAttribute('aria-expanded');
      if (!['false', 'true'].includes(expanded)) {
        throw new Error(`${capture.id}: expand requires an aria-expanded control.`);
      }
      if (expanded === 'false') await target.click();
    }
  }
  const crop = page.locator(capture.selector);
  await crop.waitFor({ state: 'visible' });
  for (const expected of capture.expect) {
    await crop.getByText(expected, { exact: false }).filter({ visible: true }).first()
      .waitFor({ state: 'visible' });
  }
  for (const control of capture.controls ?? []) {
    const target = crop.locator(control.selector);
    await target.waitFor({ state: 'visible' });
    if (await target.isEnabled() !== control.enabled) {
      throw new Error(`${capture.id}: unexpected enabled state for ${control.selector}.`);
    }
  }
  await page.evaluate(() => document.fonts.ready);
  await crop.evaluate((element) => element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' }));
  const destination = join(output, `${capture.id}.png`);
  const options = {
    path: destination,
    animations: 'disabled',
    caret: 'hide',
    mask: (capture.mask ?? []).map((selector) => page.locator(selector)),
    maskColor: '#6e7781',
  };
  if (capture.padding) {
    await crop.scrollIntoViewIfNeeded();
    const clip = paddedScreenshotClip(await crop.boundingBox(), capture.padding, page.viewportSize());
    await page.screenshot({ ...options, clip });
  } else if (capture.bounds) {
    await crop.scrollIntoViewIfNeeded();
    const boxes = [];
    for (const selector of capture.bounds) {
      const edge = crop.locator(selector);
      await edge.waitFor({ state: 'visible' });
      await edge.scrollIntoViewIfNeeded();
    }
    for (const selector of capture.bounds) {
      const edge = crop.locator(selector);
      boxes.push(await edge.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        return { x: rect.x + scrollX, y: rect.y + scrollY, right: rect.right + scrollX, bottom: rect.bottom + scrollY };
      }));
    }
    const x = Math.min(...boxes.map((box) => box.x));
    const y = Math.min(...boxes.map((box) => box.y));
    const right = Math.max(...boxes.map((box) => box.right));
    const bottom = Math.max(...boxes.map((box) => box.bottom));
    const clip = { x, y, width: right - x, height: bottom - y };
    if (clip.width <= 0 || clip.height <= 0) throw new Error(`${capture.id}: empty crop bounds.`);
    for (const expected of capture.expect) {
      const candidates = crop.getByText(expected, { exact: false }).filter({ visible: true });
      const inside = await candidates.evaluateAll((elements, rectangle) => elements.some((element) => {
        const rect = element.getBoundingClientRect();
        return rect.x + scrollX >= rectangle.x - 1 && rect.right + scrollX <= rectangle.x + rectangle.width + 1
          && rect.y + scrollY >= rectangle.y - 1 && rect.bottom + scrollY <= rectangle.y + rectangle.height + 1;
      }), clip);
      if (!inside) throw new Error(`${capture.id}: expected text falls outside the crop: ${expected}`);
    }
    const rootBox = await crop.boundingBox();
    if (!rootBox) throw new Error(`${capture.id}: crop disappeared.`);
    const scroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
    if (x < rootBox.x + scroll.x - 1 || y < rootBox.y + scroll.y - 1
        || right > rootBox.x + scroll.x + rootBox.width + 1
        || bottom > rootBox.y + scroll.y + rootBox.height + 1) {
      throw new Error(`${capture.id}: bounds are clipped by the crop's scroll container.`);
    }
    // Crop the element's PNG, not a full-page screenshot that can reflow lazy GitHub UI.
    const png = await crop.screenshot({ ...options, path: undefined });
    const canvasPage = await page.context().newPage();
    try {
      const data = await canvasPage.evaluate(async ({ source, rectangle, container }) => {
        const image = new Image();
        image.src = `data:image/png;base64,${source}`;
        await image.decode();
        const scale = image.width / container.width;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(rectangle.width * scale);
        canvas.height = Math.round(rectangle.height * scale);
        canvas.getContext('2d').drawImage(image,
          Math.round((rectangle.x - container.x) * scale),
          Math.round((rectangle.y - container.y) * scale),
          canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/png').split(',')[1];
      }, {
        source: png.toString('base64'),
        rectangle: clip,
        container: { ...rootBox, x: rootBox.x + scroll.x, y: rootBox.y + scroll.y },
      });
      await writeFile(destination, Buffer.from(data, 'base64'));
    } finally {
      await canvasPage.close();
    }
  } else {
    await crop.screenshot(options);
  }
  console.log(`Saved ${capture.id}.png`);
  return { id: capture.id, url: page.url(), colorScheme, capturedAt: new Date().toISOString() };
}

async function main() {
  const { values } = parseArgs({
    options: {
      config: { type: 'string' },
      profile: { type: 'string', default: defaultProfile },
      output: { type: 'string', default: 'lectures/ci/screenshots' },
      only: { type: 'string' },
      cdp: { type: 'string' },
      login: { type: 'boolean', default: false },
      headless: { type: 'boolean', default: false },
      port: { type: 'string', default: '18574' },
      rerun: { type: 'boolean', default: false },
    },
  });
  if (values.login && (values.cdp || values.headless)) {
    throw new Error('--login opens a new, visible browser. Omit --cdp and --headless.');
  }
  const profile = privatePath(values.profile, 'browser profile');
  const configPath = privatePath(values.config ?? join(profile, 'captures.json'), 'capture manifest');
  const config = !values.login
    ? validateConfig(JSON.parse(await readFile(configPath, 'utf8')))
    : null;
  const captures = config?.captures.filter((capture) => !values.only || capture.id === values.only);
  if (config && !captures.length) throw new Error(`Unknown capture: ${values.only}`);
  if (!values.rerun && captures?.some((capture) => capture.workflow?.rerun)) {
    throw new Error('This selection includes transient workflow states. Pass --rerun, or --only <stable-capture>.');
  }
  if (values.cdp && !/^http:\/\/127\.0\.0\.1:\d+$/.test(values.cdp)) {
    throw new Error('--cdp must point to an explicit loopback address: http://127.0.0.1:PORT');
  }
  const port = Number(values.port);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid debugging port.');
  await mkdir(profile, { recursive: true, mode: 0o700 });
  if (config && values.config) {
    await writeFile(join(profile, 'captures.json'), `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  }
  const browser = values.cdp
    ? await chromium.connectOverCDP(values.cdp)
    : null;
  const context = browser
    ? browser.contexts()[0]
    : await chromium.launchPersistentContext(profile, {
      channel: 'chrome',
      headless: values.headless,
      viewport: defaultViewport,
      deviceScaleFactor: 2,
      colorScheme: 'dark',
      locale: 'en-US',
      args: [
        '--remote-debugging-address=127.0.0.1',
        `--remote-debugging-port=${port}`,
      ],
    });
  if (!context) throw new Error('The browser has no persistent context.');
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  try {
    await waitForLogin(page);
    if (values.login) {
      console.log(`Browser kept open. Use --cdp http://127.0.0.1:${port} to take control.`);
      await new Promise((done) => {
        context.once('close', done);
        process.once('SIGINT', () => { context.close().then(done); });
        process.once('SIGTERM', () => { context.close().then(done); });
      });
      return;
    }
    const output = isAbsolute(values.output) ? values.output : resolve(root, values.output);
    await mkdir(output, { recursive: true });
    const results = [];
    for (const capture of captures) {
      await prepareWorkflow(capture, values.rerun);
      results.push(await capturePage(page, capture, output));
    }
    const report = resolve(dirname(configPath), `capture-report-${Date.now()}.json`);
    await writeFile(report, `${JSON.stringify(results, null, 2)}\n`, { mode: 0o600 });
    console.log('Capture provenance written beside the private manifest.');
  } finally {
    if (browser) {
      await page.close();
      await browser.close();
    } else {
      await context.close();
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
