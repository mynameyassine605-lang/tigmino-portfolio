/* ============================================================
   PROJECT EXPLORER — V2 Polish
   Premium archive feel. No reload. No URL change.
   Keyboard nav · touch swipe · image fade-in · loading states
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (typeof PORTFOLIO_DATA === 'undefined') return;

  const { categoryOrder, categories, projects } = PORTFOLIO_DATA;

  const explorer    = document.getElementById('explorer');
  const accordionEl = document.getElementById('explorerAccordion');
  const contentEl   = document.getElementById('explorerContent');

  let currentCategory  = categoryOrder[0];
  let currentProjectId = projects[currentCategory][0]?.id;
  let galleryImages    = [];
  let isTransitioning  = false;

  // ── helpers ──────────────────────────────────────────────────
  function findProject(id) {
    for (const slug of categoryOrder) {
      const p = projects[slug].find(p => p.id === id);
      if (p) return { project: p, slug };
    }
    return null;
  }

  function allProjectsFlat() {
    return categoryOrder.flatMap(slug => projects[slug]);
  }

  function adjacentProject(dir) {
    const flat = allProjectsFlat();
    const i    = flat.findIndex(p => p.id === currentProjectId);
    return flat[(i + dir + flat.length) % flat.length];
  }

  // ── SIDEBAR ──────────────────────────────────────────────────
  function renderSidebar() {
    accordionEl.innerHTML = categoryOrder.map(slug => {
      const cat    = categories[slug];
      const isOpen = slug === currentCategory;
      const count  = projects[slug].length;

      const links = projects[slug].map(p => {
        const isActive = p.id === currentProjectId;
        return `
          <button
            class="explorer__project-link${isActive ? ' is-active' : ''}"
            data-project-id="${p.id}"
            aria-current="${isActive ? 'true' : 'false'}"
          >${p.name}</button>`;
      }).join('');

      return `
        <div class="explorer__group${isOpen ? ' is-open' : ''}" data-category="${slug}">
          <button class="explorer__group-head" aria-expanded="${isOpen}">
            <span class="explorer__group-name">
              <span class="explorer__group-num">${cat.num}</span>
              ${cat.title}
            </span>
            <span class="explorer__group-meta">
              <span class="explorer__group-count">${count}</span>
              <span class="explorer__group-chevron" aria-hidden="true">▾</span>
            </span>
          </button>
          <div class="explorer__group-body" role="list">
            <div class="explorer__group-list">${links}</div>
          </div>
        </div>`;
    }).join('');

    // accordion toggle
    accordionEl.querySelectorAll('.explorer__group-head').forEach(head => {
      head.addEventListener('click', () => {
        const group = head.closest('.explorer__group');
        const isNowOpen = !group.classList.contains('is-open');
        group.classList.toggle('is-open', isNowOpen);
        head.setAttribute('aria-expanded', isNowOpen);
      });
    });

    // project selection
    accordionEl.querySelectorAll('.explorer__project-link').forEach(btn => {
      btn.addEventListener('click', () => selectProject(btn.dataset.projectId));
    });

    // scroll active link into view inside sidebar
    requestAnimationFrame(() => {
      const active = accordionEl.querySelector('.explorer__project-link.is-active');
      if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  // ── CONTENT ──────────────────────────────────────────────────
  function renderContent(project) {
    galleryImages = project.gallery;

    const galleryHtml = project.gallery.map((src, i) => {
      const isVideo = /\.mp4$/i.test(src);
      const media = isVideo
        // ? `<video src="${src}" autoplay loop muted playsinline></video>`
        // ? `<div class="explorer__video-wrap">
        //     <video src="${src}" autoplay loop muted playsinline class="explorer__video"></video>
        //     <button class="explorer__sound-btn" aria-label="Unmute video" title="Toggle sound">
        //       <svg class="icon-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        //         <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        //         <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
        //       </svg>
        //       <svg class="icon-unmuted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
        //         <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
        //         <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        //       </svg>
        //     </button>
        //   </div>`
        ? `<div class="explorer__video-wrap">
    <video src="${src}" autoplay loop muted playsinline class="explorer__video"></video>
    <div class="explorer__video-controls">
      <button class="explorer__sound-btn" aria-label="Unmute video">
        <svg class="icon-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
        </svg>
        <svg class="icon-unmuted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      </button>
      <div class="explorer__progress">
        <div class="explorer__progress-fill"></div>
      </div>
      <span class="explorer__timer">0:00</span>
      <button class="explorer__play-btn" aria-label="Pause video">
        <svg class="icon-pause" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
        </svg>
        <svg class="icon-play" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display:none">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      </button>
    </div>
  </div>`
        : `<img src="${src}" alt="${project.name} — image ${i + 1}" loading="lazy" decoding="async">`;
      return `
        <div class="explorer__masonry-item" data-gallery-index="${i}" role="button" tabindex="0" aria-label="View full size">
          ${media}
          <div class="explorer__masonry-zoom" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3h4M3 3v4M13 3h-4M13 3v4M3 13h4M3 13v-4M13 13h-4M13 13v-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
        </div>`;
    }).join('');

    const prevP = adjacentProject(-1);
    const nextP = adjacentProject(+1);

    contentEl.innerHTML = `
      <div class="explorer__content-inner" id="explorerContentInner">

        <div class="explorer__hero">
          <div class="explorer__hero-skeleton"></div>
          <img
            src="${project.cover}"
            alt="${project.name}"
            class="explorer__hero-img"
            decoding="async"
          >
        </div>

        <header class="explorer__project-header">
          <div class="explorer__project-meta">
            <span class="explorer__category">${project.category}</span>
            <span class="explorer__year">${project.year}</span>
          </div>
          <h2 class="explorer__title">${project.name}</h2>
          <p class="explorer__desc">${project.overview}</p>
        </header>

        <div class="cs-grid">
          ${project.industry ? `
          <div class="cs-block">
            <span class="cs-label">Industry</span>
            <span class="cs-value">${project.industry}</span>
          </div>` : ''}
          ${project.services && project.services.length ? `
          <div class="cs-block">
            <span class="cs-label">Services</span>
            <ul class="cs-list">${project.services.map(s => `<li>${s}</li>`).join('')}</ul>
          </div>` : ''}
          ${project.software && project.software.length ? `
          <div class="cs-block">
            <span class="cs-label">Software</span>
            <ul class="cs-list">${project.software.map(s => `<li>${s}</li>`).join('')}</ul>
          </div>` : ''}
          ${project.deliverables && project.deliverables.length ? `
          <div class="cs-block">
            <span class="cs-label">Deliverables</span>
            <ul class="cs-list">${project.deliverables.map(d => `<li>${d}</li>`).join('')}</ul>
          </div>` : ''}
        </div>

        ${project.challenge || project.solution || project.results ? `
        <div class="cs-sections">
          ${project.challenge ? `
          <div class="cs-section">
            <span class="cs-label">Challenge</span>
            <p class="cs-text">${project.challenge}</p>
          </div>` : ''}
          ${project.solution ? `
          <div class="cs-section">
            <span class="cs-label">Solution</span>
            <p class="cs-text">${project.solution}</p>
          </div>` : ''}
          ${project.results && project.results.length ? `
          <div class="cs-section">
            <span class="cs-label">Results</span>
            <ul class="cs-list cs-list--results">${project.results.map(r => `<li>${r}</li>`).join('')}</ul>
          </div>` : ''}
        </div>
        <div class="cs-divider"></div>
        ` : ''}

        <div class="explorer__gallery-header">
          <span class="explorer__gallery-label">Gallery</span>
          <span class="explorer__gallery-count">${project.gallery.length} ${project.gallery.length === 1 ? 'item' : 'items'}</span>
        </div>
        <div class="explorer__masonry" role="list">${galleryHtml}</div>

        <nav class="explorer__project-nav" aria-label="Project navigation">
          <button class="explorer__nav-btn" data-project-id="${prevP.id}">
            <span class="explorer__nav-dir">← Previous</span>
            <span class="explorer__nav-name">${prevP.name}</span>
          </button>
          <button class="explorer__nav-btn explorer__nav-btn--next" data-project-id="${nextP.id}">
            <span class="explorer__nav-dir">Next →</span>
            <span class="explorer__nav-name">${nextP.name}</span>
          </button>
        </nav>

      </div>`;

    // hero image fade-in once loaded
    const heroImg = contentEl.querySelector('.explorer__hero-img');
    if (heroImg.complete) {
      heroImg.classList.add('is-loaded');
    } else {
      heroImg.addEventListener('load', () => heroImg.classList.add('is-loaded'), { once: true });
    }

    // gallery image staggered fade-in
    const galleryImgs = contentEl.querySelectorAll('.explorer__masonry-item img');
    galleryImgs.forEach((img, i) => {
      if (img.complete) {
        img.classList.add('is-loaded');
      } else {
        img.addEventListener('load', () => img.classList.add('is-loaded'), { once: true });
      }
    });
          // // sound toggle buttons
          // contentEl.querySelectorAll('.explorer__sound-btn').forEach(btn => {
          //   btn.addEventListener('click', e => {
          //     e.stopPropagation();
          //     const video = btn.closest('.explorer__video-wrap').querySelector('video');
          //     const isMuted = video.muted;
          //     video.muted = !isMuted;
          //     btn.querySelector('.icon-muted').style.display   = isMuted ? 'none' : '';
          //     btn.querySelector('.icon-unmuted').style.display = isMuted ? ''     : 'none';
          //     btn.setAttribute('aria-label', isMuted ? 'Mute video' : 'Unmute video');
          //     btn.classList.toggle('is-unmuted', isMuted);
          //   });
          // });
          // video controls (sound + progress + play/pause + timer)
contentEl.querySelectorAll('.explorer__video-wrap').forEach(wrap => {
  const video    = wrap.querySelector('video');
  const soundBtn = wrap.querySelector('.explorer__sound-btn');
  const playBtn  = wrap.querySelector('.explorer__play-btn');
  const progress = wrap.querySelector('.explorer__progress');
  const fill     = wrap.querySelector('.explorer__progress-fill');
  const timer    = wrap.querySelector('.explorer__timer');

  // format seconds to m:ss
  function fmt(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  // update progress bar + timer every frame
  video.addEventListener('timeupdate', () => {
    if (!video.duration) return;
    const pct = (video.currentTime / video.duration) * 100;
    fill.style.width = pct + '%';
    timer.textContent = fmt(video.currentTime);
  });

  // click progress bar to seek
  progress.addEventListener('click', e => {
    e.stopPropagation();
    const rect = progress.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * video.duration;
  });

  // sound toggle
  soundBtn.addEventListener('click', e => {
    e.stopPropagation();
    const isMuted = video.muted;
    video.muted = !isMuted;
    soundBtn.querySelector('.icon-muted').style.display   = isMuted ? 'none' : '';
    soundBtn.querySelector('.icon-unmuted').style.display = isMuted ? ''     : 'none';
    soundBtn.setAttribute('aria-label', isMuted ? 'Mute video' : 'Unmute video');
    soundBtn.classList.toggle('is-unmuted', isMuted);
  });

  // play / pause toggle
  playBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (video.paused) {
      video.play();
      playBtn.querySelector('.icon-pause').style.display = '';
      playBtn.querySelector('.icon-play').style.display  = 'none';
      playBtn.setAttribute('aria-label', 'Pause video');
    } else {
      video.pause();
      playBtn.querySelector('.icon-pause').style.display = 'none';
      playBtn.querySelector('.icon-play').style.display  = '';
      playBtn.setAttribute('aria-label', 'Play video');
    }
  });
});
    // gallery item click + keyboard

    contentEl.querySelectorAll('.explorer__masonry-item').forEach(item => {
      item.addEventListener('click', () => openLightbox(+item.dataset.galleryIndex));
      item.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(+item.dataset.galleryIndex);
        }
      });
    });

    // prev/next project buttons
    contentEl.querySelectorAll('.explorer__nav-btn').forEach(btn => {
      btn.addEventListener('click', () => selectProject(btn.dataset.projectId));
    });

    contentEl.scrollTop = 0;
  }

  // ── SELECT PROJECT ────────────────────────────────────────────
  function selectProject(id) {
    if (isTransitioning || id === currentProjectId) return;
    const found = findProject(id);
    if (!found) return;

    isTransitioning = true;
    currentProjectId = id;
    currentCategory  = found.slug;

    const inner = document.getElementById('explorerContentInner');

    const doRender = () => {
      renderContent(found.project);
      renderSidebar();
      const newInner = document.getElementById('explorerContentInner');
      newInner.style.opacity = '0';
      newInner.style.transform = 'translateY(10px)';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          newInner.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
          newInner.style.opacity = '1';
          newInner.style.transform = 'translateY(0)';
          setTimeout(() => {
            newInner.style.transition = '';
            isTransitioning = false;
          }, 300);
        });
      });
    };

    if (inner) {
      inner.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
      inner.style.opacity = '0';
      inner.style.transform = 'translateY(-8px)';
      setTimeout(doRender, 190);
    } else {
      doRender();
      isTransitioning = false;
    }
  }

  // ── OPEN / CLOSE ─────────────────────────────────────────────
  function openExplorer(categorySlug) {
    if (categorySlug && projects[categorySlug]) {
      currentCategory  = categorySlug;
      currentProjectId = projects[categorySlug][0].id;
    }
    const found = findProject(currentProjectId);
    if (found) renderContent(found.project);
    renderSidebar();
    explorer.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => {
      explorer.querySelector('.explorer__close')?.focus();
    });
  }

  function closeExplorer() {
    explorer.classList.remove('is-open');
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }

  // ── MOBILE: drag-to-dismiss panel ──────────────────────────
  let panelDragStartY = 0;
  let panelDragDelta  = 0;
  const panel = explorer.querySelector('.explorer__panel');

  panel.addEventListener('touchstart', e => {
    // only trigger drag from the top drag-handle area
    if (e.touches[0].clientY > panel.getBoundingClientRect().top + 56) return;
    panelDragStartY = e.touches[0].clientY;
    panelDragDelta  = 0;
  }, { passive: true });

  panel.addEventListener('touchmove', e => {
    if (!panelDragStartY) return;
    panelDragDelta = e.touches[0].clientY - panelDragStartY;
    if (panelDragDelta > 0) {
      panel.style.transform = `translateY(${panelDragDelta}px)`;
    }
  }, { passive: true });

  panel.addEventListener('touchend', () => {
    if (panelDragDelta > 100) {
      closeExplorer();
    }
    panel.style.transform = '';
    panelDragStartY = 0;
    panelDragDelta  = 0;
  }, { passive: true });

  document.querySelectorAll('[data-open-explorer]').forEach(btn => {
    btn.addEventListener('click', () => openExplorer(btn.dataset.openExplorer));
  });

  explorer?.querySelectorAll('[data-explorer-close]').forEach(el => {
    el.addEventListener('click', closeExplorer);
  });

  // ── KEYBOARD NAV ─────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (!explorer.classList.contains('is-open')) return;
    if (lightbox.classList.contains('is-open')) return; // lightbox handles its own keys

    switch (e.key) {
      case 'Escape':
        closeExplorer();
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        selectProject(adjacentProject(+1).id);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        selectProject(adjacentProject(-1).id);
        break;
    }
  });

  // ── TOUCH SWIPE (mobile content panel) ───────────────────────
  let touchStartX = 0;
  let touchStartY = 0;
  contentEl.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  contentEl.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 52) {
      selectProject(adjacentProject(dx < 0 ? 1 : -1).id);
    }
  }, { passive: true });

  // ── LIGHTBOX ─────────────────────────────────────────────────
  const lightbox      = document.getElementById('lightboxV2');
  const lightboxImg   = document.getElementById('lightboxV2Img');
  const lightboxVideo = document.getElementById('lightboxV2Video');
  const lightboxCounter = document.getElementById('lightboxV2Counter');
  let lbIndex = 0;
  let lbTouchStartX = 0;

  function setLightboxMedia(src) {
    const isVideo = /\.mp4$/i.test(src);
    if (isVideo) {
      lightboxImg.style.display  = 'none';
      lightboxVideo.style.display = 'block';
      lightboxVideo.src = src;
      lightboxVideo.play();
    } else {
      lightboxVideo.pause();
      lightboxVideo.src = '';
      lightboxVideo.style.display = 'none';
      lightboxImg.style.display   = 'block';
      lightboxImg.style.opacity = '0';
      lightboxImg.src = src;
      // descriptive alt for screen readers
      const found = findProject(currentProjectId);
      if (found) lightboxImg.alt = `${found.project.name} — gallery image`;
      lightboxImg.onload = () => {
        lightboxImg.style.transition = 'opacity 0.22s ease';
        lightboxImg.style.opacity = '1';
      };
      if (lightboxImg.complete) lightboxImg.style.opacity = '1';
    }
  }

  // function openLightbox(index) {
  //   if (!lightbox || !galleryImages.length) return;
  //   lbIndex = (index + galleryImages.length) % galleryImages.length;
  //   setLightboxMedia(galleryImages[lbIndex]);
  //   lightboxCounter.textContent = `${lbIndex + 1} / ${galleryImages.length}`;
  //   lightbox.classList.add('is-open');
  //   document.body.style.overflow = 'hidden';
  // }
  function openLightbox(index) {
    if (!lightbox || !galleryImages.length) return;
    lbIndex = (index + galleryImages.length) % galleryImages.length;
    setLightboxMedia(galleryImages[lbIndex]);
    lightboxCounter.textContent = `${lbIndex + 1} / ${galleryImages.length}`;
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    initLightboxControls();
  }
function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightboxVideo.pause();
    lightboxVideo.src = '';
    lightboxVideo.muted = true;
  }
  // function closeLightbox() {
  //   lightbox.classList.remove('is-open');
  //   lightboxVideo.pause();
  //   lightboxVideo.src = '';
  //   // keep body locked since explorer is still open
  // }
function initLightboxControls() {
    // only relevant for videos
    const isVideo = /\.mp4$/i.test(galleryImages[lbIndex]);
    const ctrl = document.getElementById('lbControls');
    if (!isVideo) { if (ctrl) ctrl.style.display = 'none'; return; }
    if (ctrl) ctrl.style.display = 'flex';

    const video    = lightboxVideo;
    const fill     = document.getElementById('lbFill');
    const timer    = document.getElementById('lbTimer');
    const soundBtn = document.getElementById('lbSound');
    const playBtn  = document.getElementById('lbPlay');

    // reset muted state
    video.muted = true;
    soundBtn.querySelector('.lb-icon-muted').style.display   = '';
    soundBtn.querySelector('.lb-icon-unmuted').style.display = 'none';
    soundBtn.classList.remove('is-unmuted');

    // reset play state
    video.play();
    playBtn.querySelector('.lb-icon-pause').style.display = '';
    playBtn.querySelector('.lb-icon-play').style.display  = 'none';

    function fmt(s) {
      const m = Math.floor(s / 60);
      return `${m}:${Math.floor(s % 60).toString().padStart(2,'0')}`;
    }

    // remove old listeners by cloning
    const newSound = soundBtn.cloneNode(true);
    const newPlay  = playBtn.cloneNode(true);
    const newFill  = fill.parentElement;
    soundBtn.replaceWith(newSound);
    playBtn.replaceWith(newPlay);

    // timeupdate
    video.ontimeupdate = () => {
      if (!video.duration) return;
      document.getElementById('lbFill').style.width = (video.currentTime / video.duration * 100) + '%';
      document.getElementById('lbTimer').textContent = fmt(video.currentTime);
    };

    // seek
    document.getElementById('lbProgress').onclick = e => {
      e.stopPropagation();
      const r = e.currentTarget.getBoundingClientRect();
      video.currentTime = ((e.clientX - r.left) / r.width) * video.duration;
    };

    // sound
    document.getElementById('lbSound').addEventListener('click', e => {
      e.stopPropagation();
      video.muted = !video.muted;
      document.getElementById('lbSound').querySelector('.lb-icon-muted').style.display   = video.muted ? '' : 'none';
      document.getElementById('lbSound').querySelector('.lb-icon-unmuted').style.display = video.muted ? 'none' : '';
      document.getElementById('lbSound').classList.toggle('is-unmuted', !video.muted);
    });

    // play/pause
    document.getElementById('lbPlay').addEventListener('click', e => {
      e.stopPropagation();
      if (video.paused) {
        video.play();
        document.getElementById('lbPlay').querySelector('.lb-icon-pause').style.display = '';
        document.getElementById('lbPlay').querySelector('.lb-icon-play').style.display  = 'none';
      } else {
        video.pause();
        document.getElementById('lbPlay').querySelector('.lb-icon-pause').style.display = 'none';
        document.getElementById('lbPlay').querySelector('.lb-icon-play').style.display  = '';
      }
    });
  }
  // function lbNavigate(dir) {
  //   lbIndex = (lbIndex + dir + galleryImages.length) % galleryImages.length;
  //   lightboxCounter.textContent = `${lbIndex + 1} / ${galleryImages.length}`;
  //   setLightboxMedia(galleryImages[lbIndex]);
  // }

  document.getElementById('lightboxV2Close')?.addEventListener('click', closeLightbox);
  document.getElementById('lightboxV2Backdrop')?.addEventListener('click', closeLightbox);
  document.getElementById('lightboxV2Prev')?.addEventListener('click', () => lbNavigate(-1));
  document.getElementById('lightboxV2Next')?.addEventListener('click', () => lbNavigate(+1));

  // lightbox keyboard
  document.addEventListener('keydown', e => {
    if (!lightbox?.classList.contains('is-open')) return;
    if (e.key === 'Escape')      closeLightbox();
    if (e.key === 'ArrowLeft')  { e.preventDefault(); lbNavigate(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); lbNavigate(+1); }
  });

  // lightbox touch swipe
  lightbox.addEventListener('touchstart', e => {
    lbTouchStartX = e.touches[0].clientX;
  }, { passive: true });
  lightbox.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - lbTouchStartX;
    if (Math.abs(dx) > 48) lbNavigate(dx < 0 ? 1 : -1);
  }, { passive: true });

});
