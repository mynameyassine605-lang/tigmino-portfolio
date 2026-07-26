/* ============================================================
   PAGE LOADER — Conveyor Loop (vanilla JS)
   ASCII-style staggered block trail on a fixed text track
   ============================================================ */
(function () {

  // ── CONVEYOR CONFIG ──────────────────────────────────────
  var TRACK    = '░░░░░░░░░░░░░░░░░░░░';  // base track chars
  var BLOCKS   = ['█', '▓', '▒', '░'];    // trail gradient
  var TRAIL    = 6;                         // trail length
  var SPEED    = 55;                        // ms per frame
  var TRACK_W  = 20;                        // track width in chars

  var pos      = 0;
  var timer    = null;
  var loader   = null;
  var fill     = null;
  var trackEl  = null;
  var progress = 0;

  // ── BUILD LOADER HTML ────────────────────────────────────
  function buildLoader() {
    loader = document.createElement('div');
    loader.id = 'page-loader';
    loader.setAttribute('role', 'status');
    loader.setAttribute('aria-label', 'Loading');

    // logo
    var logo = document.createElement('img');
    logo.src = 'img/logo-04.png';
    logo.alt = 'Tigmino';
    logo.className = 'loader__logo';
    logo.onerror = function () { this.style.display = 'none'; };

    // conveyor row
    var conveyor = document.createElement('div');
    conveyor.className = 'loader__conveyor';

    trackEl = document.createElement('span');
    trackEl.className = 'loader__track';
    var inner = document.createElement('span');
    inner.className = 'loader__track-inner';
    inner.textContent = TRACK;
    trackEl.appendChild(inner);

    var label = document.createElement('span');
    label.className = 'loader__label';
    label.textContent = 'Loading';

    conveyor.appendChild(trackEl);
    conveyor.appendChild(label);

    // progress bar
    var bar = document.createElement('div');
    bar.className = 'loader__bar';
    fill = document.createElement('div');
    fill.className = 'loader__bar-fill';
    bar.appendChild(fill);

    loader.appendChild(logo);
    loader.appendChild(conveyor);
    loader.appendChild(bar);

    document.body.insertBefore(loader, document.body.firstChild);
  }

  // ── CONVEYOR ANIMATION ───────────────────────────────────
  function getFrame() {
    var chars = TRACK.split('');
    for (var t = 0; t < TRAIL; t++) {
      var idx = (pos - t + TRACK_W * 10) % TRACK_W;
      var blockIdx = Math.min(t, BLOCKS.length - 1);
      chars[idx] = BLOCKS[blockIdx];
    }
    return chars.join('');
  }

  function tick() {
    pos = (pos + 1) % TRACK_W;
    var inner = trackEl.querySelector('.loader__track-inner');
    if (inner) inner.textContent = getFrame();

    // fake progress
    if (progress < 85) {
      progress += Math.random() * 3.5;
      fill.style.width = Math.min(progress, 85) + '%';
    }
  }

  // ── HIDE LOADER ──────────────────────────────────────────
  function hideLoader() {
    clearInterval(timer);
    // fill to 100% first
    fill.style.width = '100%';
    setTimeout(function () {
      loader.classList.add('is-hidden');
      // remove from DOM after transition
      setTimeout(function () {
        if (loader && loader.parentNode) {
          loader.parentNode.removeChild(loader);
        }
      }, 700);
    }, 320);
  }

  // ── INIT ─────────────────────────────────────────────────
  function init() {
    buildLoader();
    timer = setInterval(tick, SPEED);

    // hide when page fully loaded
    if (document.readyState === 'complete') {
      setTimeout(hideLoader, 600);
    } else {
      window.addEventListener('load', function () {
        setTimeout(hideLoader, 400);
      });
    }

    // safety fallback — never block more than 4s
    setTimeout(hideLoader, 4000);
  }

  // run immediately — loader shows before anything else
  init();

})();
