(() => {
  'use strict';
  const root = document.documentElement;
  const english = root.lang === 'en';
  const themePicker = document.querySelector('.theme-picker');
  const themeSummary = themePicker?.querySelector('summary');
  function applyTheme(theme, save = false) {
    if (!['mixed', 'light', 'dark'].includes(theme)) theme = 'mixed';
    root.dataset.theme = theme;
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      const selected = button.dataset.themeChoice === theme;
      button.setAttribute('aria-pressed', String(selected));
      if (selected && themeSummary) {
        const label = button.querySelector('span').textContent;
        themeSummary.setAttribute('aria-label', `${english ? 'Theme' : 'Тема'}: ${label}`);
        themeSummary.title = label;
      }
    });
    document.querySelector('[data-theme-icon]')?.setAttribute('href', `#theme-${theme}`);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#171e19' : '#f7f8f4');
    document.querySelectorAll('img[data-screen]').forEach(img => {
      const variant = theme === 'mixed' ? img.dataset.mixed : theme;
      const base = `/assets/screenshots/iphone/${variant}/${img.dataset.screen}`;
      if (img.getAttribute('src') !== `${base}.webp`) img.src = `${base}.webp`;
      const link = img.closest('[data-zoom]');
      if (link) link.href = `${base}.png`;
    });
    if (save) {
      try { localStorage.setItem('strongary-theme', theme); } catch { /* Still switch this page. */ }
    }
  }
  applyTheme(root.dataset.theme || 'mixed');
  document.querySelectorAll('[data-theme-choice]').forEach(button => {
    button.addEventListener('click', () => {
      applyTheme(button.dataset.themeChoice, true);
      if (themePicker) themePicker.open = false;
      themeSummary?.focus({ preventScroll: true });
    });
  });
  document.addEventListener('click', event => {
    if (themePicker?.open && !themePicker.contains(event.target)) themePicker.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && themePicker?.open) {
      themePicker.open = false;
      themeSummary?.focus({ preventScroll: true });
    }
  });
  document.querySelectorAll('[data-language]').forEach(link => {
    link.addEventListener('click', () => { link.hash = location.hash; });
  });

  // All three stories are readable without JS. Enhance them into keyboard-accessible tabs.
  const progressTabs = document.querySelector('[data-progress-tabs]');
  if (progressTabs) {
    const tabs = [...progressTabs.querySelectorAll('button')];
    const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
    if (tabs.length && panels.every(Boolean)) {
      function selectProgressTab(index, focus = false) {
        tabs.forEach((tab, i) => {
          tab.setAttribute('aria-selected', String(i === index));
          tab.tabIndex = i === index ? 0 : -1;
          panels[i].hidden = i !== index;
        });
        if (focus) tabs[index].focus({ preventScroll: true });
      }
      progressTabs.setAttribute('role', 'tablist');
      tabs.forEach((tab, i) => {
        tab.setAttribute('role', 'tab');
        panels[i].setAttribute('role', 'tabpanel');
        panels[i].setAttribute('aria-labelledby', tab.id);
        panels[i].tabIndex = 0;
        tab.addEventListener('click', () => selectProgressTab(i));
        tab.addEventListener('keydown', event => {
          const next = event.key === 'ArrowRight' ? (i + 1) % tabs.length
            : event.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length
            : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
          if (next === null) return;
          event.preventDefault();
          selectProgressTab(next, true);
        });
      });
      selectProgressTab(0);
      progressTabs.hidden = false;
    }
  }
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
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
        document.querySelectorAll('[data-testflight-note]').forEach(node => { node.textContent = english ? 'This link opens beta installation through TestFlight on your iPhone.' : 'Ссылка откроет установку бета-версии через TestFlight на iPhone.'; });
        document.querySelectorAll('[data-release-status]').forEach(node => {
          node.textContent = english ? 'The free iPhone beta is available' : 'Бесплатная бета-версия для iPhone уже доступна';
        });
        document.querySelectorAll('[data-release-faq]').forEach(node => {
          node.textContent = english
            ? 'You’ll need TestFlight, Apple’s app for installing beta versions. The Strongary link is at the bottom of this page. You’ll need an iPhone with iOS 18.6 or later; the watch app requires watchOS 11 or later.'
            : 'Для установки понадобится TestFlight — приложение Apple для бета-версий. Ссылка на Strongary — внизу этой страницы. Нужен iPhone с iOS 18.6 или новее, а для приложения на часах — watchOS 11 или новее.';
        });
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
        const caption = link.querySelector('img')?.alt || link.dataset.caption || (english ? 'Strongary screen' : 'Экран Strongary');
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

  const heroStage = document.querySelector('.hero-stage');
  const intakeStage = document.querySelector('[data-parallax]');
  const progressBar = document.querySelector('.reading-progress');
  const nativeScrollMotion = CSS.supports('animation-timeline: view()') && CSS.supports('view-timeline-name: --hero-motion');
  const navSections = [...document.querySelectorAll('main > section[id]')];
  const navLinks = [...document.querySelectorAll('.main-nav a')];
  let scheduled = false;
  let layoutDirty = true;
  let height = 0;
  let pageHeight = 0;
  let sceneBounds = [];
  let sectionBounds = [];
  let currentSection = null;
  function measureLayout() {
    // Read layout together, only after content or viewport geometry changes.
    const y = scrollY;
    height = innerHeight;
    pageHeight = root.scrollHeight - height;
    sceneBounds = nativeScrollMotion ? [] : [[heroStage, '--hero-shift'], [intakeStage, '--drift']]
      .filter(([node]) => node)
      .map(([node, property]) => {
        const rect = node.getBoundingClientRect();
        return { node, property, top: rect.top + y, height: rect.height };
      });
    sectionBounds = navSections.map(section => ({ hash: `#${section.id}`, top: section.getBoundingClientRect().top + y }));
    layoutDirty = false;
  }
  function updateScroll() {
    scheduled = false;
    if (layoutDirty) measureLayout();
    const y = scrollY;
    if (progressBar && (!nativeScrollMotion || reducedMotion.matches)) {
      progressBar.style.transform = `scaleX(${pageHeight > 0 ? clamp(y / pageHeight) : 0})`;
    }
    if (!nativeScrollMotion && !reducedMotion.matches) {
      sceneBounds.forEach(scene => {
        const top = scene.top - y;
        if (top + scene.height > 0 && top < height) {
          scene.node.style.setProperty(scene.property, clamp((height - top) / (height + scene.height)));
        }
      });
    }
    let current = '';
    sectionBounds.forEach(section => { if (section.top <= y + height * .35) current = section.hash; });
    if (current !== currentSection) {
      navLinks.forEach(link => {
        if (link.hash === current) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      currentSection = current;
    }
  }
  function requestUpdate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateScroll);
  }
  function invalidateLayout() {
    layoutDirty = true;
    requestUpdate();
  }
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', invalidateLayout, { passive: true });
  addEventListener('pageshow', invalidateLayout);
  reducedMotion.addEventListener('change', requestUpdate);
  if ('ResizeObserver' in window) new ResizeObserver(invalidateLayout).observe(document.body);
  document.fonts?.ready.then(invalidateLayout);
  updateScroll();
})();
