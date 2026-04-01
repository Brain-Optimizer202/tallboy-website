/* ═══════════════════════════════════════════════════════════
   TallBoy Bar — Site JavaScript
   Handles: nav, API data loading, forms, interactions
   ═══════════════════════════════════════════════════════════ */

var TALLBOY_API = 'https://tallboy-backend-production.up.railway.app';
var VENUE_ID = 'tallboy';

/* ── Mobile Nav Toggle ──────────────────────────────────── */

function toggleNav() {
  var links = document.querySelector('.nav-links');
  if (links) links.classList.toggle('open');
}

document.addEventListener('click', function(e) {
  var links = document.querySelector('.nav-links');
  if (links && links.classList.contains('open') && !e.target.closest('.nav')) {
    links.classList.remove('open');
  }
});

/* ── Active Nav Highlight ───────────────────────────────── */

(function() {
  var path = window.location.pathname.split('/').pop() || 'index.html';
  var links = document.querySelectorAll('.nav-links a');
  links.forEach(function(a) {
    var href = a.getAttribute('href');
    if (href === path || (path === 'index.html' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

/* ── API Helper ─────────────────────────────────────────── */

function apiGet(endpoint, callback) {
  var separator = endpoint.indexOf('?') >= 0 ? '&' : '?';
  var url = TALLBOY_API + endpoint + separator + 'venue_id=' + VENUE_ID;
  fetch(url)
    .then(function(r) { return r.json(); })
    .then(callback)
    .catch(function(err) {
      console.error('API error (' + endpoint + '):', err);
    });
}

/* ── Load Events Calendar ───────────────────────────────── */

function loadEventsCalendar() {
  var container = document.getElementById('events-calendar');
  if (!container) return;

  apiGet('/api/events/calendar', function(data) {
    if (!data || !data.calendar) {
      container.innerHTML = '<p class="loading-placeholder">Events calendar coming soon.</p>';
      return;
    }

    var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    var html = '<div class="events-week">';

    days.forEach(function(day) {
      var events = data.calendar[day.toLowerCase()] || [];
      html += '<div class="event-day">';
      html += '<div class="event-day-label">' + day.substring(0, 3) + '</div>';

      if (events.length === 0) {
        html += '<div class="event-item"><div class="event-item-name" style="color: var(--text-muted);">Open bar night</div></div>';
      } else {
        events.forEach(function(ev) {
          html += '<div class="event-item">';
          html += '<div class="event-item-name">' + escapeHtml(ev.name) + '</div>';
          if (ev.start_time) {
            html += '<div class="event-item-time">' + escapeHtml(ev.start_time) + '</div>';
          }
          html += '</div>';
        });
      }

      html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
  });
}

/* ── Load Convention Center Events ──────────────────────── */

function loadConventions() {
  var container = document.getElementById('conventions-list');
  if (!container) return;

  apiGet('/api/conventions/next?count=5', function(data) {
    var events = data.events || data || [];
    if (!Array.isArray(events) || events.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No upcoming convention events.</p>';
      return;
    }

    var html = '<div class="convention-list">';
    events.forEach(function(ev) {
      html += '<div class="convention-item">';
      html += '<div class="convention-item-name">' + escapeHtml(ev.event_name || ev.name) + '</div>';
      if (ev.start_date) {
        var dateStr = formatDate(ev.start_date);
        if (ev.end_date && ev.end_date !== ev.start_date) {
          dateStr += ' — ' + formatDate(ev.end_date);
        }
        html += '<div class="convention-item-date">' + dateStr + '</div>';
      }
      if (ev.expected_attendance) {
        html += '<div class="convention-item-attendance">' + Number(ev.expected_attendance).toLocaleString() + '+ expected attendees</div>';
      }
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  });
}

/* ── Load Active Events List ────────────────────────────── */

function loadEventsList() {
  var container = document.getElementById('events-list');
  if (!container) return;

  apiGet('/api/events?status=active', function(data) {
    var events = data.events || data || [];
    if (!Array.isArray(events) || events.length === 0) {
      container.innerHTML = '<p class="loading-placeholder">Event lineup coming soon.</p>';
      return;
    }

    var html = '';
    events.forEach(function(ev) {
      html += '<div class="event-item" style="margin-bottom: 12px;">';
      html += '<div class="event-item-name" style="font-size: 1rem;">' + escapeHtml(ev.name) + '</div>';
      var details = [];
      if (ev.day_of_week) details.push(ev.day_of_week);
      if (ev.category) details.push(ev.category.replace(/_/g, ' '));
      if (details.length) {
        html += '<div class="event-item-time">' + escapeHtml(details.join(' · ')) + '</div>';
      }
      if (ev.description) {
        html += '<p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 4px;">' + escapeHtml(ev.description) + '</p>';
      }
      html += '</div>';
    });
    container.innerHTML = html;
  });
}

/* ── Event Inquiry Form ────────────────────────────────── */

function submitEventForm(e) {
  e.preventDefault();
  var form = e.target;
  var btn = form.querySelector('button[type="submit"]');
  var name = form.querySelector('[name="name"]').value.trim();
  var email = form.querySelector('[name="email"]').value.trim();
  var phone = form.querySelector('[name="phone"]').value.trim();
  var eventType = form.querySelector('[name="event_type"]').value;
  var message = form.querySelector('[name="message"]').value.trim();

  if (!name || !email) {
    showToast('Please fill in your name and email.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Sending...';

  // Determine which page this form is on
  var sourcePage = 'private-events';
  if (window.location.pathname.indexOf('convention') >= 0) {
    sourcePage = 'convention';
  }

  var payload = {
    name: name,
    email: email,
    phone: phone,
    event_type: eventType,
    message: message,
    source_page: sourcePage,
    venue_id: VENUE_ID
  };

  fetch(TALLBOY_API + '/api/inquiries/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(function(response) {
    if (!response.ok) throw new Error('Server error');
    return response.json();
  })
  .then(function(data) {
    btn.disabled = false;
    btn.textContent = 'Send Inquiry';
    form.reset();
    showToast(data.message || 'Thanks! We\'ll be in touch soon.');
  })
  .catch(function(err) {
    console.error('Form submission error:', err);
    btn.disabled = false;
    btn.textContent = 'Send Inquiry';
    // Fallback to mailto if the API is down
    var subject = encodeURIComponent('Event Inquiry: ' + eventType);
    var body = encodeURIComponent(
      'Name: ' + name + '\n' +
      'Email: ' + email + '\n' +
      'Phone: ' + phone + '\n' +
      'Event Type: ' + eventType + '\n\n' +
      message
    );
    window.location.href = 'mailto:Contact@TallBoyBar.com?subject=' + subject + '&body=' + body;
    showToast('Opening your email client as backup...');
  });
}

/* ── Email Signup ───────────────────────────────────────── */

function submitEmailSignup(e) {
  e.preventDefault();
  var input = e.target.querySelector('input[type="email"]');
  var btn = e.target.querySelector('button[type="submit"]');
  var email = input.value.trim();
  if (!email) return;

  btn.disabled = true;
  btn.textContent = 'Signing up...';

  fetch(TALLBOY_API + '/api/email/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, source: 'website_footer' })
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {
    btn.disabled = false;
    btn.textContent = 'Sign Up';
    input.value = '';
    showToast(data.message || 'You\'re on the list!');
  })
  .catch(function(err) {
    btn.disabled = false;
    btn.textContent = 'Sign Up';
    input.value = '';
    showToast('Thanks! We\'ll keep you posted.');
  });
}

/* ── Toast Notification ─────────────────────────────────── */

function showToast(msg) {
  var existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  var el = document.createElement('div');
  el.className = 'toast-notification show';
  el.textContent = msg;
  document.body.appendChild(el);

  setTimeout(function() {
    el.classList.remove('show');
    setTimeout(function() { el.remove(); }, 300);
  }, 3000);
}

/* ── Utilities ──────────────────────────────────────────── */

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    var d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) { return dateStr; }
}

/* ═══════════════════════════════════════════════════════════
   ROUND 2 — Scroll, Lightbox, Mascot, Open/Close, Nav
   ═══════════════════════════════════════════════════════════ */

/* ── Nav: Shrink + border on scroll ────────────────────── */

window.addEventListener('scroll', function() {
  var nav = document.querySelector('.nav');
  if (!nav) return;
  if (window.scrollY > 60) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
});

/* ── Scroll Reveal Observer ────────────────────────────── */

function initScrollReveals() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: just show everything
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-stagger').forEach(function(el) {
      el.classList.add('visible');
    });
    return;
  }

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-stagger').forEach(function(el) {
    observer.observe(el);
  });
}

/* ── Mascot Walk Divider Observer ──────────────────────── */

function initMascotWalks() {
  var dividers = document.querySelectorAll('[data-mascot-walk]');
  if (!dividers.length || !('IntersectionObserver' in window)) return;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        var mascot = entry.target.querySelector('.mascot');
        if (mascot && !mascot.classList.contains('walking')) {
          mascot.classList.add('walking');
        }
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  dividers.forEach(function(d) { observer.observe(d); });
}

/* ── Mascot Click Easter Egg ───────────────────────────── */

function initMascotClicks() {
  document.querySelectorAll('.mascot').forEach(function(m) {
    m.addEventListener('click', function(e) {
      e.stopPropagation();
      var img = m.querySelector('img');
      if (!img) return;
      m.classList.remove('spinning');
      // Force reflow to restart animation
      void m.offsetWidth;
      m.classList.add('spinning');
      setTimeout(function() { m.classList.remove('spinning'); }, 700);
    });
  });
}

/* ── Mascot Hero Wave after idle ───────────────────────── */

function initMascotWave() {
  var hero = document.getElementById('mascot-hero');
  if (!hero) return;
  setInterval(function() {
    hero.classList.remove('waving');
    void hero.offsetWidth;
    hero.classList.add('waving');
    setTimeout(function() { hero.classList.remove('waving'); }, 1300);
  }, 8000);
}

/* ── Lightbox ──────────────────────────────────────────── */

function initLightbox() {
  var overlay = document.getElementById('lightbox');
  var lbImg = document.getElementById('lightbox-img');
  if (!overlay || !lbImg) return;

  document.querySelectorAll('[data-lightbox]').forEach(function(photo) {
    photo.addEventListener('click', function() {
      var img = photo.querySelector('img');
      if (!img) return;
      lbImg.src = img.src;
      lbImg.alt = img.alt;
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay || e.target.classList.contains('lightbox-close')) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

/* ── Open Now / Closed Badge ───────────────────────────── */

function initOpenNow() {
  var badge = document.getElementById('open-now-badge');
  var text = document.getElementById('open-now-text');
  if (!badge || !text) return;

  function checkOpen() {
    // TallBoy hours in ET
    var now = new Date();
    var et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    var day = et.getDay(); // 0=Sun
    var hour = et.getHours();
    var min = et.getMinutes();
    var t = hour + min / 60;

    var isOpen = false;
    var closeText = '';

    if (day >= 1 && day <= 4) {
      // Mon-Thu: 4pm-2am (next day)
      isOpen = t >= 16 || t < 2;
      closeText = 'til 2am';
    } else if (day === 5) {
      // Fri: 4pm-3am
      isOpen = t >= 16 || t < 3;
      closeText = 'til 3am';
    } else if (day === 6) {
      // Sat: 12pm-3am
      isOpen = t >= 12 || t < 3;
      closeText = 'til 3am';
    } else {
      // Sun: 12pm-2am (Mon)
      isOpen = t >= 12 || t < 2;
      closeText = 'til 2am';
    }

    badge.style.display = 'inline-flex';
    if (isOpen) {
      badge.classList.remove('closed');
      text.textContent = 'Open Now ' + closeText;
    } else {
      badge.classList.add('closed');
      // Figure out when we open next
      if (day === 0 || day === 6) {
        text.textContent = 'Opens at 12pm';
      } else {
        text.textContent = 'Opens at 4pm';
      }
    }
  }

  checkOpen();
  setInterval(checkOpen, 60000);
}

/* ── Tonight Highlight on Events Grid ──────────────────── */

function initTonightHighlight() {
  var grid = document.getElementById('events-week-home');
  if (!grid) return;

  var now = new Date();
  var et = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  var day = et.getDay(); // 0=Sun, 1=Mon...

  // Map JS day (0=Sun) to our event-day order (Mon=0, Tue=1... Sun=6)
  var dayMap = [6, 0, 1, 2, 3, 4, 5]; // JS Sun=0 -> our index 6
  var todayIdx = dayMap[day];

  var days = grid.querySelectorAll('.event-day');
  if (days[todayIdx]) {
    days[todayIdx].classList.add('tonight');
  }
}

/* ── Init on DOM ready ──────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function() {
  loadEventsCalendar();
  loadConventions();
  loadEventsList();
  initScrollReveals();
  initMascotWalks();
  initMascotClicks();
  initMascotWave();
  initLightbox();
  initOpenNow();
  initTonightHighlight();
});
