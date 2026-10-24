(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const STAR = 'polygon(50% 0,61% 39%,100% 50%,61% 61%,50% 100%,39% 61%,0 50%,39% 39%)';

  /* tiny seeded random so the block frame looks the same every visit */
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  /* clock */
  const fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' });
  const tick = () => $$('[data-clock]').forEach(e => e.textContent = fmt.format(new Date()) + ' PHT');
  tick(); setInterval(tick, 15000);

  /* name letters pop in one by one */
  let delay = 0.35;
  $$('#name .row').forEach(row => {
    const txt = row.textContent; row.textContent = '';
    [...txt].forEach(ch => {
      const s = document.createElement('span'); s.className = 'l'; s.textContent = ch === ' ' ? ' ' : ch;
      s.style.animationDelay = delay.toFixed(2) + 's'; delay += 0.05; row.appendChild(s);
    });
  });

  /* starbursts behind chapter titles */
  const burst = (() => { const pts = []; for (let i = 0; i < 32; i++) { const a = i / 32 * Math.PI * 2, r = i % 2 ? 36 : 50; pts.push(`${(50 + r * Math.cos(a)).toFixed(1)}% ${(50 + r * Math.sin(a)).toFixed(1)}%`); } return `polygon(${pts.join(',')})`; })();
  $$('.burst').forEach(b => b.style.clipPath = burst);

  /* landing: pixel-block frame */
  const blocks = $('#blocks');
  const SKY = ['#ffffff', '#e4f0ff', '#cfe2ff', '#a9cbff', '#7fb0ff', '#5a96ff'];
  const GRASS = ['#d6f36a', '#b9e43c', '#9fd12a', '#7fb81f', '#5f9a18'];
  function buildBlocks() {
    blocks.innerHTML = '';
    seed = 7;
    const W = blocks.clientWidth, H = blocks.clientHeight;
    const ts = W < 600 ? 26 : W < 1000 ? 36 : 44, step = ts + 3;
    blocks.style.setProperty('--ts', ts + 'px');
    const cols = Math.ceil(W / step), rows = Math.ceil(H / step);
    const frag = document.createDocumentFragment();
    const add = (c, r, color, d) => {
      const t = document.createElement('i'); t.className = 'tile';
      t.style.left = (c * step) + 'px'; t.style.top = (r * step) + 'px';
      t.style.setProperty('--c', color); t.style.setProperty('--dl', d.toFixed(2) + 's');
      frag.appendChild(t);
    };
    const sideW = W < 600 ? 1 : 2;
    let topH = 2, botH = 3;
    for (let c = 0; c < cols; c++) {
      topH = Math.max(1, Math.min(3, topH + (rnd() < .35 ? (rnd() < .5 ? -1 : 1) : 0)));
      botH = Math.max(2, Math.min(4, botH + (rnd() < .35 ? (rnd() < .5 ? -1 : 1) : 0)));
      const edge = c < sideW || c >= cols - sideW;
      const tH = edge ? Math.ceil(rows * .45) : topH;
      const bH = edge ? Math.ceil(rows * .3) : botH;
      for (let r = 0; r < tH; r++) add(c, r, SKY[Math.min(SKY.length - 1, Math.floor(rnd() * 3 + r))], .05 + r * .06 + c * .012);
      for (let r = 0; r < bH; r++) add(c, rows - 1 - r, GRASS[Math.min(GRASS.length - 1, Math.floor(rnd() * 2 + r))], .2 + r * .06 + c * .012);
    }
    // a few twinkles
    const tw = [['#ffd84d', .08, .2], ['#c8f04a', .9, .32], ['#ff8fd0', .82, .7], ['#ffffff', .14, .74], ['#ffd84d', .52, .1]];
    tw.forEach(([c, x, y], i) => {
      const s = document.createElement('i'); s.className = 'twinkle';
      s.style.cssText = `left:${x * 100}%;top:${y * 100}%;--c:${c};--s:${18 + i * 4}px;animation-delay:${i * .3}s`;
      frag.appendChild(s);
    });
    blocks.appendChild(frag);
  }
  buildBlocks();
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(buildBlocks, 200); });

  /* stars for the evening */
  const stars = $('#stars');
  for (let i = 0; i < 46; i++) {
    const s = document.createElement('i');
    s.style.cssText = `left:${(rnd() * 100).toFixed(1)}%;top:${(rnd() * 75).toFixed(1)}%;--s:${(4 + rnd() * 10).toFixed(0)}px;--d:${(1.2 + rnd() * 2.5).toFixed(1)}s;animation-delay:${(rnd() * 2).toFixed(1)}s`;
    stars.appendChild(s);
  }

  /* the sky over one day: morning → noon → afternoon → sunset → night */
  const STOPS = [
    { p: 0.00, top: [90, 160, 255], bot: [214, 234, 255], sun: [255, 216, 77] },
    { p: 0.30, top: [30, 110, 255], bot: [160, 210, 255], sun: [255, 224, 90] },
    { p: 0.58, top: [64, 128, 245], bot: [255, 220, 176], sun: [255, 196, 80] },
    { p: 0.80, top: [84, 70, 190], bot: [255, 146, 118], sun: [255, 130, 70] },
    { p: 0.94, top: [16, 26, 84], bot: [52, 56, 150], sun: [255, 110, 60] },
    { p: 1.00, top: [10, 18, 64], bot: [40, 44, 128], sun: [255, 110, 60] },
  ];
  const ease = t => t * t * (3 - 2 * t);
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const sun = $('#sun'), hud = $('#hud'), hudBar = $('.bar i', hud);
  function paint() {
    const max = root.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    let i = 0; while (i < STOPS.length - 2 && p > STOPS[i + 1].p) i++;
    const a = STOPS[i], b = STOPS[i + 1], t = ease(Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p))));
    root.style.setProperty('--sky-top', `rgb(${mix(a.top, b.top, t)})`);
    root.style.setProperty('--sky-bot', `rgb(${mix(a.bot, b.bot, t)})`);
    root.style.setProperty('--sun-c', `rgb(${mix(a.sun, b.sun, t)})`);
    const night = ease(Math.min(1, Math.max(0, (p - .78) / .17)));
    root.style.setProperty('--night', night.toFixed(3));
    // the sun rises on the left, peaks mid-page, sets on the right
    const sp = Math.min(1, p / .9);
    const x = innerWidth * (.1 + .8 * sp), y = innerHeight * (.62 - Math.sin(Math.PI * sp) * .5 + sp * sp * .35);
    sun.style.transform = `translate3d(${x}px,${y}px,0)`;
    hudBar.parentElement.style.setProperty('--p', p.toFixed(3));
    hud.classList.toggle('off', scrollY < innerHeight * .6);
    hud.classList.toggle('is-night', night > .5);
  }
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { paint(); ticking = false; }); } }, { passive: true });
  addEventListener('resize', paint); paint();


  /* viewer: certificates and project screenshots open in the same pop-up */
  (() => {
    const dlg = $('#viewer'), img = $('#viewer-img'), empty = $('#viewer-empty'), cap = $('#viewer-cap');
    let items = [], cur = 0;
    const show = i => {
      cur = (i + items.length) % items.length; const it = items[cur];
      $('#viewer-title').textContent = it.title;
      $('#viewer-count').textContent = `${cur + 1} / ${items.length}`;
      cap.textContent = it.caption || ''; cap.hidden = !it.caption;
      $('#viewer-path').textContent = it.src.replace(/^certs\//, '');
      img.hidden = false; empty.hidden = true; img.alt = it.alt;
      img.onerror = () => { img.hidden = true; empty.hidden = !it.isCert; };
      img.src = it.src;
      const many = items.length > 1;
      $('#viewer-prev').style.visibility = $('#viewer-next').style.visibility = many ? 'visible' : 'hidden';
    };
    // the open dialog sits above the page, so carry the sparkle cursor into it
    const cursorEl = $('#cursor');
    const open = (list, i) => { items = list; show(i); if (cursorEl) dlg.appendChild(cursorEl); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); };
    dlg.addEventListener('close', () => { if (cursorEl) document.body.insertBefore(cursorEl, document.body.firstChild); });
    const close = () => { dlg.close ? dlg.close() : dlg.removeAttribute('open'); };
    const certs = $$('[data-cert]').map(c => ({ src: c.dataset.cert, title: c.dataset.title, alt: c.dataset.title + ' certificate', isCert: true }));
    $$('[data-cert]').forEach((c, i) => {
      c.addEventListener('click', () => open(certs, i));
      c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(certs, i); } });
    });
    $$('[data-shots]').forEach(b => {
      const list = JSON.parse(b.dataset.shots).map(([src, label]) => ({ src, title: b.dataset.name, caption: label, alt: `${b.dataset.name}: ${label}` }));
      b.addEventListener('click', () => open(list, 0));
    });
    $('#viewer-x').addEventListener('click', close);
    $('#viewer-prev').addEventListener('click', () => show(cur - 1));
    $('#viewer-next').addEventListener('click', () => show(cur + 1));
    dlg.addEventListener('click', e => { if (e.target === dlg) close(); });
    dlg.addEventListener('keydown', e => { if (items.length > 1) { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); } });
  })();

  /* HUD shows which part of the day you're in */
  const hudText = $('#hud-text');
  const io1 = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { const txt = `${e.target.dataset.time} · ${e.target.dataset.name}`; if (hudText.textContent !== txt) { hudText.textContent = txt; hudText.classList.remove('tick'); void hudText.offsetWidth; hudText.classList.add('tick'); } }
  }), { rootMargin: '-40% 0px -55% 0px' });
  $$('.chapter').forEach(s => io1.observe(s));

  /* number every child so CSS can stagger it */
  const index = (sel, root = document) => $$(sel, root).forEach((el, i) => el.style.setProperty('--i', i));
  $$('.ch-title').forEach(h => { // split titles into words → letters
    const words = h.textContent.trim().split(/\s+/); h.textContent = ''; let i = 0;
    words.forEach((w, wi) => {
      const wd = document.createElement('span'); wd.className = 'wd';
      [...w].forEach(c => { const l = document.createElement('span'); l.className = 'tl'; l.textContent = c; l.style.setProperty('--i', i++); wd.appendChild(l); });
      h.appendChild(wd); if (wi < words.length - 1) h.appendChild(document.createTextNode(' '));
    });
  });
  $$('.hello-card').forEach(c => { index('p', c); index('.stat', c); index('.edu li', c); });
  $$('.select').forEach(c => { index('.group h3', c); index('.chip', c); });
  $$('.win').forEach(c => { index('.art span', c); index('.win-body > *', c); });
  $$('.log').forEach(c => index('li', c));
  $$('.certs .cert').forEach((c, i) => { c.style.transitionDelay = (i * 90) + 'ms'; c.querySelectorAll('.cert-logo,.pill').forEach(x => x.style.animationDelay = (0.15 + i * 0.09 + (x.classList.contains('pill') ? .45 : 0)) + 's'); });
  function onGo(el) { // numbers count up from zero
    if (reduce) return;
    $$('.stat .n', el).forEach((n, i) => {
      const end = +n.textContent; if (!end) return;
      const t0 = performance.now() + 450 + i * 90;
      const step = now => { const f = Math.min(1, Math.max(0, (now - t0) / 900)); n.textContent = Math.round(end * (1 - Math.pow(1 - f, 3))); if (f < 1) requestAnimationFrame(step); };
      n.textContent = '0'; requestAnimationFrame(step);
    });
  }

  /* stickers pop in as you reach them */
  if (!reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.remove('pre'); e.target.classList.add('in-view'); io.unobserve(e.target); onGo(e.target); }
    }), { rootMargin: '0px 0px -10% 0px' });
    let n = 0;
    $$('[data-pop]').forEach(el => {
      if (el.getBoundingClientRect().top > innerHeight) {
        el.classList.add('pre'); el.style.transitionDelay = ((n++ % 3) * 90) + 'ms';
      }
      io.observe(el);
    });
  }

  /* copy email */
  $('#copy').addEventListener('click', e => {
    const btn = e.currentTarget, done = m => { btn.textContent = m; setTimeout(() => btn.textContent = 'copy', 1800); };
    const fallback = () => { const r = document.createRange(); r.selectNodeContents($('#mail')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); done('selected'); };
    try { navigator.clipboard.writeText('sofiardmesa@gmail.com').then(() => done('copied ✦'), fallback); } catch (err) { fallback(); }
  });

  /* sparkle cursor */
  if (fine) {
    root.classList.add('cursor-on');
    const cur = $('#cursor'), lbl = $('#cursor-lbl');
    let x = -100, y = -100, cx = -100, cy = -100, seen = false;
    addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; if (!seen) { cx = x; cy = y; seen = true; } cur.classList.remove('is-hidden'); }, { passive: true });
    root.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor], a, button');
      cur.classList.toggle('is-link', !!t);
      cur.classList.toggle('is-view', !!(t && t.dataset.cursor));
      if (t && t.dataset.cursor) lbl.textContent = t.dataset.cursor;
    });
    const loop = () => {
      const k = reduce ? 1 : .35;
      cx += (x - cx) * k; cy += (y - cy) * k;
      cur.style.transform = `translate3d(${cx}px,${cy}px,0)`;
      requestAnimationFrame(loop);
    };
    loop();
  }
})();