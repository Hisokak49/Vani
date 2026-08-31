/**
 * VANI KARAIKTA — LIGHTBOX MODAL CONTROLLER
 * Supports keyboard navigation (Esc, Arrow keys), touch swipe, and modal states.
 */

class LightboxController {
  constructor(artworks) {
    this.artworks = artworks || [];
    this.currentIndex = 0;
    this.modalEl = document.getElementById('lightboxModal');
    this.init();
    this.bindTriggers();
  }

  init() {
    if (!this.modalEl) return;

    this.mediaEl = this.modalEl.querySelector('.lightbox-media');
    this.titleEl = this.modalEl.querySelector('.lightbox-title');
    this.badgeEl = this.modalEl.querySelector('.lightbox-badge');
    this.descEl = this.modalEl.querySelector('.lightbox-desc');
    this.mediumEl = this.modalEl.querySelector('.lightbox-medium');
    this.dimensionsEl = this.modalEl.querySelector('.lightbox-dimensions');
    this.yearEl = this.modalEl.querySelector('.lightbox-year');
    this.priceEl = this.modalEl.querySelector('.lightbox-price');
    this.inquireBtn = this.modalEl.querySelector('.lightbox-inquire-btn');

    this.closeBtn = this.modalEl.querySelector('.lightbox-close-btn');
    this.prevBtn = this.modalEl.querySelector('.lightbox-nav-prev');
    this.nextBtn = this.modalEl.querySelector('.lightbox-nav-next');

    // Event listeners
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.close());
    if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prev());
    if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.next());

    // Click outside backdrop to close
    this.modalEl.addEventListener('click', (e) => {
      if (e.target === this.modalEl) {
        this.close();
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen()) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    });

    // Touch swipe support for mobile
    let touchStartX = 0;
    this.modalEl.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.modalEl.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      if (touchStartX - touchEndX > 50) this.next(); // swipe left
      if (touchEndX - touchStartX > 50) this.prev(); // swipe right
    }, { passive: true });

    // Inquire button — route via openEmailLauncher if available
    if (this.inquireBtn) {
      this.inquireBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const art = this.artworks[this.currentIndex];
        if (!art) return;
        const subject = `Artwork Inquiry: ${art.title}`;
        const body = `Hi Vani,\n\nI am interested in inquiring about your piece "${art.title}" (${art.dimensions}, ${art.medium}).\n\nPlease let me know availability and acquisition details.\n\nWarm regards,`;
        if (typeof window.openEmailLauncher === 'function') {
          window.openEmailLauncher(subject, body);
        } else {
          window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=vanikaraikta@gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
        }
      });
    }
  }

  // Attach click and keyboard triggers to all [data-lightbox-trigger] art cards
  bindTriggers() {
    document.querySelectorAll('[data-lightbox-trigger]').forEach(card => {
      const artId = card.getAttribute('data-art-id');
      const activate = () => this.open(artId);
      card.addEventListener('click', activate);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate();
        }
      });
    });
  }

  isOpen() {
    return this.modalEl && this.modalEl.classList.contains('active');
  }

  open(artId) {
    const index = this.artworks.findIndex(item => item.id === artId);
    if (index !== -1) {
      this.currentIndex = index;
    } else {
      this.currentIndex = 0;
    }
    this.render();
    this.modalEl.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.modalEl.classList.remove('active');
    document.body.style.overflow = '';
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.artworks.length) % this.artworks.length;
    this.render();
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.artworks.length;
    this.render();
  }

  render() {
    const art = this.artworks[this.currentIndex];
    if (!art) return;

    // Render media (styled placeholder gradient)
    if (this.mediaEl) {
      // Keep nav buttons by re-inserting them after setting innerHTML
      this.mediaEl.innerHTML = `
        <div class="art-placeholder" style="background: ${art.gradient}; width: 100%; height: 100%; min-height: 380px;">
          <div class="art-placeholder-content">
            <div class="art-placeholder-title">${art.title}</div>
            <div class="art-placeholder-meta">${art.medium} — ${art.dimensions}</div>
          </div>
        </div>
        <button class="lightbox-nav-btn lightbox-nav-prev" aria-label="Previous artwork">‹</button>
        <button class="lightbox-nav-btn lightbox-nav-next" aria-label="Next artwork">›</button>
      `;
      // Re-bind nav buttons after innerHTML reset
      this.prevBtn = this.mediaEl.querySelector('.lightbox-nav-prev');
      this.nextBtn = this.mediaEl.querySelector('.lightbox-nav-next');
      if (this.prevBtn) this.prevBtn.addEventListener('click', () => this.prev());
      if (this.nextBtn) this.nextBtn.addEventListener('click', () => this.next());
    }

    if (this.titleEl) this.titleEl.textContent = art.title;
    if (this.descEl) this.descEl.textContent = art.description;
    if (this.mediumEl) this.mediumEl.textContent = art.medium;
    if (this.dimensionsEl) this.dimensionsEl.textContent = art.dimensions;
    if (this.yearEl) this.yearEl.textContent = art.year;
    if (this.priceEl) this.priceEl.textContent = art.price;

    if (this.badgeEl) {
      this.badgeEl.textContent = art.status.toUpperCase();
      this.badgeEl.className = `badge badge-${art.status} lightbox-badge`;
    }

    if (this.inquireBtn) {
      this.inquireBtn.textContent = art.status === 'sold'
        ? 'Commission Similar Piece →'
        : 'Inquire About This Piece →';
      // Store art info on element for the click listener
      this.inquireBtn.dataset.artTitle = art.title;
      this.inquireBtn.dataset.artDimensions = art.dimensions;
      this.inquireBtn.dataset.artMedium = art.medium;
    }
  }
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  if (typeof GALLERY_DATA !== 'undefined') {
    window.lightbox = new LightboxController(GALLERY_DATA);
  }
});
