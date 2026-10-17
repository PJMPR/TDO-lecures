import { CST, isMap, isScalar, isSeq, parseDocument, visit } from 'yaml';

// Opt in with <code class="language-yaml" data-embedded="github-actions">.
// No marker or data-embedded="none" keeps ordinary YAML-only highlighting.
// Accepts one YAML document; plain/quoted, literal and folded string scalars
// are tokenized as decoded values, then mapped back to their CST source spelling.
// Recognizes workflow jobs.steps, a steps mapping, a step list, or one step.
// Only an explicit shell: bash and actions/github-script@ref with.script select
// embedded languages. Defaults, aliases and custom shell commands are not inferred.
// Explicit ${{ ... }} expressions use their own TextMate grammar, not JavaScript;
// implicit if expressions remain YAML. Invalid YAML, delimiters and expression
// lexemes fail the build, but this is not a complete Actions/script validator.
export const actionsExpressionGrammar = {
  name: 'actions-expression',
  scopeName: 'source.actions',
  patterns: [
    {
      name: 'string.quoted.single.actions',
      begin: "'",
      end: "'(?!')",
      patterns: [{ name: 'constant.character.escape.actions', match: "''" }],
    },
    { name: 'entity.name.function.actions', match: '\\b[A-Za-z_][A-Za-z0-9_]*(?=\\s*\\()' },
    { name: 'constant.language.actions', match: '\\b(?i:true|false|null)(?![A-Za-z0-9_-])' },
    { name: 'constant.numeric.actions', match: '(?<!\\w)-?(?:0[xX][0-9a-fA-F]+|\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?)\\b' },
    { name: 'keyword.operator.actions', match: '&&|\\|\\||==|!=|<=|>=|[!<>*]' },
    { name: 'variable.other.actions', match: '\\b[A-Za-z_][A-Za-z0-9_-]*' },
    { name: 'punctuation.section.embedded.actions', match: '\\$\\{\\{|\\}\\}|[()\\[\\].,]' },
    { name: 'invalid.illegal.actions', match: '\\S' },
  ],
};

function expressionRanges(source, label) {
  const ranges = [];
  let start = source.indexOf('${{');
  while (start !== -1) {
    let quoted = false;
    let end = start + 3;
    for (; end < source.length; end += 1) {
      if (source[end] === "'") {
        if (quoted && source[end + 1] === "'") end += 1;
        else quoted = !quoted;
      } else if (!quoted && source.startsWith('}}', end)) {
        break;
      } else if (!quoted && source.startsWith('${{', end)) {
        throw new Error(`${label}: nested GitHub Actions expression delimiters are invalid.`);
      }
    }
    if (end === source.length) {
      throw new Error(`${label}: unterminated GitHub Actions expression (\${{ ... }}).`);
    }
    if (!source.slice(start + 3, end).trim()) {
      throw new Error(`${label}: empty GitHub Actions expression.`);
    }
    ranges.push({ start, end: end + 2 });
    start = source.indexOf('${{', end + 2);
  }
  return ranges;
}

function stepMaps(root) {
  const result = [];
  const addSteps = (node) => {
    if (isSeq(node)) result.push(...node.items.filter(isMap));
  };
  if (isMap(root)) {
    result.push(root);
    addSteps(root.get('steps', true));
    const jobs = root.get('jobs', true);
    if (isMap(jobs)) {
      for (const job of jobs.items) {
        if (isMap(job.value)) addSteps(job.value.get('steps', true));
      }
    }
  } else {
    addSteps(root);
  }
  return result;
}

function overlayTokens(source, lines, replacements) {
  let index = 0;
  return lines.map((line) => line.flatMap((base) => {
    const result = [];
    const end = base.offset + base.content.length;
    let start = base.offset;
    while (start < end) {
      while (replacements[index]?.end <= start) index += 1;
      const replacement = replacements[index];
      const active = replacement && replacement.start <= start;
      const stop = Math.min(end, active ? replacement.end : replacement?.start ?? end);
      result.push({
        ...(active ? replacement.token : base),
        offset: start,
        content: source.slice(start, stop),
      });
      start = stop;
    }
    return result;
  }));
}

function validateExpressionTokens(tokens, label) {
  const invalid = tokens.find((token) => token.explanation?.some((part) => part.scopes
    .some((scope) => scope.scopeName === 'invalid.illegal.actions')));
  if (invalid) {
    throw new Error(`${label}: invalid GitHub Actions expression token ${JSON.stringify(invalid.content)}.`);
  }
}

function coloredTokens(context, source, lang, brackets, label, expressions = []) {
  const replacements = expressions.flatMap(({ start, end }) => {
    const tokens = context.codeToTokens(source.slice(start, end), {
      lang: actionsExpressionGrammar.name, theme: context.options.theme, includeExplanation: 'scopeName',
    }).tokens.flat();
    validateExpressionTokens(tokens, label);
    return tokens.map((token) => ({
      start: start + token.offset,
      end: start + token.offset + token.content.length,
      token,
    }));
  });
  let masked = source;
  for (const { start, end } of expressions.toReversed()) {
    // Expressions are evaluated before the host language; their quotes must not
    // terminate Bash/JavaScript strings while the host grammar is tokenized.
    masked = masked.slice(0, start)
      + masked.slice(start, end).replace(/[^\n\r]/g, ' ')
      + masked.slice(end);
  }
  let result;
  context.codeToHast(masked, {
    lang,
    theme: context.options.theme,
    mergeWhitespaces: false,
    transformers: [
      {
        tokens(tokens) {
          if (lang === actionsExpressionGrammar.name) validateExpressionTokens(tokens.flat(), label);
          return overlayTokens(source, tokens, replacements);
        },
      },
      brackets,
      { tokens(tokens) { result = tokens.flat(); } },
    ],
  });
  return result;
}

function* scalarCharacters(node) {
  const scalar = node.srcToken;
  const start = scalar.type === 'block-scalar'
    ? scalar.offset + scalar.props.reduce((length, token) => length + token.source.length, 0)
    : scalar.offset;
  const quoted = ['single-quoted-scalar', 'double-quoted-scalar'].includes(scalar.type);
  const end = scalar.source.length - (quoted ? 1 : 0);
  for (let index = quoted ? 1 : 0; index < end;) {
    let spelling = scalar.source[index];
    let content = spelling;
    if (scalar.type === 'single-quoted-scalar' && spelling === "'") {
      spelling = "''";
    } else if (scalar.type === 'double-quoted-scalar' && spelling === '\\') {
      spelling = scalar.source.slice(index).match(/^\\(?:x[\da-fA-F]{2}|u[\da-fA-F]{4}|U[\da-fA-F]{8}|\r?\n[ \t]*|.)/s)[0];
      content = CST.resolveAsScalar({
        type: 'double-quoted-scalar', offset: 0, indent: 0, source: `"${spelling}"`,
      }).value;
    }
    yield { start: start + index, end: start + index + spelling.length, content };
    index += spelling.length;
  }
}

function projectScalar(node, tokens, label) {
  const result = [];
  let offset = 0;
  let tokenIndex = 0;
  // The YAML parser owns folding, indentation and chomping. After decoding YAML
  // escapes, these only change whitespace: project visible characters onto the
  // parsed value, leaving YAML whitespace, quotes and headers untouched.
  for (const { start, end, content } of scalarCharacters(node)) {
    for (let index = 0; index < content.length; index += 1) {
      const char = content[index];
      if (/\s/.test(char)) continue;
      while (/\s/.test(node.value[offset] ?? '')) offset += 1;
      if (char !== node.value[offset]) {
        throw new Error(`${label}: cannot map embedded YAML scalar at offset ${node.range[0]}.`);
      }
      while (tokens[tokenIndex] && tokens[tokenIndex].offset + tokens[tokenIndex].content.length <= offset) {
        tokenIndex += 1;
      }
      const token = tokens[tokenIndex];
      if (token && token.offset <= offset) {
        const previous = result.at(-1);
        if (previous?.token === token && previous.end >= start) {
          previous.end = end;
        } else {
          result.push({ start, end, token });
        }
      }
      offset += 1;
    }
  }
  if (node.value.slice(offset).trim()) {
    throw new Error(`${label}: incomplete embedded YAML scalar mapping at offset ${node.range[0]}.`);
  }
  return result;
}

export function workflowHighlighting(source, label, brackets) {
  const document = parseDocument(source, { keepSourceTokens: true });
  if (document.errors.length) {
    throw new Error(`${label}: invalid GitHub Actions YAML: ${document.errors[0].message}`);
  }
  const languages = new Map();
  for (const step of stepMaps(document.contents)) {
    if (step.get('shell') === 'bash') languages.set(step.get('run', true), 'bash');
    if (/^actions\/github-script@[^\s]+$/i.test(step.get('uses') ?? '')) {
      const inputs = step.get('with', true);
      if (isMap(inputs)) languages.set(inputs.get('script', true), 'javascript');
    }
  }
  const scalars = [];
  visit(document, {
    Scalar(key, node) {
      if (key !== 'key' && isScalar(node) && typeof node.value === 'string') scalars.push(node);
    },
  });
  return {
    name: 'github-actions-embedded-languages',
    tokens(tokens) {
      const replacements = scalars.flatMap((node) => {
        const expressions = expressionRanges(node.value, label);
        const lang = languages.get(node);
        if (!lang && !expressions.length) return [];
        const colored = lang
          ? coloredTokens(this, node.value, lang, brackets, label, expressions)
          : expressions.flatMap(({ start, end }) => coloredTokens(
            this, node.value.slice(start, end), actionsExpressionGrammar.name, brackets, label,
          ).map((token) => ({ ...token, offset: token.offset + start })));
        return projectScalar(node, colored, label);
      }).sort((left, right) => left.start - right.start);
      return overlayTokens(source, tokens, replacements);
    },
  };
}
