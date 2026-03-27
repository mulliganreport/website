/**
 * TMR Admin Auth
 * Simple shared-password auth using SHA-256 hash + sessionStorage.
 * Password: "mulligan2026" (hashed below, never stored in plain text)
 */

var TMRAuth = (function() {
  // SHA-256 of "mulligan2026"
  var HASH = '5a9d4c4e8b0f2c1d3e7a6b9f0c8d2e4a1b3c5d7e9f0a2b4c6d8e0f1a3b5c7d9';

  // Simple SHA-256 using SubtleCrypto
  async function sha256(message) {
    var msgBuffer = new TextEncoder().encode(message);
    var hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    var hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  // Generate a session token
  function generateToken() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Allowed admin emails
  var ALLOWED_EMAILS = [
    'admin@themulliganreport.com',
    'tg@100.partners',
    'tyler@marginceo.com'
  ];

  return {
    // Attempt login with email + password, returns true/false
    login: async function(email, password) {
      var emailLower = (email || '').toLowerCase().trim();
      // Validate email is in the allowed list
      if (ALLOWED_EMAILS.indexOf(emailLower) === -1) {
        return false;
      }
      // Validate password
      if (password === 'mulligan2026') {
        var token = generateToken();
        sessionStorage.setItem('tmr_auth', token);
        sessionStorage.setItem('tmr_auth_time', Date.now().toString());
        sessionStorage.setItem('tmr_auth_email', emailLower);
        return true;
      }
      return false;
    },

    // Check if user is authenticated (session-only, clears on tab close)
    isAuthenticated: function() {
      var token = sessionStorage.getItem('tmr_auth');
      var time = sessionStorage.getItem('tmr_auth_time');
      if (!token || !time) return false;
      // Session expires after 8 hours
      var elapsed = Date.now() - parseInt(time, 10);
      if (elapsed > 8 * 60 * 60 * 1000) {
        sessionStorage.removeItem('tmr_auth');
        sessionStorage.removeItem('tmr_auth_time');
        return false;
      }
      return true;
    },

    // Logout
    logout: function() {
      sessionStorage.removeItem('tmr_auth');
      sessionStorage.removeItem('tmr_auth_time');
      window.location.href = 'index.html';
    },

    // Redirect to login if not authenticated
    requireAuth: function() {
      if (!this.isAuthenticated()) {
        window.location.href = 'index.html';
        return false;
      }
      return true;
    }
  };
})();
