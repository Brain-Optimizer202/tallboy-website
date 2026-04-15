/* ═══════════════════════════════════════════════════════════
   TallBoy Beer List — Dynamic Renderer
   Fetches beer-list.json and renders the tap list on menu.html
   ═══════════════════════════════════════════════════════════ */

(function() {
  const BEER_LIST_URL = 'https://tallboy-beer-sync.peter-50f.workers.dev/beer-list.json';

  const CATEGORY_COLORS = {
    'LIGHT + BRIGHT': '#d4a437',
    'HOPPY': '#4caf50',
    'TOASTY': '#d43a2f',
    'FRUITY': '#e040a0'
  };

  function renderBeerList(beers) {
    const container = document.getElementById('live-beer-list');
    if (!container) return;

    // Group by category
    const categories = {};
    beers.forEach(b => {
      const cat = b.category || 'Other';
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(b);
    });

    let html = '';

    Object.entries(categories).forEach(([cat, items]) => {
      const color = CATEGORY_COLORS[cat] || '#3a7bd5';

      html += `<div class="beer-cat-section">`;
      html += `<h4 class="beer-cat-header" style="border-left: 3px solid ${color}; padding-left: 16px; font-family: 'Bangers', cursive; font-size: 1.4rem; text-transform: uppercase; letter-spacing: 0.04em; color: ${color}; margin-bottom: 16px;">${cat}</h4>`;
      html += `<div class="beer-cat-items">`;

      items.forEach(beer => {
        html += `<div class="beer-tap-item" style="display: flex; justify-content: space-between; align-items: baseline; padding: 10px 0 10px 16px; border-bottom: 1px dotted rgba(255,255,255,0.06);">`;
        html += `<div style="flex: 1; min-width: 0;">`;
        html += `<div style="display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap;">`;
        html += `<span class="beer-name" style="font-family: 'Bangers', cursive; font-size: 1.05rem; letter-spacing: 0.03em;">${beer.name}</span>`;
        if (beer.abv) {
          html += `<span style="font-size: 0.75rem; color: ${color}; font-weight: 600;">${beer.abv}</span>`;
        }
        html += `</div>`;
        if (beer.origin || beer.style) {
          html += `<div style="font-size: 0.75rem; color: #777; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 1px;">${[beer.origin, beer.style].filter(Boolean).join(' · ')}</div>`;
        }
        if (beer.story) {
          html += `<div style="font-size: 0.8rem; color: #b0aca6; font-style: italic; margin-top: 2px;">${beer.story}</div>`;
        }
        html += `</div>`;
        html += `<div style="display: flex; align-items: baseline; gap: 12px; margin-left: 16px; white-space: nowrap;">`;
        if (beer.size) {
          html += `<span style="font-size: 0.7rem; color: #777; text-transform: uppercase;">${beer.size}</span>`;
        }
        if (beer.price) {
          html += `<span style="font-family: 'Bangers', cursive; font-size: 1.1rem; color: #d43a2f;">${beer.price}</span>`;
        }
        html += `</div>`;
        html += `</div>`;
      });

      html += `</div></div>`;
    });

    container.innerHTML = html;

    // Update the "last updated" timestamp if present
    const ts = document.getElementById('beer-list-updated');
    if (ts && window._beerListUpdated) {
      const d = new Date(window._beerListUpdated);
      ts.textContent = 'Last updated: ' + d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
  }

  function loadBeerList() {
    fetch(BEER_LIST_URL)
      .then(r => {
        if (!r.ok) throw new Error('No beer list found');
        return r.json();
      })
      .then(data => {
        if (data.updated) window._beerListUpdated = data.updated;
        if (data.beers && data.beers.length > 0) {
          renderBeerList(data.beers);
        }
      })
      .catch(() => {
        // Silently fail — the static fallback content stays visible
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadBeerList);
  } else {
    loadBeerList();
  }
})();
