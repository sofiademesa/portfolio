(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode */ } }
  };
  root.classList.add('js');
  if (!reduce) root.classList.add('motion');

  /* ───── boot screen (once per visit, click to skip) ───── */
  let bootDelay = 0;
  if (!reduce && !store.get('sofiaos-booted') && !location.hash) {
    bootDelay = 1.5;
    const boot = document.createElement('div');
    boot.className = 'boot';
    boot.setAttribute('aria-hidden', 'true');
    boot.innerHTML = '<div class="boot-in"><svg><use href="#i-spark"/></svg><div class="boot-name">SofiaOS<sup>2026</sup></div><div class="boot-ed">portfolio edition</div><div class="boot-bar"><i><b></b></i></div><div class="boot-skip">click to skip</div></div>';
    document.body.appendChild(boot);
    const done = () => { boot.classList.add('out'); setTimeout(() => boot.remove(), 500); };
    boot.addEventListener('click', done);
    setTimeout(done, 1600);
    store.set('sofiaos-booted', '1');
  }
  root.style.setProperty('--boot', bootDelay + 's');

  /* ───── clock (Philippine time) ───── */
  const fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' });
  const tick = () => $$('[data-clock]').forEach(e => e.textContent = fmt.format(new Date()) + (e.classList.contains('tray-clock') ? '' : ' PHT'));
  tick(); setInterval(tick, 15000);

  /* ───── split text into letters (keeps <wbr> line-break hints) ───── */
  function splitLetters(el, cls, start = 0, step = 1) {
    let i = start;
    [...el.childNodes].forEach(node => {
      if (node.nodeType !== 3) return;
      // each run of text stays together as one word, so lines only break at <wbr>
      const frag = document.createElement('span'); frag.className = 'wd';
      [...node.textContent].forEach(ch => {
        const s = document.createElement('span');
        s.className = cls; s.textContent = ch === ' ' ? ' ' : ch;
        s.style.setProperty('--i', i); i += step; frag.appendChild(s);
      });
      node.replaceWith(frag);
    });
    return i;
  }

  /* ───── hero name: letters pop in, then wave + glitch now and then ───── */
  const name = $('.name');
  let n = 0;
  $$('.name > span').forEach(row => { n = splitLetters(row, 'l', n); });
  if (!reduce && name) {
    const wave = () => { name.classList.remove('wave'); void name.offsetWidth; name.classList.add('wave'); };
    const glitch = () => { name.classList.add('glitch'); setTimeout(() => name.classList.remove('glitch'), 380); };
    setTimeout(() => { wave(); setInterval(wave, 7000); }, (bootDelay + 2.6) * 1000);
    setTimeout(() => setInterval(() => { if (Math.random() < .55) glitch(); }, 3400), (bootDelay + 3.5) * 1000);
    $$('.name .l').forEach(l => l.addEventListener('pointerenter', () => { l.classList.remove('jump'); void l.offsetWidth; l.classList.add('jump'); }));
  }

  /* ───── section titles: letters drop in when you reach them ───── */
  $$('.sec-title').forEach(h => splitLetters(h, 'ch'));

  /* ───── stagger indexes for hero pieces + lists ───── */
  const index = (sel, r = document) => $$(sel, r).forEach((el, i) => el.style.setProperty('--i', i));
  index('.dicon'); index('.hero-cta .gbtn');
  $$('.win').forEach(w => { index('.feat li', w); index('.chip', w); index('.stack span', w); });
  index('.ids .id'); index('.certs .cert'); index('.groups .group');
  $$('.strip').forEach(s => index('.ev', s));
  index('.chat > *');

  /* ───── terminal line types itself ───── */
  const typed = $('#typed');
  if (typed && !reduce) {
    const full = typed.textContent; typed.textContent = ''; let i = 0;
    const step = () => { typed.textContent = full.slice(0, ++i); if (i < full.length) setTimeout(step, 55 + Math.random() * 60); };
    setTimeout(step, (bootDelay + .5) * 1000);
  }

  /* ───── kiosk keyboard ───── */
  const kb = $('#kboard');
  if (kb) {
    const frag = document.createDocumentFragment(), keys = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 11; c++) {
      const k = document.createElement('i');
      if (c === 10) k.className = ['y', 'r', 'g', ''][r];
      frag.appendChild(k); if (c < 10) keys.push(k);
    }
    kb.appendChild(frag);
    if (!reduce) setInterval(() => { // someone's typing on it
      const k = keys[Math.floor(Math.random() * keys.length)];
      k.classList.add('on'); setTimeout(() => k.classList.remove('on'), 160);
    }, 240);
  }

  /* ───── twinkling pixel stars on the wallpaper ───── */
  const ds = $('#deskstars');
  if (ds) {
    let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const cols = ['#ffffff', '#b8ef3c', '#ffe45c', '#ff9fd8', '#9fdcff'];
    for (let i = 0; i < 22; i++) {
      const s = document.createElement('i');
      s.style.cssText = `left:${(rnd() * 100).toFixed(1)}%;top:${(rnd() * 60).toFixed(1)}%;--s:${(6 + rnd() * 10).toFixed(0)}px;--c:${cols[i % cols.length]};--d:${(2 + rnd() * 3).toFixed(1)}s;animation-delay:-${(rnd() * 4).toFixed(1)}s`;
      ds.appendChild(s);
    }
  }

  /* ───── hero parallax: stickers + kiosk lean toward the cursor ───── */
  const hero = $('.hero');
  if (fine && !reduce && hero) {
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => {
      cx += (tx - cx) * .08; cy += (ty - cy) * .08;
      hero.style.setProperty('--mx', cx.toFixed(3)); hero.style.setProperty('--my', cy.toFixed(3));
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > .001 ? requestAnimationFrame(loop) : 0;
    };
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - .5; ty = (e.clientY - r.top) / r.height - .5;
      if (!raf) raf = requestAnimationFrame(loop);
    });
    hero.addEventListener('pointerleave', () => { tx = ty = 0; if (!raf) raf = requestAnimationFrame(loop); });
  }

  /* ───── sparkle trail behind the cursor ───── */
  if (fine && !reduce) {
    const cols = ['#b8ef3c', '#ff9fd8', '#9fdcff', '#ffe45c'];
    let last = 0, k = 0;
    addEventListener('pointermove', e => {
      const now = performance.now(); if (now - last < 45) return; last = now;
      if (e.target.closest && e.target.closest('dialog, .startmenu')) return;
      const s = document.createElement('i');
      s.className = 'trail';
      s.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;--c:${cols[k++ % cols.length]};--dx:${(Math.random() * 30 - 15).toFixed(0)}px;--sz:${(8 + Math.random() * 8).toFixed(0)}px`;
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 750);
    }, { passive: true });
  }

  /* ───── taskbar: one button per section, the current one stays pressed ───── */
  const tasks = $('#tasks');
  const secs = $$('.sec');
  secs.forEach(s => {
    const a = document.createElement('a');
    a.className = 'task'; a.href = '#' + s.id; a.dataset.for = s.id;
    a.innerHTML = `<svg aria-hidden="true"><use href="#${s.dataset.ico}"/></svg><span>${s.dataset.name}</span>`;
    tasks.appendChild(a);
  });
  const setTask = id => $$('.task', tasks).forEach(t => t.classList.toggle('on', t.dataset.for === id));
  const io1 = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setTask(e.target.id); }), { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(s => io1.observe(s));

  /* scroll progress line on top of the taskbar */
  const bar = $('.taskbar');
  let sTick = false;
  const onScroll = () => {
    const max = root.scrollHeight - innerHeight;
    bar.style.setProperty('--sp', max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0);
    if (scrollY < innerHeight * .4) setTask('');
    sTick = false;
  };
  addEventListener('scroll', () => { if (!sTick) { sTick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ───── start menu ───── */
  const startBtn = $('#start'), menu = $('#startmenu');
  const setMenu = open => { menu.hidden = !open; startBtn.setAttribute('aria-expanded', String(open)); if (open) { const f = $('a', menu); f && f.focus({ preventScroll: true }); } };
  startBtn.addEventListener('click', e => { e.stopPropagation(); setMenu(menu.hidden); });
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('click', e => { if (!menu.hidden && !menu.contains(e.target)) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); startBtn.focus(); } });

  /* ───── tech stack count ───── */
  const cc = $('#chip-count'); if (cc) cc.textContent = `${$$('.chip').length} components installed`;

  /* ───── viewer: certificates, project screenshots and event photos ───── */
  const tip = $('#tip');
  function hideTip() { tip.classList.remove('on'); }
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
      img.classList.remove('swap'); void img.offsetWidth; img.classList.add('swap');
      img.src = it.src;
      const many = items.length > 1;
      $('#viewer-prev').style.visibility = $('#viewer-next').style.visibility = many ? 'visible' : 'hidden';
    };
    const open = (list, i) => { items = list; show(i); hideTip(); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); };
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

    /* event photos: every leadership / seminar item has a data-photo slot.
       Items only light up once their photo actually exists in /events.
       Desktop: a preview window follows the cursor. Touch: tap opens the viewer. */
    const peek = $('#peek'), peekImg = $('#peek-img'), peekCap = $('#peek-cap'), peekN = $('#peek-n');
    const activate = (li, srcs) => {
      const title = li.dataset.title, date = li.dataset.meta || '', n = srcs.length;
      li.classList.add('has-photo');
      li.tabIndex = 0; li.setAttribute('role', 'button');
      li.setAttribute('aria-label', `View ${n > 1 ? n + ' photos' : 'photo'}: ${title}`);
      const cam = document.createElement('span'); cam.className = 'cam'; cam.setAttribute('aria-hidden', 'true');
      cam.innerHTML = `<svg><use href="#i-cam"/></svg><b>${n > 1 ? n : 'pic'}</b>`; li.appendChild(cam);
      const list = srcs.map((src, k) => ({ src, title: n > 1 ? 'event photos' : 'event photo', caption: [title, date, n > 1 ? `photo ${k + 1} of ${n}` : ''].filter(Boolean).join(' · '), alt: `${title}, photo ${k + 1}` }));
      const go = () => { hidePeek(); open(list, 0); };
      li.addEventListener('click', go);
      li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      if (fine) {
        li.addEventListener('pointerenter', e => showPeek(srcs, title, e));
        li.addEventListener('pointermove', movePeek);
        li.addEventListener('pointerleave', hidePeek);
      }
    };
    const probe = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; probe.unobserve(e.target);
      $$('[data-photo]', e.target).forEach(li => {
        const srcs = li.dataset.photo.split(',').map(s => s.trim()).filter(Boolean);
        if (!srcs.length) return;
        const test = new Image(); test.onload = () => activate(li, srcs); test.src = srcs[0];
      });
    }), { rootMargin: '600px 0px' });
    $$('.ids, .strip').forEach(l => probe.observe(l));

    let peekTimer = 0, peekOn = false;
    function showPeek(srcs, title, e) {
      clearInterval(peekTimer);
      let k = 0;
      peekImg.src = srcs[0]; peekImg.alt = '';
      peekCap.textContent = title;
      peekN.hidden = srcs.length < 2; peekN.textContent = `1/${srcs.length}`;
      peek.style.setProperty('--tilt', (Math.random() * 4 - 2).toFixed(1) + 'deg');
      if (srcs.length > 1 && !reduce) peekTimer = setInterval(() => {
        k = (k + 1) % srcs.length; peekImg.classList.remove('swap'); void peekImg.offsetWidth;
        peekImg.src = srcs[k]; peekImg.classList.add('swap'); peekN.textContent = `${k + 1}/${srcs.length}`;
      }, 1400);
      movePeek(e); peekOn = true; peek.classList.add('on');
    }
    function movePeek(e) {
      const w = peek.offsetWidth, h = peek.offsetHeight, gap = 24;
      let x = e.clientX + gap, ox = '0%';
      if (x + w > innerWidth - 12) { x = e.clientX - w - gap; ox = '100%'; }
      const y = Math.min(innerHeight - h - 12, Math.max(12, e.clientY - h / 2));
      peek.style.setProperty('--ox', ox);
      peek.style.transform = `translate3d(${Math.max(12, x)}px,${y}px,0)`;
    }
    function hidePeek() { if (!peekOn) return; peekOn = false; clearInterval(peekTimer); peek.classList.remove('on'); }
    addEventListener('scroll', hidePeek, { passive: true });
  })();

  /* ───── event strips: swipe or step through ───── */
  $$('.strip-win').forEach(win => {
    const strip = $('.strip', win), prev = $('.strip-prev', win), next = $('.strip-next', win), count = $('.strip-count', win);
    const cards = $$('.ev', strip);
    const step = () => { const c = cards[0]; return c ? c.offsetWidth + parseFloat(getComputedStyle(strip).columnGap || 12) : strip.clientWidth; };
    const visible = () => { const r = strip.getBoundingClientRect(); return cards.map((c, i) => [i, c.getBoundingClientRect()]).filter(([, cr]) => cr.left >= r.left - 4 && cr.right <= r.right + 4).map(([i]) => i); };
    const update = () => {
      const v = visible(); const first = v.length ? v[0] : 0, last = v.length ? v[v.length - 1] : 0;
      count.textContent = first === last ? `${first + 1} of ${cards.length}` : `${first + 1}–${last + 1} of ${cards.length}`;
      prev.disabled = strip.scrollLeft < 4;
      next.disabled = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 4;
    };
    const go = dir => { const n = Math.max(1, visible().length); strip.scrollBy({ left: dir * step() * n, behavior: reduce ? 'auto' : 'smooth' }); };
    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    strip.addEventListener('keydown', e => { if (e.target !== strip) return; if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } });
    let t; strip.addEventListener('scroll', () => { cancelAnimationFrame(t); t = requestAnimationFrame(update); }, { passive: true });
    addEventListener('resize', update); update();
  });

  /* ───── things animate in as you scroll to them ───── */
  const pops = $$('[data-pop], .ticker-clip');
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.remove('pre'); e.target.classList.add('in-view'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -10% 0px', threshold: .05 });
    pops.forEach(el => {
      if (el.getBoundingClientRect().top > innerHeight * .9) el.classList.add('pre');
      else el.classList.add('in-view');
      io.observe(el);
    });
  } else pops.forEach(el => el.classList.add('in-view'));

  /* ───── tilt: cards lean toward the cursor ───── */
  if (fine && !reduce) {
    $$('.cert, .shot-screen, .ev, .id-av').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg'); el.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg');
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ───── copy email ───── */
  $('#copy').addEventListener('click', e => {
    const btn = e.currentTarget, lbl = $('span', btn), done = m => { lbl.textContent = m; btn.classList.add('ok-flash'); setTimeout(() => { lbl.textContent = 'Copy address'; btn.classList.remove('ok-flash'); }, 1800); };
    const fallback = () => { const r = document.createRange(); r.selectNodeContents($('#mail')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); done('Selected'); };
    try { navigator.clipboard.writeText('sofiardmesa@gmail.com').then(() => done('Copied ✓'), fallback); } catch (err) { fallback(); }
  });

  /* ───── yellow tooltips (desktop) ───── */
  if (fine) {
    let on = null;
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-tip]');
      if (t === on) return; on = t;
      if (!t) return hideTip();
      tip.textContent = t.dataset.tip;
      tip.classList.add('on');
    });
    addEventListener('pointermove', e => { if (on) tip.style.transform = `translate3d(${e.clientX + 14}px,${e.clientY + 20}px,0)`; }, { passive: true });
    addEventListener('scroll', hideTip, { passive: true });
  }
})();