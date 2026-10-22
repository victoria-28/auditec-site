const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initReveal(){
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  els.forEach(el => io.observe(el));
}

/* Compteurs à rouleaux : chaque chiffre défile comme un compteur mécanique */
function initCounters(){
  const counters = document.querySelectorAll('.stat-num[data-count]');
  counters.forEach(el => {
    const target = String(parseInt(el.dataset.count, 10));
    const prefix = el.dataset.prefix || '';
    el.setAttribute('aria-label', prefix + target);
    el.innerHTML = (prefix ? '<span class="sym" aria-hidden="true">' + prefix + '</span>' : '') +
      target.split('').map(() => {
        let strip = '';
        for (let n = 0; n <= 9; n++) strip += '<span>' + n + '</span>';
        return '<span class="digit" aria-hidden="true"><span class="digit-strip">' + strip + '</span></span>';
      }).join('');
    el.dataset.target = target;
  });
  const run = el => {
    el.querySelectorAll('.digit-strip').forEach((strip, i) => {
      const d = parseInt(el.dataset.target[i], 10);
      strip.style.transitionDelay = (i * 0.12) + 's';
      strip.style.transform = 'translateY(-' + (d * 1.4) + 'em)';
    });
  };
  if (!('IntersectionObserver' in window) || REDUCED) { counters.forEach(run); return; }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
  }, { threshold: 0.5 });
  counters.forEach(el => io.observe(el));
}

function initNav(){
  const nav = document.getElementById('nav');
  const bar = document.createElement('div'); bar.className = 'scroll-progress'; document.body.appendChild(bar);
  const onScroll = () => {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 30);
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? window.scrollY / h : 0) + ')';
  };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = document.getElementById('navBurger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (burger && mobileMenu) burger.addEventListener('click', () => mobileMenu.classList.toggle('open'));
}

function initTerms(){
  document.querySelectorAll('.term-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const desc = btn.nextElementSibling;
      const isOpen = btn.classList.toggle('open');
      desc.style.maxHeight = isOpen ? desc.scrollHeight + 'px' : '0px';
    });
  });
}

/* Titre du hero : apparition mot à mot */
function initSplitWords(){
  document.querySelectorAll('.split-words').forEach(h => {
    if (REDUCED) return;
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span'); w.className = 'w';
            const inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--i', i++);
            w.appendChild(inner); frag.appendChild(w);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) walk(child);
      });
    };
    h.setAttribute('aria-label', h.textContent);
    walk(h);
  });
}

/* HERO : enchaînement de scènes (photos des locaux + vidéos) en fondu enchaîné.
   Une seule vidéo est chargée à la fois, la suivante est préchargée pendant la scène en cours. */
function initHeroScenes(){
  const stage = document.getElementById('heroStage');
  const data = document.getElementById('heroScenes');
  if (!stage || !data) return;
  let scenes; try { scenes = JSON.parse(data.textContent); } catch(e) { return; }
  const progress = document.getElementById('heroProgress');
  const caption = document.getElementById('heroCaption');
  const pauseBtn = document.getElementById('heroPause');
  const FADE = 1800;
  let idx = 0, timer = null, paused = REDUCED, current = stage.querySelector('.hero-scene');

  const bars = scenes.map((s, i) => {
    const b = document.createElement('button'); b.type = 'button';
    b.setAttribute('aria-label', 'Scène ' + (i + 1));
    b.addEventListener('click', () => go(i));
    progress && progress.appendChild(b); return b;
  });

  const build = s => {
    const el = document.createElement('div'); el.className = 'hero-scene';
    if (s.type === 'video') {
      const v = document.createElement('video');
      v.muted = true; v.playsInline = true; v.loop = true; v.preload = 'auto';
      v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
      if (s.poster) v.poster = s.poster;
      const mp4ok = v.canPlayType('video/mp4; codecs="avc1.42E01E"');
      v.src = (s.webm && !mp4ok) ? s.webm : s.src; el.appendChild(v); el._video = v;
      v.addEventListener('error', () => { el._failed = true; });
    } else {
      el.style.backgroundImage = "url('" + s.src + "')";
    }
    return el;
  };
  let next = null;
  const prepare = i => { next = { i, el: build(scenes[i]) }; };

  function show(i){
    const s = scenes[i];
    let el = (next && next.i === i) ? next.el : build(s);
    if (el._failed) { prepare((i + 1) % scenes.length); return show((i + 1) % scenes.length); }
    const dur = (s.duration || 8);
    el.style.setProperty('--dur', (dur + FADE / 1000) + 's');
    el.classList.add(s.type === 'video' ? 'move-video' : (s.move === 'pan' ? 'move-pan' : 'move-push'));
    stage.appendChild(el);
    if (el._video) { const p = el._video.play(); if (p && p.catch) p.catch(() => {}); }
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-active')));
    const old = current; current = el;
    if (old && old !== el) setTimeout(() => { if (old._video) old._video.pause(); old.remove(); }, FADE + 100);
    if (caption) { caption.style.opacity = 0; setTimeout(() => { caption.textContent = s.caption || ''; caption.style.opacity = 1; }, 500); }
    bars.forEach((b, k) => { b.classList.toggle('done', k < i); b.classList.remove('run'); b.style.setProperty('--dur', dur + 's'); });
    void bars[i].offsetWidth; if (!paused) bars[i].classList.add('run');
    idx = i;
    prepare((i + 1) % scenes.length);
    clearTimeout(timer);
    if (!paused) timer = setTimeout(() => show((idx + 1) % scenes.length), dur * 1000);
  }
  function go(i){ clearTimeout(timer); show(i); }

  if (pauseBtn) {
    const icons = {
      pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>',
      play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4l13 8-13 8z"/></svg>'
    };
    const sync = () => {
      pauseBtn.innerHTML = paused ? icons.play : icons.pause;
      pauseBtn.setAttribute('aria-label', paused ? "Relancer l'animation d'arrière-plan" : "Mettre en pause l'animation d'arrière-plan");
    };
    pauseBtn.addEventListener('click', () => {
      paused = !paused; sync();
      stage.querySelectorAll('.hero-scene').forEach(el => {
        el.style.animationPlayState = paused ? 'paused' : 'running';
        if (el._video) paused ? el._video.pause() : el._video.play().catch(() => {});
      });
      if (paused) { clearTimeout(timer); bars[idx].style.animationPlayState = 'paused'; }
      else { go((idx + 1) % scenes.length); }
    });
    sync();
  }

  // Première scène : l'image déjà présente dans le HTML (affichage immédiat), puis on enchaîne.
  if (current) current.remove(); current = null;
  show(0);
  // Pas d'animation en arrière-plan quand l'onglet est caché
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearTimeout(timer);
    else if (!paused) { clearTimeout(timer); timer = setTimeout(() => show((idx + 1) % scenes.length), 3000); }
  });
}

/* Expertises : la photo de droite suit la ligne survolée (ou celle au centre de l'écran) */
function initExpertiseList(){
  const rows = [...document.querySelectorAll('.xp-row')];
  const imgs = [...document.querySelectorAll('#xpVisual .xp-img')];
  if (!rows.length || !imgs.length) return;
  const activate = i => {
    rows.forEach((r, k) => r.classList.toggle('is-active', k === i));
    imgs.forEach((im, k) => im.classList.toggle('is-active', k === i));
  };
  rows.forEach((r, i) => { r.addEventListener('mouseenter', () => activate(i)); r.addEventListener('focus', () => activate(i)); });
  // Dévoilement de la photo : on observe la section entière (la photo elle-même est masquée au départ)
  const visual = document.getElementById('xpVisual');
  const section = visual && visual.closest('section');
  if (visual && section) {
    if ('IntersectionObserver' in window && !REDUCED) {
      const vo = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) { visual.classList.add('in'); vo.disconnect(); } }); }, { threshold: 0.15 });
      vo.observe(section);
    } else visual.classList.add('in');
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) activate(rows.indexOf(e.target)); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    rows.forEach(r => io.observe(r));
  }
}


/* Accueil : onglets « À chaque étape » (clavier : flèches gauche / droite) */
function initEtapes(){
  const tabs = [...document.querySelectorAll('.et-tab')];
  if (!tabs.length) return;
  const panels = tabs.map(t => document.getElementById(t.getAttribute('aria-controls')));
  const show = (i, focus) => {
    tabs.forEach((t, k) => { const on = k === i; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
    panels.forEach((p, k) => { const on = k === i; p.hidden = !on; p.classList.toggle('is-active', on); });
    if (focus) tabs[i].focus();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => show(i));
    t.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); show((i + 1) % tabs.length, true); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); show((i - 1 + tabs.length) % tabs.length, true); }
    });
  });
  show(0);
}


/* Frise d'histoire : la ligne dorée se trace quand la section arrive à l'écran */
function initHistoire(){
  document.querySelectorAll('.hx-section, .pc-timeline-wrap').forEach(sec => {
    if (!('IntersectionObserver' in window)) { sec.classList.add('in-view'); return; }
    const o = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { sec.classList.add('in-view'); o.disconnect(); } }), { threshold: .25 });
    o.observe(sec);
  });
}


/* Votre parcours : frise collante avec progression, chiffres animés, léger effet de profondeur sur les photos */
function initParcours(){
  const bar = document.getElementById('pcProgress');
  const stages = [...document.querySelectorAll('.pc-stage')];
  if (!stages.length) return;
  const steps = [...document.querySelectorAll('.pc-sticky .pc-step')];
  const imgs = [...document.querySelectorAll('.pc-img .xp-hero-zoom')];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ticking = false;
  const update = () => {
    ticking = false;
    const first = stages[0].getBoundingClientRect().top + window.scrollY - window.innerHeight * .5;
    const last = stages[stages.length - 1].getBoundingClientRect().bottom + window.scrollY - window.innerHeight * .5;
    const p = Math.min(1, Math.max(0, (window.scrollY - first) / (last - first)));
    if (bar) bar.style.width = (p * 100) + '%';
    let cur = -1;
    stages.forEach((st, i) => { if (st.getBoundingClientRect().top < window.innerHeight * .5) cur = i; });
    steps.forEach((el, i) => el.classList.toggle('is-current', i === cur));
    if (!reduce) imgs.forEach(im => {
      const r = im.parentElement.getBoundingClientRect();
      const c = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
      im.style.transform = 'scale(1.12) translateY(' + (c * -6).toFixed(2) + '%)';
    });
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update); update();
  const counts = document.querySelectorAll('.pc-count');
  if ('IntersectionObserver' in window && !reduce) {
    const o = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return; o.unobserve(e.target);
      const el = e.target, to = +el.dataset.to, t0 = performance.now(), d = 1400;
      const step = now => { const k = Math.min(1, (now - t0) / d); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
      el.textContent = '0'; requestAnimationFrame(step);
    }), { threshold: .6 });
    counts.forEach(c => o.observe(c));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initParcours();
  initHistoire();
  initEtapes();
  initSplitWords(); initReveal(); initCounters(); initNav(); initTerms(); initHeroScenes(); initExpertiseList();
});
