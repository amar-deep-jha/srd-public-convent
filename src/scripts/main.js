/* ==========================================================================
   S.R.D. Public Convent — main.js
   Mobile drawer · reveal animations · back-to-top · lightbox · forms ·
   analytics hooks
   ========================================================================== */

(() => {
  'use strict';

  const qs = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const reducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ======================================================================
     Analytics
     ----------------------------------------------------------------------
     The measurement ID is supplied at build time via VITE_GA_MEASUREMENT_ID.
     If it is not set, `window.gtag` stays a safe no-op and every analytics
     call degrades gracefully. Configure GA4 by creating a `.env` file:

        VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

     Event naming contract (used across CTAs):
       admission_cta_click · phone_click · whatsapp_click · campus_visit_click
       gallery_open · form_start · form_submit · form_success · form_error
   ====================================================================== */

  const GA_ID =
    typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_GA_MEASUREMENT_ID
      : undefined;

  window.dataLayer = window.dataLayer || [];

  window.gtag = function () {
    window.dataLayer.push(arguments);
  };

  if (GA_ID) {
    const gtagScript = document.createElement('script');
    gtagScript.async = true;
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(gtagScript);

    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { send_page_view: true });
  }

  const track = (name, params = {}) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    }
  };

  /* Delegated click tracking for [data-track] elements */
  document.addEventListener('click', (event) => {
    const el = event.target.closest('[data-track]');
    if (!el) return;
    const params = { link_text: (el.textContent || '').trim().slice(0, 80) };
    const href = el.getAttribute('href');
    if (href) params.link_url = href;
    track(el.dataset.track, params);
  });

  /* ======================================================================
     Mobile navigation drawer — accessible dialog behaviour
   ====================================================================== */

  const menuButton = qs('.hamburger');
  const drawer = qs('.mobile-drawer');
  const scrim = qs('.scrim');
  const closeButton = qs('.drawer-close');
  let lastFocused = null;

  const getInertTargets = () =>
    [
      document.querySelector('.topbar'),
      document.querySelector('.navbar'),
      document.querySelector('main'),
      document.querySelector('footer'),
      document.querySelector('.skip-link'),
      document.querySelector('.back-to-top')
    ].filter(Boolean);

  const setInert = (inert) => {
    getInertTargets().forEach((el) => {
      if (inert) el.setAttribute('inert', '');
      else el.removeAttribute('inert');
    });
  };

  /* The closed drawer must be inert so its off-screen links cannot be
     reached with the keyboard; once open it must be interactive. */
  const setDrawerInert = () => {
    if (!drawer) return;
    if (drawer.classList.contains('open')) drawer.removeAttribute('inert');
    else drawer.setAttribute('inert', '');
  };

  const setMenu = (open) => {
    if (!drawer || !menuButton) return;

    drawer.classList.toggle('open', open);
    scrim?.classList.toggle('show', open);
    menuButton.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('menu-open', open);
    setDrawerInert();

    if (open) {
      lastFocused = document.activeElement;
      closeButton?.focus();
      setInert(true);
    } else {
      setInert(false);
      lastFocused?.focus?.();
    }
  };

  setDrawerInert();

  menuButton?.addEventListener('click', () => {
    const isOpen = drawer?.classList.contains('open');
    setMenu(!isOpen);
  });

  closeButton?.addEventListener('click', () => setMenu(false));
  scrim?.addEventListener('click', () => setMenu(false));
  qsa('.mobile-drawer a').forEach((a) =>
    a.addEventListener('click', () => setMenu(false))
  );

  /* ======================================================================
     Lightbox — accessible image gallery viewer
   ====================================================================== */

  const lightbox = qs('.lightbox');
  const lbImg = lightbox ? qs('.lightbox-inner img', lightbox) : null;
  const lbCap = lightbox ? qs('.lightbox-cap', lightbox) : null;
  const lbCounter = lightbox ? qs('.lightbox-counter', lightbox) : null;
  const galleryItems = qsa('.gallery-item[data-lightbox]');
  let galleryIndex = 0;
  let lightboxReturnFocus = null;

  const renderLightbox = () => {
    const item = galleryItems[galleryIndex];
    if (!item || !lightbox) return;
    const image = qs('img', item);
    lbImg.src = image.currentSrc || image.src;
    lbImg.alt = image.alt || '';
    lbCap.textContent = image.alt || '';
    if (lbCounter) {
      lbCounter.textContent = `${galleryIndex + 1} / ${galleryItems.length}`;
    }
  };

  const openLightbox = (index) => {
    if (!lightbox || !galleryItems.length) return;
    galleryIndex = index;
    lightboxReturnFocus = document.activeElement;
    renderLightbox();
    lightbox.classList.add('open');
    setInert(true);
    document.body.classList.add('lightbox-open');
    qs('.lightbox-close', lightbox)?.focus();
    track('gallery_open', { index: index + 1, total: galleryItems.length });
  };

  const closeLightbox = () => {
    if (!lightbox?.classList.contains('open')) return;
    lightbox.classList.remove('open');
    document.body.classList.remove('lightbox-open');
    setInert(false);
    lightboxReturnFocus?.focus?.();
  };

  const stepLightbox = (direction) => {
    if (!galleryItems.length) return;
    galleryIndex = (galleryIndex + direction + galleryItems.length) % galleryItems.length;
    renderLightbox();
  };

  if (lightbox && galleryItems.length) {
    galleryItems.forEach((item, index) => {
      item.setAttribute('tabindex', '0');
      item.setAttribute('role', 'button');
      item.setAttribute(
        'aria-label',
        `Open image ${index + 1}: ${qs('img', item)?.alt || 'gallery photo'}`
      );
      item.addEventListener('click', () => openLightbox(index));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(index);
        }
      });
    });

    qs('.lightbox-close')?.addEventListener('click', closeLightbox);
    qs('.lightbox-prev')?.addEventListener('click', () => stepLightbox(-1));
    qs('.lightbox-next')?.addEventListener('click', () => stepLightbox(1));

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-inner')) {
        closeLightbox();
      }
    });
  }

  /* ======================================================================
     Document-level keyboard handling (drawer + lightbox)
   ====================================================================== */

  document.addEventListener('keydown', (event) => {
    const drawerOpen = drawer?.classList.contains('open');
    const lightboxOpen = lightbox?.classList.contains('open');

    if (event.key === 'Escape') {
      if (lightboxOpen) closeLightbox();
      if (drawerOpen) setMenu(false);
      return;
    }

    if (drawerOpen) {
      const focusables = qsa(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
        drawer
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.key === 'Tab') {
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      return;
    }

    if (lightboxOpen) {
      if (event.key === 'ArrowLeft') stepLightbox(-1);
      if (event.key === 'ArrowRight') stepLightbox(1);
      if (event.key === 'Tab') {
        const buttons = qsa('button, [tabindex]', lightbox).filter(
          (el) => el.getAttribute('tabindex') !== '-1'
        );
        if (!buttons.length) return;
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
  });

  /* ======================================================================
     Reveal-on-scroll (disabled for reduced-motion users)
   ====================================================================== */

  const revealEls = qsa('.reveal');

  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('visible'));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  }

  /* ======================================================================
     Back to top
   ====================================================================== */

  const top = qs('.back-to-top');
  if (top) {
    const updateTop = () => top.classList.toggle('show', window.scrollY > 500);
    window.addEventListener('scroll', updateTop, { passive: true });
    updateTop();
    top.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  }

  /* ======================================================================
     Forms — client validation + honest API submission
     ----------------------------------------------------------------------
     Flow: validate -> Honeypot check -> POST /api/enquiry -> success/error.
     The page only ever claims success after the API confirms it.
   ====================================================================== */

  const validateField = (field) => {
    const container = field.closest('.field');
    const errorEl = container ? qs('.error-msg', container) : null;
    const value = field.value.trim();
    const rule = field.dataset.rule || 'required';
    let valid = true;

    if (value === '') {
      if (field.required || rule === 'class') valid = false;
    } else if (rule === 'text' && value.length < 2) {
      valid = false;
    } else if (rule === 'phone' && !/^[6-9]\d{9}$/.test(value.replace(/\D/g, ''))) {
      valid = false;
    } else if (rule === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      valid = false;
    }

    container?.classList.toggle('invalid', !valid);
    field.setAttribute('aria-invalid', String(!valid));
    if (errorEl) {
      errorEl.setAttribute('role', valid ? '' : 'alert');
    }

    return valid;
  };

  const wireAria = (form) => {
    qsa('input, select, textarea', form).forEach((field) => {
      const container = field.closest('.field');
      const errorEl = container ? qs('.error-msg', container) : null;
      if (errorEl && field.id) {
        errorEl.id = `error-${field.id}`;
        field.setAttribute('aria-describedby', `error-${field.id}`);
      }
    });
  };

  const setStatus = (statusEl, variant, message, allowHtml = false) => {
    if (!statusEl) return;
    statusEl.className = `form-status ${variant}`;
    if (message === '') {
      statusEl.textContent = '';
      statusEl.removeAttribute('role');
      return;
    }
    if (allowHtml) {
      statusEl.innerHTML = message;
    } else {
      statusEl.textContent = message;
    }
    statusEl.setAttribute('role', variant === 'error' ? 'alert' : 'status');
  };

  qsa('form[data-validate]').forEach((form) => {
    const fields = qsa('input:not([type="hidden"]), select, textarea', form);
    const status = qs('.form-status', form.closest('.form-card')) || qs('.form-status', form);
    const submit = qs('button[type="submit"]', form);
    let started = false;

    wireAria(form);

    const markFormStart = () => {
      if (started) return;
      started = true;
      track('form_start', { form_type: form.dataset.formType || 'general' });
    };

    fields.forEach((field) => {
      field.addEventListener('focusin', markFormStart);
      field.addEventListener('blur', () => validateField(field));
      field.addEventListener('input', () => {
        if (field.closest('.field')?.classList.contains('invalid')) {
          validateField(field);
        }
      });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      markFormStart();

      const valid = fields.every(validateField);
      if (!valid) {
        setStatus(
          status,
          'error',
          'Please check the highlighted fields and try again.'
        );
        const firstInvalid = qs('.field.invalid input, .field.invalid select, .field.invalid textarea', form);
        firstInvalid?.focus();
        return;
      }

      // Honeypot silently rejects bots without telling them they were caught.
      const honeypot = qs('[name="website"]', form);
      if (honeypot?.value) {
        setStatus(status, 'success', 'Your enquiry has been submitted successfully. Our team will contact you shortly.');
        return;
      }

      const payload = Object.fromEntries(new FormData(form).entries());
      payload.page = location.pathname;
      payload.formType = form.dataset.formType || 'general';

      track('form_submit', { form_type: payload.formType });

      submit.disabled = true;
      const originalLabel = submit.textContent;
      submit.textContent = 'Sending…';
      setStatus(status, '', 'Sending your enquiry securely…');

      try {
        const response = await fetch('/api/enquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.message || 'The enquiry service is not configured yet.');
        }

        form.reset();
        fields.forEach((f) => {
          f.closest('.field')?.classList.remove('invalid');
          f.removeAttribute('aria-invalid');
        });

        setStatus(
          status,
          'success',
          result.message || 'Your enquiry has been submitted successfully. Our team will contact you shortly.'
        );
        track('form_success', { form_type: payload.formType });
      } catch (err) {
        setStatus(
          status,
          'error',
          `We couldn't submit your enquiry right now. Please try again, or call <a href="tel:+919839542475">+91 98395 42475</a> or message the <a href="https://wa.me/919839542475" target="_blank" rel="noopener">admissions desk on WhatsApp</a>.`,
          true
        );
        track('form_error', { form_type: payload.formType });
      } finally {
        submit.disabled = false;
        submit.textContent = originalLabel;
      }
    });
  });
})();