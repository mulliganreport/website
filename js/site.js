/* ============================================
   THE MULLIGAN REPORT - Shared Site JS
   ============================================ */

// --- Subscribe Modal ---
function openSubscribe() {
  const modal = document.getElementById('subscribe-modal');
  if (modal) {
    modal.classList.add('subscribe-modal--open');
    document.body.style.overflow = 'hidden';
  }
}

function closeSubscribe() {
  const modal = document.getElementById('subscribe-modal');
  if (modal) {
    modal.classList.remove('subscribe-modal--open');
    document.body.style.overflow = '';
  }
}

// Close modal on backdrop click
document.addEventListener('click', function(e) {
  const modal = document.getElementById('subscribe-modal');
  if (modal && e.target === modal) {
    closeSubscribe();
  }
});

// Close modal on Escape
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeSubscribe();
});

// --- Mobile Nav Toggle ---
function toggleNav() {
  const nav = document.querySelector('.site-header__nav');
  if (nav) nav.classList.toggle('site-header__nav--open');
}

// --- Content Gate (Soft Paywall) ---
const TMR_GATE = {
  FREE_ARTICLES: 3,
  STORAGE_KEY: 'tmr_articles_read',

  getCount: function() {
    try {
      return parseInt(localStorage.getItem(this.STORAGE_KEY) || '0', 10);
    } catch (e) {
      return 0;
    }
  },

  increment: function() {
    try {
      const count = this.getCount() + 1;
      localStorage.setItem(this.STORAGE_KEY, count.toString());
      return count;
    } catch (e) {
      return 0;
    }
  },

  isGated: function() {
    return this.getCount() >= this.FREE_ARTICLES;
  },

  // Call on article pages to check + apply gate
  checkGate: function() {
    if (this.isGated()) {
      const gate = document.getElementById('content-gate');
      if (gate) gate.style.display = 'block';

      const content = document.querySelector('.article__body');
      if (content) {
        content.style.maxHeight = '400px';
        content.style.overflow = 'hidden';
      }
    }
  },

  // Call when a subscriber is confirmed (cookie/token)
  unlock: function() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) { /* noop */ }
    const gate = document.getElementById('content-gate');
    if (gate) gate.style.display = 'none';
    const content = document.querySelector('.article__body');
    if (content) {
      content.style.maxHeight = '';
      content.style.overflow = '';
    }
  }
};

// --- Subscribe Form Handler (placeholder for Resend integration) ---
function handleSubscribe(e) {
  e.preventDefault();
  const form = e.target;
  const email = form.querySelector('input[type="email"]').value;
  const name = form.querySelector('input[type="text"]')?.value || '';

  if (!email) return;

  // TODO: Connect to Resend API
  // For now, show success state
  const btn = form.querySelector('button[type="submit"], .subscribe-modal__btn, .site-footer__submit, .content-gate__btn');
  if (btn) {
    const originalText = btn.textContent;
    btn.textContent = 'You\'re In!';
    btn.style.background = 'var(--fairway)';
    setTimeout(function() {
      btn.textContent = originalText;
      btn.style.background = '';
      closeSubscribe();
    }, 2000);
  }

  // Unlock gated content
  TMR_GATE.unlock();
}

// Bind all subscribe forms
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.js-subscribe-form').forEach(function(form) {
    form.addEventListener('submit', handleSubscribe);
  });
});

// --- Smooth scroll for nav ---
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// --- Active nav highlighting ---
document.addEventListener('DOMContentLoaded', function() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.site-header__link').forEach(function(link) {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('site-header__link--active');
    }
  });
});
