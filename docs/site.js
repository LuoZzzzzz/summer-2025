/* site.js: builds the contents list in the right-hand margin from a page's
   section headings (its h2s, or its h3s if it has fewer than two h2s). On a
   page divided into parts by further h1s (an index), the parts are listed too,
   with their sections under them. Pages that already have a contents list, or
   that set data-toc="off" on their <article>, are left alone. Headings without
   an id get section-1, section-2, ... (parts: part-1, ...) so links keep working. */
(function () {
  var article = document.querySelector('main.page > article');
  if (!article || article.querySelector('.toc') || article.getAttribute('data-toc') === 'off') return;
  var heads = article.querySelectorAll(':scope > h2');
  if (heads.length < 2) heads = article.querySelectorAll(':scope > h3');
  if (article.querySelector(':scope > h1')) heads = article.querySelectorAll(':scope > h1, :scope > h2');
  if (heads.length < 2) return;
  var nPart = 0, nSec = 0;

  var nav = document.createElement('nav');
  nav.className = 'toc plain';
  nav.setAttribute('aria-label', 'Sections of this page');
  var head = document.createElement('p');
  head.className = 'toc-head';
  head.textContent = 'Contents';
  var ol = document.createElement('ol');
  heads.forEach(function (h) {
    var part = h.tagName === 'H1';
    if (!h.id) h.id = part ? 'part-' + (++nPart) : 'section-' + (++nSec);
    var title = document.createElement('span');
    title.className = 'ttl';
    title.innerHTML = h.innerHTML;
    // a heading's own links and ids must not be copied into the list
    title.querySelectorAll('a').forEach(function (a) { a.replaceWith.apply(a, a.childNodes); });
    title.querySelectorAll('[id]').forEach(function (el) { el.removeAttribute('id'); });
    var a = document.createElement('a');
    a.href = '#' + h.id;
    a.appendChild(title);
    var li = document.createElement('li');
    if (part) li.className = 'part';
    li.appendChild(a);
    ol.appendChild(li);
  });
  nav.appendChild(head);
  nav.appendChild(ol);
  var chapHead = article.querySelector(':scope > .chap-head');
  article.insertBefore(nav, chapHead ? chapHead.nextSibling : article.firstChild);
})();

/* MathJax on narrow screens, as the Lie group memos do for their equations: a display
   that is too wide is shrunk (to 75% at most), and whatever still does not fit scrolls.
   An inline formula wider than its paragraph scrolls sideways on its own, at any width,
   instead of widening the page. */
(function () {
  function fit() {
    var narrow = window.matchMedia('(max-width: 600px)').matches;
    document.querySelectorAll('article mjx-container').forEach(function (m) {
      if (m.closest('.toc')) return;
      if (m.getAttribute('display') === 'true') {
        if (m.dataset.fs === undefined) m.dataset.fs = m.style.fontSize;   // MathJax's own scale
        m.style.fontSize = m.dataset.fs;
        if (!narrow) return;
        var r = m.clientWidth / m.scrollWidth;
        if (r < 1) m.style.fontSize = 'calc(' + (m.dataset.fs || '100%') + ' * ' +
                                      Math.max(0.75, r * 0.985).toFixed(3) + ')';
      } else {
        m.classList.remove('wide');
        var host = m.parentElement;
        while (host && getComputedStyle(host).display.indexOf('inline') === 0) host = host.parentElement;
        if (host && m.getBoundingClientRect().width > host.clientWidth) m.classList.add('wide');
      }
    });
  }
  // punctuation straight after an inline formula stays on the formula's line
  function glue() {
    document.querySelectorAll('article mjx-container:not([display="true"])').forEach(function (m) {
      var t = m.nextSibling, p = t && t.nodeType === 3 && t.data.match(/^[.,;:!?)\]]+/);
      if (!p || m.parentNode.classList.contains('nowrap')) return;
      var span = document.createElement('span');
      span.className = 'nowrap';
      m.parentNode.insertBefore(span, m);
      span.appendChild(m);
      span.appendChild(document.createTextNode(p[0]));
      t.data = t.data.slice(p[0].length);
    });
  }
  window.addEventListener('load', function () {
    var ready = window.MathJax && MathJax.startup && MathJax.startup.promise;
    (ready || Promise.resolve()).then(function () { glue(); fit(); });
  });
  window.addEventListener('resize', fit);
})();
