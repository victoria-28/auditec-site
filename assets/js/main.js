function initReveal(){
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));
}
function initCounters(){
  const counters = document.querySelectorAll('.stat-num');
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target; const target = parseInt(el.dataset.count, 10);
      const dur = 1300; const start = performance.now();
      function tick(now){ const p = Math.min((now-start)/dur,1); const eased=1-Math.pow(1-p,3);
        el.textContent = Math.round(eased*target).toLocaleString('fr-FR'); if(p<1) requestAnimationFrame(tick); }
      requestAnimationFrame(tick); countIO.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(el => countIO.observe(el));
}
function initParallax(){
  const heroImg = document.getElementById('heroImg');
  if (!heroImg) return;
  const handler = () => { const y = Math.min(window.scrollY, 600); heroImg.style.transform = 'translateY(' + (y*0.08) + 'px)'; };
  window.addEventListener('scroll', handler, { passive:true });
}
function initNav(){
  const nav = document.getElementById('nav');
  if (nav) window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 30), { passive:true });
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

document.addEventListener('DOMContentLoaded', () => {
  initReveal(); initCounters(); initParallax(); initNav(); initTerms();
});
