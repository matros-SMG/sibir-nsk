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

  var busy = false, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function warm() { pool.forEach(function (p) { new Image().src = p.src; }); }
  if (document.readyState === 'complete') setTimeout(warm, 300); else addEventListener('load', function () { setTimeout(warm, 300); });

  /* Плавная смена: старое фото уезжает, новое заезжает с той же стороны (dir = 1 листаем вперёд, -1 назад) */
  function slide(k, i, dir, delay) {
    var c = cards[k], old = c.querySelector('img'), cap = c.querySelector('figcaption'), p = pool[i];
    var nu = old.cloneNode(false);
    nu.removeAttribute('loading'); nu.src = p.src; nu.alt = p.cap;
    [old, nu].forEach(function (im) { im.style.position = 'absolute'; im.style.left = '0'; im.style.top = '0'; im.style.transition = 'none'; });
    c.insertBefore(nu, old.nextSibling);
    var opt = { duration: 520, delay: delay, easing: 'cubic-bezier(.45,.05,.2,1)', fill: 'both' };
    if (cap) setTimeout(function () { cap.textContent = p.cap; }, delay + 220);
    if (reduce || !old.animate) { old.remove(); return Promise.resolve(); }
    old.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(' + (-dir * 100) + '%)' }], opt);
    var a = nu.animate([{ transform: 'translateX(' + (dir * 100) + '%)' }, { transform: 'translateX(0)' }], opt);
    return a.finished.then(function () { old.remove(); nu.style.position = ''; nu.style.left = ''; nu.style.top = ''; nu.style.transition = ''; nu.getAnimations().forEach(function (x) { x.cancel(); }); }).catch(function () {});
  }
  function step(d) {
    if (busy) return;
    busy = true;
    idx = idx.map(function (i) { return (i + d + pool.length) % pool.length; });
    var order = d > 0 ? [0, 1, 2, 3] : [3, 2, 1, 0];
    Promise.all(idx.map(function (i, k) {
      var pre = new Image(), n = order.indexOf(k);
      return new Promise(function (res) { pre.onload = pre.onerror = res; pre.src = pool[i].src; }).then(function () { return slide(k, i, d, n * 50); });
    })).then(function () { busy = false; });
    setTimeout(function () {   /* страховка: если вкладка была в фоне и анимация не дошла до конца */
      cards.forEach(function (c) { var im = c.querySelectorAll('img'); for (var n = 0; n < im.length - 1; n++) im[n].remove(); var last = im[im.length - 1]; last.getAnimations().forEach(function (x) { x.cancel(); }); last.style.position = ''; last.style.left = ''; last.style.top = ''; });
      busy = false;
    }, 1400);
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
