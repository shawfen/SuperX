'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const markdown = require('../extension/markdown-renderer.js');

// This fixture deliberately has no HTML parser. Model text must reach the DOM
// through safe element/text creation, and every HTML-string sink fails a test.
class FakeNode {
  constructor(ownerDocument, tagName = '', value = '') {
    this.ownerDocument = ownerDocument;
    this.tagName = tagName.toUpperCase();
    this.nodeType = tagName ? 1 : 3;
    this.value = value;
    this.childNodes = [];
    this.attributes = new Map();
    this.dataset = {};
    this.style = { setProperty() {} };
    this.classList = { add: (...names) => { this.className = [this.className || '', ...names].join(' ').trim(); } };
  }
  append(...nodes) {
    for (const node of nodes) {
      if (node.nodeType === 11) this.append(...node.childNodes);
      else {
        const child = typeof node === 'string' ? this.ownerDocument.createTextNode(node) : node;
        this.childNodes.push(child);
        child.parentNode = this;
      }
    }
  }
  appendChild(node) { this.append(node); return node; }
  replaceChildren(...nodes) { this.childNodes = []; this.value = ''; this.append(...nodes); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  get textContent() { return this.value + this.childNodes.map(node => node.textContent).join(''); }
  set textContent(value) { this.childNodes = []; this.value = String(value); }
  set innerHTML(value) { throw new Error('Unsafe innerHTML write: ' + value); }
  set outerHTML(value) { throw new Error('Unsafe outerHTML write: ' + value); }
  insertAdjacentHTML() { throw new Error('Unsafe insertAdjacentHTML write'); }
}

function fixture() {
  const created = [];
  const document = {
    createElement(tag) { const node = new FakeNode(document, tag); created.push(node); return node; },
    createTextNode(text) { return new FakeNode(document, '', String(text)); },
    createDocumentFragment() { const node = new FakeNode(document); node.nodeType = 11; return node; },
  };
  const target = document.createElement('div');
  return { target, created, render: text => markdown.render(target, text) };
}

function elements(node, tag) {
  const result = [];
  for (const child of node.childNodes) {
    if (child.nodeType === 1 && (!tag || child.tagName === tag.toUpperCase())) result.push(child);
    result.push(...elements(child, tag));
  }
  return result;
}

function destination(link) { return link.getAttribute('href') ?? link.href; }

test('headings, nested emphasis, quotes and ordered/unordered lists render as semantic DOM', () => {
  const page = fixture();
  page.render('# Meaning\n\n**A *useful* point** and ~~old wording~~.\n\n> A quoted explanation.\n\n3. First\n4. Second\n   - Nested');
  assert.equal(elements(page.target, 'h1')[0].textContent, 'Meaning');
  assert.equal(elements(page.target, 'strong')[0].textContent, 'A useful point');
  assert.equal(elements(page.target, 'em')[0].textContent, 'useful');
  assert.equal(elements(page.target, 'del')[0].textContent, 'old wording');
  assert.match(elements(page.target, 'blockquote')[0].textContent, /quoted explanation/);
  assert.equal(elements(page.target, 'ol').length, 1);
  assert.equal(String(elements(page.target, 'ol')[0].getAttribute('start') ?? elements(page.target, 'ol')[0].start), '3');
  assert.equal(elements(page.target, 'ul').length, 1);
  assert.equal(elements(page.target, 'li').length, 3);
  assert.doesNotMatch(page.target.textContent, /\*\*|~~/);
});

test('safe named links, reference links and nested citation markers keep only their intended destinations', () => {
  const page = fixture();
  page.render('[Useful **source**](https://example.com/report "Report") and [reference][docs]. Evidence[[1]](https://example.com/citation).\n\n[docs]: https://example.com/docs');
  const links = elements(page.target, 'a');
  assert.equal(links.length, 3);
  assert.deepEqual(links.map(destination), ['https://example.com/report', 'https://example.com/docs', 'https://example.com/citation']);
  assert.equal(links[0].textContent, 'Useful source');
  assert.equal(elements(links[0], 'strong').length, 1);
  assert.equal(links[1].textContent, 'reference');
  assert.match(links[2].textContent, /1/);
  for (const link of links) {
    assert.equal(link.getAttribute('target') ?? link.target, '_blank');
    assert.match(link.getAttribute('rel') ?? link.rel, /noopener/);
    assert.match(link.getAttribute('rel') ?? link.rel, /noreferrer/);
  }
  assert.doesNotMatch(page.target.textContent, /\[docs\]:/);
});

test('a bare video URL and adjacent Markdown citations retain separate destinations', () => {
  const page = fixture();
  const video = 'https://www.youtube.com/watch?v=v-wdfQyUSb0';
  const sources = ['https://x.com/i/status/2107095676123574689', 'https://x.com/Techslut/status/2082426339043226053'];
  page.render('An external YouTube source ' + video + '.[[1]](' + sources[0] + ')[[2]](' + sources[1] + ')');
  const links = elements(page.target, 'a');
  assert.deepEqual(links.map(destination), [video, ...sources]);
  assert.deepEqual(links.map(link => link.textContent), [video, '[1]', '[2]']);
  assert.equal(page.target.textContent, 'An external YouTube source ' + video + '.[1][2]');
});

test('adjacent named and reference links do not truncate legitimate URL brackets or parentheses', () => {
  const page = fixture();
  const wiki = 'https://example.com/wiki/Function_(mathematics)';
  const bracketed = 'https://[::1]/[section]?q=[value]';
  page.render(wiki + '[Source **notes**](https://example.com/notes)\n\n' +
    'https://example.com/report[[1]][citation]\n\n' + bracketed + '\n\n' +
    '[citation]: https://example.com/citation');
  const links = elements(page.target, 'a');
  assert.deepEqual(links.map(destination), [wiki, 'https://example.com/notes', 'https://example.com/report', 'https://example.com/citation', bracketed]);
  assert.equal(elements(links[1], 'strong')[0].textContent, 'notes');
  assert.equal(links[3].textContent, '[1]');
  assert.equal(links[4].textContent, bracketed);
});

test('URL boundaries preserve escaped brackets and keep adjacent unsafe links and images inert', () => {
  const page = fixture();
  const escaped = 'https://example.com/path\\[literal](https://example.com/inside)';
  page.render(escaped + '\n\nhttps://example.com/video.[JS](javascript:alert(1))' +
    '[AUTH](https://user:pass@example.com/path)![pixel](https://example.com/track.png)');
  assert.deepEqual(elements(page.target, 'a').map(destination), [escaped, 'https://example.com/video']);
  assert.match(page.target.textContent, /\.\[JS\]\(javascript:alert\(1\)\)/);
  assert.match(page.target.textContent, /\[AUTH\]\(https:\/\/user:pass@example\.com\/path\)/);
  assert.match(page.target.textContent, /!\[pixel\]\(https:\/\/example\.com\/track\.png\)/);
  assert.equal(elements(page.target, 'img').length, 0);
  assert.equal(elements(page.target, 'script').length, 0);
});

test('Chinese prose stays outside URLs while Unicode paths and balanced parentheses remain linked', () => {
  const page = fixture();
  page.render('链接（https://t.co/dZ1jiqrxx），可能是相关截图。回复有人表示“学到了”，这段是普通文字。\n\nhttps://例子.测试/说明/中文?q=值#段落；后文\n\nhttps://example.com/wiki/Function_(mathematics). [详情](https://example.com/wiki/Function_(mathematics))');
  const links = elements(page.target, 'a');
  assert.equal(links.length, 4);
  assert.deepEqual(links.map(destination), [
    'https://t.co/dZ1jiqrxx',
    'https://例子.测试/说明/中文?q=值#段落',
    'https://example.com/wiki/Function_(mathematics)',
    'https://example.com/wiki/Function_(mathematics)',
  ]);
  assert.equal(links[0].textContent, 'https://t.co/dZ1jiqrxx');
  assert.doesNotMatch(links.map(link => link.textContent).join(''), /可能|学到了|后文/);
  assert.match(page.target.textContent, /，可能是相关截图/);
  assert.match(page.target.textContent, /；后文/);
});

test('inline and fenced code remain literal text and never create anchors or executable elements', () => {
  const page = fixture();
  page.render('Use `<img src=x onerror=alert(1)> https://example.com` literally.\n\n```html\n<script>alert(1)</script>\n[link](https://example.com/private)\n```');
  assert.equal(elements(page.target, 'a').length, 0);
  assert.equal(elements(page.target, 'script').length, 0);
  assert.equal(elements(page.target, 'img').length, 0);
  assert.equal(elements(page.target, 'pre').length, 1);
  assert.equal(elements(page.target, 'code').length, 2);
  assert.match(elements(page.target, 'pre')[0].textContent, /<script>alert\(1\)<\/script>/);
  assert.match(elements(page.target, 'pre')[0].textContent, /\[link\]\(https:\/\/example\.com\/private\)/);
});

test('unsafe destinations, credentials and model HTML cannot become active content', () => {
  const page = fixture();
  page.render('[JS](javascript:alert(1)) [DATA](data:text/html,boom) [FILE](file:///etc/passwd) [MAIL](mailto:a@example.com) [AUTH](https://user:pass@example.com/path) [SAFE](https://example.com/safe)\n\n<img src="https://example.com/pixel" onerror="alert(1)"><script>alert(2)</script><iframe srcdoc="<script>alert(3)</script>"></iframe>\n\n![remote image](https://example.com/track.png)');
  const links = elements(page.target, 'a');
  assert.deepEqual(links.map(destination), ['https://example.com/safe']);
  assert.equal(elements(page.target, 'img').length, 0);
  assert.equal(elements(page.target, 'script').length, 0);
  assert.equal(elements(page.target, 'iframe').length, 0);
  assert.equal(elements(page.target, 'input').length, 0);
  for (const node of page.created) for (const [attribute] of node.attributes) {
    assert.doesNotMatch(attribute, /^on/i);
    assert.notEqual(attribute, 'src');
    assert.notEqual(attribute, 'srcdoc');
  }
  assert.match(page.target.textContent, /JS|javascript/);
  assert.match(page.target.textContent, /remote image/);
});

test('escaped syntax and entities become text, without reparsing decoded HTML or URL schemes', () => {
  const page = fixture();
  page.render('\\*literal\\* &amp; &#x4e2d;&#25991; &lt;script&gt;alert(1)&lt;/script&gt; &amp;lt;img&amp;gt;\n\n[Entity JS](javascript&#58;alert(1)) [Safe query](https://example.com/?a=1&amp;b=2)');
  assert.match(page.target.textContent, /\*literal\* & 中文 <script>alert\(1\)<\/script>/);
  assert.match(page.target.textContent, /&lt;img&gt;/);
  assert.equal(elements(page.target, 'script').length, 0);
  assert.equal(elements(page.target, 'em').length, 0);
  assert.deepEqual(elements(page.target, 'a').map(destination), ['https://example.com/?a=1&b=2']);
});

test('streaming prefixes are replaced by coherent final Markdown with no stale nodes or doubled links', () => {
  const page = fixture();
  for (const text of ['**Useful', '**Useful explanation**\n\nSee [source](https://example.com/re', '**Useful explanation**\n\nSee [source](https://example.com/report)，后文保持正文。']) page.render(text);
  assert.equal(elements(page.target, 'strong').length, 1);
  assert.equal(elements(page.target, 'strong')[0].textContent, 'Useful explanation');
  const links = elements(page.target, 'a');
  assert.equal(links.length, 1);
  assert.equal(destination(links[0]), 'https://example.com/report');
  assert.equal(links[0].textContent, 'source');
  assert.doesNotMatch(page.target.textContent, /\*\*|\[source\]|example\.com\/re/);
  assert.match(page.target.textContent, /后文保持正文/);
  page.render('');
  assert.equal(page.target.textContent, '');
  assert.equal(elements(page.target).length, 0);
});

test('GFM tables and task lists stay semantic and readable without introducing interactive controls', () => {
  const page = fixture();
  page.render('| Claim | Evidence |\n| :--- | ---: |\n| **Supported** | [Report](https://example.com/report) |\n| Pending | Not found |\n\n- [x] Read the post\n- [ ] Check the source');
  assert.equal(elements(page.target, 'table').length, 1);
  assert.equal(elements(page.target, 'thead').length, 1);
  assert.equal(elements(page.target, 'tbody').length, 1);
  assert.equal(elements(page.target, 'th').length, 2);
  assert.equal(elements(page.target, 'td').length, 4);
  assert.equal(elements(page.target, 'strong')[0].textContent, 'Supported');
  assert.deepEqual(elements(page.target, 'a').map(destination), ['https://example.com/report']);
  assert.equal(elements(page.target, 'li').length, 2);
  assert.match(page.target.textContent, /Read the post/);
  assert.match(page.target.textContent, /Check the source/);
  assert.equal(elements(page.target, 'input').length, 0);
  assert.equal(elements(page.target, 'button').length, 0);
});

test('oversized, deeply nested and malformed output stays bounded and falls back to inert readable text', () => {
  const limit = markdown.LIMITS.text;
  assert.equal(limit, 30000);
  for (const text of [
    'A'.repeat(limit) + '\n<script>TRUNCATED</script>',
    '> '.repeat(markdown.LIMITS.depth + 10) + '[source](javascript:alert(1))',
    '*'.repeat(limit) + '<iframe srcdoc=boom>',
    '[unfinished](https://example.com/'.repeat(400),
  ]) {
    const page = fixture();
    assert.doesNotThrow(() => page.render(text));
    assert.ok(page.target.textContent.length <= limit);
    assert.ok(elements(page.target).length <= markdown.LIMITS.nodes);
    assert.equal(elements(page.target, 'script').length, 0);
    assert.equal(elements(page.target, 'iframe').length, 0);
    for (const link of elements(page.target, 'a')) assert.match(destination(link), /^https?:\/\//);
    assert.doesNotMatch(page.target.textContent, /TRUNCATED|srcdoc=boom/);
  }
  const deep = fixture();
  const deeplyNested = '> '.repeat(markdown.LIMITS.depth + 10) + 'Readable end';
  deep.render(deeplyNested);
  assert.match(deep.target.textContent, /Readable end/);
});

test('a resource-heavy rendered chunk falls back atomically rather than leaving partial formatting', () => {
  const page = fixture();
  page.render('**Previous completed answer** [source](https://example.com/report)');
  assert.equal(elements(page.target, 'strong').length, 1);
  const crowded = '*a* '.repeat(9000).slice(0, markdown.LIMITS.text);
  page.render(crowded);
  assert.equal(page.target.textContent, crowded);
  assert.equal(elements(page.target).length, 0);
  assert.doesNotMatch(page.target.textContent, /Previous completed answer/);
});
