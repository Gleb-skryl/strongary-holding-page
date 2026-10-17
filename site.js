(() => {
  'use strict';
  const root = document.documentElement;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 901px)');
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  // An unset invitation is a status, never a dead or fabricated download link.
  const invitation = window.STRONGARY_CONFIG?.testflightUrl?.trim();
  if (invitation) {
    try {
      const url = new URL(invitation);
      if (url.protocol === 'https:' && url.hostname === 'testflight.apple.com' && /^\/join\/[a-z0-9]+\/?$/i.test(url.pathname) && !url.username && !url.password) {
        document.querySelectorAll('[data-testflight-link]').forEach(link => {
          link.href = url.href;
          link.hidden = false;
          link.rel = 'noopener noreferrer';
          link.target = '_blank';
        });
        document.querySelectorAll('[data-testflight-pending]').forEach(node => { node.hidden = true; });
        document.querySelectorAll('[data-testflight-note]').forEach(node => { node.textContent = 'Открой ссылку на iPhone и следуй инструкциям TestFlight.'; });
        const description = document.querySelector('.testflight-card > p:not(.eyebrow):not(.testflight-note)');
        if (description) description.innerHTML = 'Strongary для iPhone и Apple Watch.<br>Присоединяйся к открытому тестированию.';
        document.querySelectorAll('.hero-actions a[href="#testflight"]').forEach(link => { link.innerHTML = 'Попробовать в TestFlight <span aria-hidden="true">↗</span>'; });
        const answer = document.querySelector('.faq-list details:first-child p');
        if (answer) answer.textContent = 'Открытое тестирование уже доступно. Перейди к блоку TestFlight внизу страницы и открой ссылку на своём iPhone.';
      }
    } catch { /* Keep the pending state if configuration is invalid. */ }
  }

  // Native dialog gives keyboard users focus containment, Escape and focus return.
  const dialog = document.getElementById('zoom-dialog');
  const zoomImage = document.getElementById('zoom-image');
  const zoomCaption = document.getElementById('zoom-caption');
  if (dialog && typeof dialog.showModal === 'function') {
    let opener;
    document.querySelectorAll('[data-zoom]').forEach(link => {
      link.addEventListener('click', event => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        opener = link;
        const caption = link.querySelector('img')?.alt || link.dataset.caption || 'Экран Strongary';
        zoomImage.src = link.href;
        zoomImage.alt = caption;
        zoomCaption.textContent = caption;
        dialog.showModal();
        document.body.classList.add('modal-open');
      });
    });
    dialog.querySelector('.zoom-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      const box = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
      zoomImage.removeAttribute('src');
      opener?.focus({ preventScroll: true });
    });
  }

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('[data-reveal]').forEach(node => {
      // Never hide content already in view; keep all content visible without JS.
      if (!reducedMotion.matches && node.getBoundingClientRect().top > innerHeight) node.classList.add('will-reveal');
      revealObserver.observe(node);
    });
    reducedMotion.addEventListener('change', () => {
      if (reducedMotion.matches) document.querySelectorAll('.will-reveal').forEach(node => node.classList.add('is-visible'));
    });
  }

  const story = document.querySelector('[data-story]');
  const steps = [...document.querySelectorAll('[data-step]')];
  const screens = [...document.querySelectorAll('[data-screen]')];
  const stepButtons = [...document.querySelectorAll('[data-step-button]')];
  let activeStep = -1;
  function selectStep(index) {
    if (index === activeStep) return;
    activeStep = index;
    screens.forEach((screen, i) => {
      screen.classList.toggle('is-active', i === index);
      screen.inert = i !== index;
    });
    stepButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  }
  stepButtons.forEach((button, index) => button.addEventListener('click', () => {
    selectStep(index);
    steps[index].scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'center' });
  }));

  const heroStage = document.querySelector('.hero-stage');
  const intakeStage = document.querySelector('[data-parallax]');
  const navSections = [...document.querySelectorAll('main > section[id]')];
  const navLinks = [...document.querySelectorAll('.header-inner nav a')];
  let scheduled = false;
  function updateScroll() {
    scheduled = false;
    const height = innerHeight;
    const pageHeight = root.scrollHeight - height;
    root.style.setProperty('--read', pageHeight > 0 ? clamp(scrollY / pageHeight) : 0);
    if (!reducedMotion.matches) {
      if (heroStage) {
        const rect = heroStage.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < height) heroStage.style.setProperty('--hero-shift', clamp((height - rect.top) / (height + rect.height)));
      }
      if (intakeStage) {
        const rect = intakeStage.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < height) intakeStage.style.setProperty('--drift', clamp((height - rect.top) / (height + rect.height)));
      }
    }
    if (story && desktop.matches) {
      const rect = story.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < height) {
        const distances = steps.map(step => Math.abs(step.getBoundingClientRect().top + step.offsetHeight / 2 - height / 2));
        selectStep(distances.indexOf(Math.min(...distances)));
      }
    }
    let current = '';
    navSections.forEach(section => { if (section.getBoundingClientRect().top <= height * .35) current = `#${section.id}`; });
    navLinks.forEach(link => {
      if (link.hash === current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function requestUpdate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateScroll);
  }
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', requestUpdate, { passive: true });
  addEventListener('pageshow', requestUpdate);
  desktop.addEventListener('change', requestUpdate);
  selectStep(0);
  updateScroll();
})();
