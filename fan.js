/* Веер фото: нажатие на левое или правое фото листает, на центральное или верхнее - увеличивает */
(function () {
  var fan = document.querySelector('.fan');
  if (!fan) return;
  var items = [].slice.call(document.querySelectorAll('.work, .s-zoomable'));
  var cards = ['.fan__card--1', '.fan__card--2', '.fan__card--3', '.fan__card--wrap'].map(function (s) { return fan.querySelector(s); });
  if (items.length < 5 || cards.some(function (c) { return !c; })) return;

  function info(el) {
    var im = el.querySelector('img');
    var cap = el.getAttribute('data-cap') || (el.querySelector('figcaption') || {}).textContent || (im && im.alt) || '';
    return { src: el.getAttribute('data-full') || (im && im.getAttribute('src')) || '', cap: cap.trim() };
  }
  var pool = items.map(info);
  function base(s) { return (s || '').split('/').pop().replace('-s.', '.'); }
  var idx = cards.map(function (c, k) {
    var s = base(c.querySelector('img').getAttribute('src')), f = -1;
    pool.forEach(function (p, n) { if (f < 0 && base(p.src) === s) f = n; });
    return f >= 0 ? f : k;
  });
  var labels = ['Предыдущие фото', 'Открыть фото крупно', 'Следующие фото', 'Открыть фото крупно'];
  fan.removeAttribute('aria-hidden');
  cards.forEach(function (c, k) { c.setAttribute('role', 'button'); c.setAttribute('tabindex', '0'); c.setAttribute('aria-label', labels[k]); });
  var legend = fan.querySelector('.fan__legend');
  if (legend) legend.textContent = 'Нажмите на боковое фото - листать, на среднее - увеличить';

  function paint(k, i) {
    var c = cards[k], im = c.querySelector('img'), cap = c.querySelector('figcaption'), p = pool[i];
    var pre = new Image();
    pre.onload = function () {
      im.style.opacity = '0';
      setTimeout(function () { im.src = p.src; im.alt = p.cap; if (cap) cap.textContent = p.cap; im.style.opacity = ''; }, 150);
    };
    pre.src = p.src;
  }
  function step(d) {
    idx = idx.map(function (i) { return (i + d + pool.length) % pool.length; });
    idx.forEach(function (i, k) { paint(k, i); });
  }
  function act(k) {
    if (k === 0) step(-1);
    else if (k === 2) step(1);
    else items[idx[k]].click();
  }
  function slot(el) {
    var c = el.closest && el.closest('.fan__card');
    var k = cards.indexOf(c);
    if (k === 3 && parseFloat(getComputedStyle(c).opacity) < 0.5) k = 1;
    return k;
  }
  fan.addEventListener('click', function (e) { var k = slot(e.target); if (k >= 0) act(k); });
  fan.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var k = slot(e.target); if (k >= 0) { e.preventDefault(); act(k); }
  });
})();
