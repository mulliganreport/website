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

// --- Resend API config ---
var TMR_API = 'https://tmr-api.themulliganreport.workers.dev';

// --- Subscribe Form Handler (Resend integration) ---
function handleSubscribe(e) {
  e.preventDefault();
  var form = e.target;
  var emailInput = form.querySelector('input[type="email"]');
  var nameInput = form.querySelector('input[type="text"]');
  var email = emailInput ? emailInput.value.trim() : '';
  var firstName = nameInput ? nameInput.value.trim() : '';

  if (!email) return;

  // Detect source from form location
  var source = 'website';
  if (form.closest('.subscribe-modal')) source = 'modal';
  else if (form.closest('.site-footer')) source = 'footer';
  else if (form.closest('.content-gate')) source = 'content-gate';
  else if (form.closest('.optin-bar')) source = 'optin-bar';
  else if (form.closest('.article__subscribe')) source = 'inline-article';

  // Add page context
  var page = window.location.pathname.replace(/\/$/, '') || 'home';
  var fullSource = source + ':' + page;

  var btn = form.querySelector('button[type="submit"]');
  var originalText = btn ? btn.textContent : '';
  if (btn) {
    btn.textContent = 'Subscribing...';
    btn.disabled = true;
  }

  fetch(TMR_API + '/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: email,
      first_name: firstName,
      source: fullSource
    })
  })
  .then(function(res) { return res.json(); })
  .then(function(data) {
    if (data.success) {
      if (btn) {
        btn.textContent = "You're In!";
        btn.style.background = 'var(--fairway)';
      }
      // Clear form
      if (emailInput) emailInput.value = '';
      if (nameInput) nameInput.value = '';
      // Mark as subscribed in localStorage
      try { localStorage.setItem('tmr_subscribed', 'true'); } catch (e) {}
      // Unlock gated content
      TMR_GATE.unlock();
      setTimeout(function() {
        if (btn) {
          btn.textContent = originalText;
          btn.style.background = '';
          btn.disabled = false;
        }
        closeSubscribe();
      }, 2000);
    } else {
      if (btn) {
        btn.textContent = data.error || 'Try again';
        btn.style.background = '#c0392b';
        setTimeout(function() {
          btn.textContent = originalText;
          btn.style.background = '';
          btn.disabled = false;
        }, 2500);
      }
    }
  })
  .catch(function() {
    if (btn) {
      btn.textContent = 'Connection error';
      btn.style.background = '#c0392b';
      setTimeout(function() {
        btn.textContent = originalText;
        btn.style.background = '';
        btn.disabled = false;
      }, 2500);
    }
  });
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
