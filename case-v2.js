// ===== CASE STUDY V2 — sidebar, accordion, popup, lightbox =====

document.addEventListener('DOMContentLoaded', () => {

  // ---- SCROLL-SPY for in-page section nav ----
  const tocLinks = document.querySelectorAll('.case-toc__link');
  const sections = Array.from(tocLinks)
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    const spyIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = '#' + entry.target.id;
        const link = document.querySelector(`.case-toc__link[href="${id}"]`);
        if (!link) return;
        if (entry.isIntersecting) {
          tocLinks.forEach(l => l.classList.remove('is-active'));
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-15% 0px -70% 0px', threshold: 0 });
    sections.forEach(s => spyIO.observe(s));
  }

  // smooth scroll for in-page nav links
  tocLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ---- ACCORDION (project browser in sidebar) ----
  document.querySelectorAll('.case-accordion__head').forEach(head => {
    head.addEventListener('click', () => {
      const item = head.closest('.case-accordion__item');
      item.classList.toggle('is-open');
    });
  });

  // ---- MOBILE SIDEBAR TOGGLE ----
  const mobileToggle = document.querySelector('.case-sidebar__mobile-toggle');
  const sidebar = document.querySelector('.case-sidebar');
  mobileToggle?.addEventListener('click', () => {
    sidebar.classList.toggle('is-collapsed');
    const expanded = !sidebar.classList.contains('is-collapsed');
    mobileToggle.setAttribute('aria-expanded', expanded);
  });

  // ---- PROJECT PREVIEW POPUP ----
  const popup = document.getElementById('projectPopup');
  const popupImg = document.getElementById('popupImg');
  const popupCategory = document.getElementById('popupCategory');
  const popupTitle = document.getElementById('popupTitle');
  const popupDesc = document.getElementById('popupDesc');
  const popupCta = document.getElementById('popupCta');

  function openPopup(data) {
    if (!popup) return;
    popupImg.src = data.cover;
    popupImg.alt = data.name;
    popupCategory.textContent = data.category;
    popupTitle.textContent = data.name;
    popupDesc.textContent = data.blurb;
    popupCta.href = data.href;
    popup.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closePopup() {
    popup?.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('[data-project-preview]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openPopup({
        cover: link.dataset.cover,
        name: link.dataset.name,
        category: link.dataset.category,
        blurb: link.dataset.blurb,
        href: link.getAttribute('href')
      });
    });
  });

  popup?.querySelectorAll('[data-popup-close]').forEach(el => {
    el.addEventListener('click', closePopup);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePopup();
  });

  // ---- LIGHTBOX (masonry gallery full-res viewer) ----
  const galleryImgs = Array.from(document.querySelectorAll('.case-masonry__item img'));
  const lightbox = document.getElementById('lightboxV2');
  const lightboxImg = document.getElementById('lightboxV2Img');
  const lightboxCounter = document.getElementById('lightboxV2Counter');
  let currentIndex = 0;

  function showLightbox(index) {
    if (!lightbox || !galleryImgs.length) return;
    currentIndex = (index + galleryImgs.length) % galleryImgs.length;
    const img = galleryImgs[currentIndex];
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCounter.textContent = `${currentIndex + 1} / ${galleryImgs.length}`;
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox?.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  galleryImgs.forEach((img, i) => {
    img.closest('.case-masonry__item').addEventListener('click', () => showLightbox(i));
  });

  document.getElementById('lightboxV2Close')?.addEventListener('click', closeLightbox);
  document.getElementById('lightboxV2Backdrop')?.addEventListener('click', closeLightbox);
  document.getElementById('lightboxV2Prev')?.addEventListener('click', () => showLightbox(currentIndex - 1));
  document.getElementById('lightboxV2Next')?.addEventListener('click', () => showLightbox(currentIndex + 1));

  document.addEventListener('keydown', (e) => {
    if (!lightbox?.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showLightbox(currentIndex - 1);
    if (e.key === 'ArrowRight') showLightbox(currentIndex + 1);
  });

});
