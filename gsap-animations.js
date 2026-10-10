(() => {
  'use strict';
  gsap.registerPlugin(ScrollTrigger);
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T0 = calm ? 0 : 2.3;

  /* Lenis smooth scroll, driven by GSAP's ticker */
  const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  /* Intro sequence */
  const intro = $('#intro');
  if (calm) intro.remove();
  else {
    lenis.stop();
    const it = $('.intro-t');
    it.innerHTML = [...it.textContent].map(ch => `<span class="ic">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
    gsap.timeline({ onComplete: () => { intro.remove(); lenis.start(); } })
      .from('.ic', { yPercent: 120, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.035 })
      .from('.intro-sub', { opacity: 0, y: 12, duration: 0.6 }, '-=0.5')
      .to('#introBar', { scaleX: 1, duration: 0.8, ease: 'power2.inOut' }, '-=0.5')
      .to('.intro-in', { yPercent: -25, opacity: 0, duration: 0.5, ease: 'power3.in' })
      .to(intro, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, '-=0.2');
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id.length > 1 && $(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -70 }); }
  }));

  /* Split text into characters, reveal on scroll */
  $$('[data-split]').forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(w => `<span style="display:inline-block;white-space:nowrap" aria-hidden="true">${[...w].map(c => `<span class="char">${c}</span>`).join('')}</span>`).join(' ');
    if (calm) return;
    gsap.from($$('.char', el), {
      yPercent: 110, opacity: 0, rotate: 6, duration: 0.8, ease: 'power4.out', stagger: 0.018, delay: el.closest('.hero') ? T0 : 0,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  /* Hero entrance and floating mockups */
  if (!calm) {
    gsap.from('.badge, .sub, .cta-row', { y: 30, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.15, delay: T0 + 0.3 });
    gsap.from('.m', { scale: 0.8, opacity: 0, duration: 1, ease: 'back.out(1.6)', stagger: 0.12, delay: T0 + 0.5 });
    $$('.m').forEach((m, i) => gsap.to(m, { y: i % 2 ? 14 : -14, duration: 2.6 + i * 0.4, ease: 'sine.inOut', repeat: -1, yoyo: true }));
    gsap.utils.toArray('.card, .flip').forEach(el => gsap.from(el, {
      y: 60, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    }));
  }

  /* Velocity-based marquee */
  const bands = $$('.marquee').map(m => {
    const track = $('.track', m), span = $('span', track);
    while (track.scrollWidth < innerWidth * 2.5) track.appendChild(span.cloneNode(true));
    const half = track.scrollWidth / 2;
    return { track, dir: +m.dataset.speed || 1, x: 0, half: Math.max(half, 1) };
  });
  let boost = 0;
  lenis.on('scroll', ({ velocity }) => { boost = Math.min(Math.abs(velocity) * 0.6, 14); });
  if (!calm) gsap.ticker.add(() => {
    boost *= 0.92;
    bands.forEach(b => {
      b.x -= (1 + boost) * b.dir * 1.2;
      if (b.x <= -b.half) b.x += b.half;
      if (b.x > 0) b.x -= b.half;
      b.track.style.transform = `translate3d(${b.x}px,0,0)`;
    });
  });

  /* Pinned horizontal scroll */
  const track = $('.lab-track');
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1px)', () => {
    const dist = () => Math.max(track.scrollWidth - innerWidth, 0);
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.lab', start: 'top top', end: () => '+=' + dist(), pin: '.lab-pin', scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true }
    });
  });

  /* Custom cursor: dot, dashed ring, trailing sparks */
  const dot = $('#curDot'), ring = $('#curRing'), label = $('#curText');
  if (fine) {
    document.documentElement.classList.add('has-cur');
    const dx = gsap.quickTo(dot, 'x', { duration: 0.06, ease: 'none' }), dy = gsap.quickTo(dot, 'y', { duration: 0.06, ease: 'none' });
    const rx0 = gsap.quickTo(ring, 'x', { duration: 0.45, ease: 'power3' }), ry0 = gsap.quickTo(ring, 'y', { duration: 0.45, ease: 'power3' });
    const trail = Array.from({ length: 8 }, (_, i) => {
      const t = document.createElement('i'); t.className = 'trail'; document.body.appendChild(t);
      gsap.set(t, { scale: 1 - i * 0.1 });
      return { t, o: (1 - i * 0.11) * 0.6, x: gsap.quickTo(t, 'x', { duration: 0.2 + i * 0.07, ease: 'power2' }), y: gsap.quickTo(t, 'y', { duration: 0.2 + i * 0.07, ease: 'power2' }) };
    });
    let shown = false;
    addEventListener('mousemove', e => {
      if (!shown) { shown = true; gsap.to([dot, ring], { opacity: 1, duration: 0.3 }); trail.forEach(o => gsap.to(o.t, { opacity: o.o, duration: 0.3 })); }
      dx(e.clientX); dy(e.clientY); rx0(e.clientX); ry0(e.clientY);
      trail.forEach(o => { o.x(e.clientX); o.y(e.clientY); });
    });
    document.addEventListener('mouseleave', () => { shown = false; gsap.to([dot, ring, ...trail.map(o => o.t)], { opacity: 0, duration: 0.2 }); });
    addEventListener('mousedown', () => ring.classList.add('down'));
    addEventListener('mouseup', () => ring.classList.remove('down'));
    $$('a, button, summary, .flip, input, select, textarea').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('hot'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hot'));
    });
    $$('[data-cursor]').forEach(el => {
      el.addEventListener('mouseenter', () => { label.textContent = el.dataset.cursor; ring.classList.add('lens'); });
      el.addEventListener('mouseleave', () => { label.textContent = ''; ring.classList.remove('lens'); });
    });

    /* Magnetic buttons */
    $$('.mag').forEach(el => {
      const x = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'elastic.out(1,0.5)' });
      const y = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'elastic.out(1,0.5)' });
      el.addEventListener('mousemove', e => { const r = el.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.35); y((e.clientY - r.top - r.height / 2) * 0.35); });
      el.addEventListener('mouseleave', () => { x(0); y(0); });
    });

    /* 3D tilt with glare */
    $$('.tilt').forEach(el => {
      const g = document.createElement('i'); g.className = 'glare'; el.appendChild(g);
      const rx = gsap.quickTo(el, 'rotationX', { duration: 0.4, ease: 'power2' });
      const ry = gsap.quickTo(el, 'rotationY', { duration: 0.4, ease: 'power2' });
      gsap.set(el, { transformPerspective: 900 });
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        ry((px - 0.5) * 12); rx(-(py - 0.5) * 12);
        el.style.setProperty('--gx', px * 100 + '%'); el.style.setProperty('--gy', py * 100 + '%');
      });
      el.addEventListener('mouseleave', () => { rx(0); ry(0); });
    });
  } else {
    dot.remove(); ring.remove();
  }

  /* Tap to flip pricing cards on touch devices */
  $$('.flip').forEach(f => f.addEventListener('click', e => { if (!e.target.closest('a')) f.classList.toggle('on'); }));

  /* Nav hides on scroll down, shows on scroll up */
  const nav = $('#nav');
  let lastY = 0;
  lenis.on('scroll', ({ scroll }) => {
    gsap.to(nav, { yPercent: scroll > lastY && scroll > 200 ? -140 : 0, duration: 0.4, overwrite: 'auto' });
    lastY = scroll;
  });

  /* Click-to-copy */
  $$('.copy').forEach(b => b.addEventListener('click', async () => {
    const old = b.textContent;
    try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = 'Copied ✓'; }
    catch { b.textContent = 'Press Ctrl+C to copy'; }
    setTimeout(() => (b.textContent = old), 1600);
  }));

  /* Budget slider, form, WhatsApp */
  const bud = $('#bud'), bv = $('#bv');
  const money = n => '₹' + Number(n).toLocaleString('en-IN');
  bud.addEventListener('input', () => (bv.textContent = money(bud.value)));
  const form = $('#form'), status = $('#status');
  const buildMsg = () => {
    const d = new FormData(form);
    return `Hi Suraj! I'm ${d.get('name') || '(name)'} (${d.get('biz') || 'business'}). I need: ${d.get('svc')}. Budget: ${money(d.get('bud'))}. ${d.get('msg') || ''}`;
  };
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!form.name.value.trim()) { status.textContent = 'Please add your name so Suraj knows who to reply to.'; form.name.focus(); return; }
    const url = `mailto:vanguardweblab@gmail.com?subject=${encodeURIComponent('New project: ' + form.svc.value)}&body=${encodeURIComponent(buildMsg())}`;
    status.textContent = 'Opening your email app with your project details…';
    gsap.fromTo('.btn.big', { scale: 0.92 }, { scale: 1, duration: 0.6, ease: 'elastic.out(1,0.4)' });
    location.href = url;
  });

  /* Interactive living background: drifting orbs, twinkling sparks, cursor spotlight, parallax, click ripples */
  const bg = $('#bg');
  const R = gsap.utils.random;
  const mk = (cls) => { const el = document.createElement('i'); el.className = cls; bg.appendChild(el); return el; };
  for (let i = 0; i < 12; i++) { // rising bubbles
    const b = mk('bubble'), sz = R(16, 70);
    gsap.set(b, { left: R(0, 100) + '%', top: calm ? R(0, 100) + '%' : '100%', width: sz, height: sz });
    if (!calm) gsap.to(b, { y: -(innerHeight + 200), x: R(-80, 80), duration: R(12, 26), delay: -R(0, 20), repeat: -1, ease: 'none' });
  }
  for (let i = 0; i < 9; i++) { // drifting geometry
    const s = mk('shape sh' + (i % 3));
    gsap.set(s, { left: R(0, 95) + '%', top: R(0, 95) + '%', scale: R(0.6, 1.6) });
    if (calm) continue;
    gsap.to(s, { rotation: i % 2 ? 360 : -360, duration: R(30, 60), repeat: -1, ease: 'none' });
    gsap.to(s, { y: R(-60, 60), x: R(-40, 40), duration: R(8, 14), repeat: -1, yoyo: true, ease: 'sine.inOut' });
  }
  for (let i = 0; i < 3; i++) { // sweeping light beams
    const b = mk('beam');
    gsap.set(b, { left: 15 + i * 30 + '%', rotation: R(-25, 25) });
    if (!calm) gsap.to(b, { rotation: '+=' + R(-20, 20), opacity: 0.55, duration: R(7, 12), repeat: -1, yoyo: true, ease: 'sine.inOut' });
  }
  for (let i = 0; i < 60; i++) {
    const s = document.createElement('i');
    s.className = 'spark';
    bg.appendChild(s);
    gsap.set(s, { left: gsap.utils.random(0, 100) + '%', top: gsap.utils.random(0, 100) + '%', scale: gsap.utils.random(0.5, 1.6) });
    if (calm) continue;
    gsap.to(s, { x: gsap.utils.random(-60, 60), y: gsap.utils.random(-80, 80), duration: gsap.utils.random(6, 12), ease: 'sine.inOut', repeat: -1, yoyo: true });
    gsap.to(s, { opacity: gsap.utils.random(0.12, 0.45), duration: gsap.utils.random(1.5, 3.5), ease: 'sine.inOut', repeat: -1, yoyo: true });
  }
  if (!calm) {
    $$('.orb').forEach((o, i) => gsap.to(o, { x: 'random(-120,120)', y: 'random(-100,100)', scale: 'random(0.85,1.25)', duration: 9 + i * 2, ease: 'sine.inOut', repeat: -1, yoyo: true }));
    addEventListener('pointerdown', e => {
      const r = document.createElement('i');
      r.className = 'ripple';
      r.style.left = e.clientX + 'px';
      r.style.top = e.clientY + 'px';
      bg.appendChild(r);
      gsap.fromTo(r, { scale: 0, opacity: 0.7 }, { scale: 1, opacity: 0, duration: 1.1, ease: 'power2.out', onComplete: () => r.remove() });
    });
  }
  if (fine && !calm) {
    const spot = $('.spot');
    const sx = gsap.quickTo(spot, 'x', { duration: 0.8, ease: 'power3' });
    const sy = gsap.quickTo(spot, 'y', { duration: 0.8, ease: 'power3' });
    const layers = $$('.layer').map(l => ({
      d: +l.dataset.d,
      x: gsap.quickTo(l, 'x', { duration: 1.2, ease: 'power3' }),
      y: gsap.quickTo(l, 'y', { duration: 1.2, ease: 'power3' })
    }));
    addEventListener('mousemove', e => {
      const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
      sx(e.clientX); sy(e.clientY);
      layers.forEach(l => { l.x(-nx * l.d * 2); l.y(-ny * l.d * 2); });
    });
  } else {
    $('.spot').remove();
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
