(() => {
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => [...r.querySelectorAll(s)];

  // Mobile navigation: accessible drawer with focus restoration.
  const menuButton = qs('.hamburger');
  const drawer = qs('.mobile-drawer');
  const scrim = qs('.scrim');
  const closeButton = qs('.drawer-close');
  let lastFocused = null;

  const setMenu = (open) => {
    if (!drawer || !menuButton) return;
    drawer.classList.toggle('open', open);
    scrim?.classList.toggle('show', open);
    document.body.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    drawer.setAttribute('aria-hidden', String(!open));
    if (open) {
      lastFocused = document.activeElement;
      closeButton?.focus();
    } else {
      lastFocused?.focus?.();
    }
  };

  menuButton?.addEventListener('click', () => setMenu(true));
  closeButton?.addEventListener('click', () => setMenu(false));
  scrim?.addEventListener('click', () => setMenu(false));
  qsa('.mobile-drawer a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (drawer?.classList.contains('open')) setMenu(false);
      closeLightbox();
    }
    if (drawer?.classList.contains('open') && e.key === 'Tab') {
      const focusables = qsa('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])', drawer);
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Reveal animations.
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: .12 }) : null;
  qsa('.reveal').forEach(el => observer ? observer.observe(el) : el.classList.add('visible'));

  // Back to top.
  const top = qs('.back-to-top');
  window.addEventListener('scroll', () => top?.classList.toggle('show', window.scrollY > 500), { passive: true });
  top?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Accessible gallery lightbox with previous/next + keyboard support.
  const lightbox = qs('.lightbox');
  const lbImg = qs('.lightbox-inner img', lightbox);
  const lbCap = qs('.lightbox-cap', lightbox);
  const lbCounter = qs('.lightbox-counter', lightbox);
  const galleryItems = qsa('.gallery-item[data-lightbox]');
  let galleryIndex = 0;
  let lightboxReturnFocus = null;

  const renderLightbox = () => {
    const item = galleryItems[galleryIndex];
    if (!item || !lightbox) return;
    const image = qs('img', item);
    lbImg.src = image.currentSrc || image.src;
    lbImg.alt = image.alt || '';
    lbCap.textContent = qs('.gallery-caption', item)?.textContent || item.dataset.caption || '';
    if (lbCounter) lbCounter.textContent = `${galleryIndex + 1} / ${galleryItems.length}`;
  };

  const openLightbox = (index) => {
    if (!lightbox) return;
    galleryIndex = index;
    lightboxReturnFocus = document.activeElement;
    renderLightbox();
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    qs('.lightbox-close', lightbox)?.focus();
  };
  function closeLightbox() {
    if (!lightbox?.classList.contains('open')) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxReturnFocus?.focus?.();
  }
  const stepLightbox = (direction) => {
    if (!galleryItems.length) return;
    galleryIndex = (galleryIndex + direction + galleryItems.length) % galleryItems.length;
    renderLightbox();
  };

  galleryItems.forEach((item, index) => {
    item.setAttribute('tabindex', '0');
    item.setAttribute('role', 'button');
    item.setAttribute('aria-label', `Open image ${index + 1}`);
    item.addEventListener('click', () => openLightbox(index));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(index); }
    });
  });
  qs('.lightbox-close')?.addEventListener('click', closeLightbox);
  qs('.lightbox-prev')?.addEventListener('click', () => stepLightbox(-1));
  qs('.lightbox-next')?.addEventListener('click', () => stepLightbox(1));
  lightbox?.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

  document.addEventListener('keydown', e => {
    if (!lightbox?.classList.contains('open')) return;
    if (e.key === 'ArrowLeft') stepLightbox(-1);
    if (e.key === 'ArrowRight') stepLightbox(1);
    if (e.key === 'Tab') {
      const focusables = qsa('button', lightbox);
      if (focusables.length) {
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
  });

  // Analytics hooks when GA4 is present.
  const track = (name, params = {}) => {
    if (typeof window.gtag === 'function') window.gtag('event', name, params);
  };
  qsa('[data-track]').forEach(el => el.addEventListener('click', () => track(el.dataset.track, { link_text: el.textContent.trim() })));

  // Forms: validate first, then POST to /api/enquiry when deployed on Vercel.
  // If no backend is configured, do NOT claim success; present a truthful contact fallback.
  const validateField = field => {
    const rule = field.dataset.rule;
    const value = field.value.trim();
    let valid = true;
    if (field.required && !value) valid = false;
    if (rule === 'text' && value && value.length < 2) valid = false;
    if (rule === 'phone' && !/^[6-9]\d{9}$/.test(value.replace(/\D/g, ''))) valid = false;
    if (rule === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) valid = false;
    if (rule === 'class' && !value) valid = false;
    if (rule === 'required' && !value) valid = false;
    field.closest('.field')?.classList.toggle('invalid', !valid);
    return valid;
  };

  qsa('form[data-validate]').forEach(form => {
    qsa('input,select,textarea', form).forEach(field => field.addEventListener('blur', () => validateField(field)));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const fields = qsa('input:not([type="hidden"]),select,textarea', form);
      const valid = fields.every(validateField);
      const status = qs('.form-status', form.parentElement) || qs('.form-status', form);
      const submit = qs('button[type="submit"]', form);
      if (!valid) {
        if (status) { status.className = 'form-status error'; status.textContent = 'Please check the highlighted fields and try again.'; }
        return;
      }

      const honeypot = qs('[name="website"]', form);
      if (honeypot?.value) return;

      const payload = Object.fromEntries(new FormData(form).entries());
      payload.page = location.pathname;
      payload.formType = form.dataset.formType || 'general';
      track('form_submit', { form_type: payload.formType });
      submit.disabled = true;
      const original = submit.textContent;
      submit.textContent = 'Sending…';
      if (status) { status.className = 'form-status'; status.textContent = 'Sending your enquiry securely…'; }

      try {
        const response = await fetch('/api/enquiry', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.message || 'Submission service is not configured.');
        form.reset();
        fields.forEach(f => f.closest('.field')?.classList.remove('invalid'));
        if (status) { status.className = 'form-status success'; status.textContent = result.message || 'Your enquiry was submitted successfully. The school team will follow up with you.'; }
        track('form_success', { form_type: payload.formType });
      } catch (err) {
        if (status) {
          status.className = 'form-status error';
          status.innerHTML = 'We could not submit the form right now. Please call <a href="tel:+919839542475">+91 98395 42475</a> or <a href="https://wa.me/919839542475" target="_blank" rel="noopener">WhatsApp the admissions desk</a>.';
        }
        track('form_error', { form_type: payload.formType });
      } finally {
        submit.disabled = false;
        submit.textContent = original;
      }
    });
  });
})();
