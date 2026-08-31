/**
 * VANI KARAIKTA — MAIN INTERACTION SCRIPT
 * Handles navigation, dynamic video showcase & posting,
 * theater video modal, artwork lightbox, universal email launcher,
 * dynamic social links rendering, and dynamic artwork rendering.
 */

document.addEventListener('DOMContentLoaded', () => {
  const ARTIST_EMAIL = 'vanikaraikta@gmail.com';

  // =========================================================================
  // 0. Dynamic Social Links Rendering (from site-data.js / admin dashboard)
  // =========================================================================

  function renderSocialPills() {
    const container = document.getElementById('heroPillsContainer');
    if (!container || typeof getSocialLinks !== 'function') return;

    const links = typeof getActiveSocialLinks === 'function' ? getActiveSocialLinks() : getSocialLinks().filter(l => l.active && l.url);

    // Always show Instagram and Email regardless
    const emailPill = `
      <a href="mailto:${ARTIST_EMAIL}" class="social-pill" title="Send Email" style="background:rgba(194,94,62,0.1);color:#C25E3E;border-color:rgba(194,94,62,0.2);">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        <span>Email</span>
      </a>`;

    if (links.length === 0) {
      container.innerHTML = `
        <a href="https://www.instagram.com/unfiltered_vaniii/?hl=en" target="_blank" rel="noopener noreferrer" class="social-pill instagram" title="Follow on Instagram">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
          <span>Instagram</span>
        </a>
        ${emailPill}`;
      return;
    }

    container.innerHTML = links.map(link => `
      <a href="${link.url}" target="_blank" rel="noopener noreferrer"
         class="social-pill"
         style="background:${hexToRgba(link.color, 0.1)};color:${link.color};border-color:${hexToRgba(link.color, 0.25)};"
         title="Follow on ${link.platform}">
        ${typeof getSocialIconSVG === 'function' ? getSocialIconSVG(link.iconType, 16) : ''}
        <span>${link.platform}</span>
      </a>
    `).join('') + emailPill;
  }

  function renderSocialHub() {
    const container = document.getElementById('socialHubGrid');
    if (!container || typeof getSocialLinks !== 'function') return;

    const links = typeof getActiveSocialLinks === 'function' ? getActiveSocialLinks() : getSocialLinks().filter(l => l.active && l.url);

    // Always render the direct email card
    const emailCard = `
      <div class="platform-card email">
        <div class="platform-header">
          <div class="platform-info">
            <span class="platform-name">Direct Inquiries</span>
            <span class="platform-user">${ARTIST_EMAIL}</span>
          </div>
          <div class="platform-icon" style="color:var(--accent);">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
        </div>
        <p class="platform-desc">Commission a custom painting, ask about artwork availability, or reach out for collaborations and exhibitions.</p>
        <a href="mailto:${ARTIST_EMAIL}" class="btn btn-primary" style="width:100%;">Open Email Draft →</a>
      </div>`;

    if (links.length === 0) {
      container.innerHTML = `
        <div class="platform-card instagram">
          <div class="platform-header">
            <div class="platform-info">
              <span class="platform-name">Instagram</span>
              <span class="platform-user">@unfiltered_vaniii</span>
            </div>
            <div class="platform-icon" style="color:#E1306C;">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </div>
          </div>
          <p class="platform-desc">Daily studio reels, pigment mixing rituals, canvas progress reveals, and behind-the-scenes stories.</p>
          <a href="https://www.instagram.com/unfiltered_vaniii/?hl=en" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="width:100%;">Follow on Instagram →</a>
        </div>
        ${emailCard}`;
      return;
    }

    container.innerHTML = links.map(link => `
      <div class="platform-card">
        <div class="platform-header">
          <div class="platform-info">
            <span class="platform-name">${link.platform}</span>
            <span class="platform-user">${link.handle || link.url}</span>
          </div>
          <div class="platform-icon" style="color:${link.color};">
            ${typeof getSocialIconSVG === 'function' ? getSocialIconSVG(link.iconType, 26) : ''}
          </div>
        </div>
        <p class="platform-desc" style="min-height:48px;">&nbsp;</p>
        <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="width:100%;">Visit ${link.platform} →</a>
      </div>
    `).join('') + emailCard;
  }

  function hexToRgba(hex, alpha) {
    hex = (hex || '#888888').replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(c => c+c).join('');
    const r = parseInt(hex.substring(0,2), 16);
    const g = parseInt(hex.substring(2,4), 16);
    const b = parseInt(hex.substring(4,6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // =========================================================================
  // 0b. Dynamic Artwork Rendering (from site-data.js / admin dashboard)
  // =========================================================================

  function renderPublicArtworks() {
    const publicGrid = document.getElementById('publicArtworkGrid');
    const workGrid = document.getElementById('workGrid');
    if (typeof getArtworks !== 'function') return;

    const artworks = getArtworks();

    // 1. Homepage Artwork Grid
    if (publicGrid) {
      if (artworks.length === 0) {
        publicGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-light); max-width: 680px; margin: 0 auto;">
            <div style="font-size: 2.75rem; margin-bottom: 0.75rem;">🎨</div>
            <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--text-primary);">Original Artworks in Progress</h3>
            <p style="color: var(--text-secondary); max-width: 500px; margin: 0 auto 1.75rem; font-size: 0.98rem; line-height: 1.6;">
              Vani is currently creating new original oil paintings and raw pigment studies in the studio. In the meantime, you can commission a custom bespoke piece or connect on Instagram for studio previews.
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
              <a href="#contact" class="btn btn-primary">Inquire for Custom Commission →</a>
              <a href="https://www.instagram.com/unfiltered_vaniii/?hl=en" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">Follow @unfiltered_vaniii ↗</a>
            </div>
          </div>`;
      } else {
        publicGrid.innerHTML = artworks.slice(0, 8).map(art => renderArtworkCard(art)).join('');
      }
    }

    // 2. Catalog Page (work.html)
    if (workGrid) {
      if (artworks.length === 0) {
        workGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 4.5rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-light); max-width: 680px; margin: 0 auto;">
            <div style="font-size: 2.75rem; margin-bottom: 1rem;">🎨</div>
            <h2 style="font-size: 1.6rem; margin-bottom: 0.75rem;">New Series in the Studio</h2>
            <p style="color: var(--text-secondary); max-width: 480px; margin: 0 auto 2rem; font-size: 1.05rem; line-height: 1.6;">
              Vani is currently working on her upcoming collection of original paintings and raw pigment studies. Follow her daily creative process on Instagram for previews.
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
              <a href="https://www.instagram.com/unfiltered_vaniii/?hl=en" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                Follow @unfiltered_vaniii on Instagram →
              </a>
              <a href="contact.html" class="btn btn-secondary">
                Inquire for Commissions
              </a>
            </div>
          </div>`;
      } else {
        workGrid.innerHTML = artworks.map(art => renderArtworkCard(art)).join('');
      }
    }
  }

  function renderArtworkCard(art) {
    const meta = [art.medium, art.dimensions, art.year].filter(Boolean).join(' · ');

    const imgHtml = art.imageUrl
      ? `<img src="${art.imageUrl}" alt="${art.title}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" onerror="this.style.display='none'">`
      : `<div class="art-placeholder" style="background:linear-gradient(135deg,#D4B899 0%,#C25E3E 50%,#6B3A2A 100%);height:100%;display:flex;align-items:center;justify-content:center;"><div class="art-placeholder-content"><div class="art-placeholder-title">${art.title}</div></div></div>`;

    const priceLabel = art.price ? art.price : (art.forSale ? 'Available to Buy' : 'Exhibition Study');

    return `
      <article class="art-card" style="cursor:pointer;" onclick="window.openArtworkInquiryModal('${art.id}')">
        <div class="art-card-thumb" style="position:relative; overflow:hidden;">
          ${art.forSale && art.price ? `<span class="badge badge-available art-card-badge">${art.price}</span>` : ''}
          ${imgHtml}
          <div class="art-card-overlay" style="cursor:pointer;">
            <span>${art.forSale ? 'Ask to Buy ✉' : 'View Details ✦'}</span>
          </div>
        </div>
        <div class="art-card-info" style="padding:1.25rem;">
          <h3 class="art-card-title" style="font-size:1.15rem; font-weight:700; margin-bottom:0.35rem;">${art.title}</h3>
          ${meta ? `<p class="art-card-meta" style="font-size:0.85rem; color:var(--text-muted); margin-bottom:0.75rem;">${meta}</p>` : ''}
          <div class="art-card-footer" style="display:flex; align-items:center; justify-content:space-between; width:100%; gap:0.5rem; margin-top:0.5rem; border-top:1px solid var(--border-light); padding-top:0.75rem;">
            ${art.forSale
              ? `<div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
                   <span class="art-card-price" style="font-weight:700;color:var(--accent);font-size:1.05rem;">${priceLabel}</span>
                   <button type="button" class="btn btn-primary" style="font-size:0.85rem; padding:0.45rem 1rem; border-radius:6px; font-weight:600;" onclick="event.stopPropagation(); window.openArtworkInquiryModal('${art.id}')">
                     Ask to Buy ✉
                   </button>
                 </div>`
              : `<span style="font-size:0.85rem;color:var(--text-muted);">Studio Piece (Not for sale)</span>`
            }
          </div>
        </div>
      </article>`;
  }

  function loadActiveProfilePhoto() {
    const API_BASE = (window.location.protocol.startsWith('http')) ? '' : 'http://localhost:3000';
    fetch(`${API_BASE}/api/profile-photos`)
      .then(r => r.json())
      .then(photos => {
        if (Array.isArray(photos)) {
          const active = photos.find(p => p.isActive === 1 || p.isActive === true);
          if (active && active.imageUrl) {
            document.querySelectorAll('.creator-portrait-card img, .artist-portrait-frame img, .profile-avatar-large').forEach(img => {
              img.src = active.imageUrl;
            });
          }
        }
      })
      .catch(err => console.warn('Profile photo fetch skipped:', err));
  }

  // Initialize social, video, artwork, and profile photo rendering
  renderSocialPills();
  renderSocialHub();
  renderPublicArtworks();
  loadActiveProfilePhoto();

  // Fetch real-time server database updates
  if (typeof fetchSocialLinksFromServer === 'function') {
    fetchSocialLinksFromServer(() => {
      renderSocialPills();
      renderSocialHub();
    });
  }
  if (typeof fetchArtworksFromServer === 'function') {
    fetchArtworksFromServer(() => {
      renderPublicArtworks();
    });
  }
  if (typeof fetchVideosFromServer === 'function') {
    fetchVideosFromServer(() => {
      if (typeof renderVideos === 'function') renderVideos();
    });
  }

  // =========================================================================
  // 1. Toast Notification Helper
  // =========================================================================
  function showToast(message, icon = '✦') {
    let toast = document.getElementById('toastNotice');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toastNotice';
      toast.className = 'toast-notice';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }
  window.showToast = showToast;

  // =========================================================================
  // 2. Universal Email Draft & Launcher Dialog
  // =========================================================================
  // 2. Interactive Email Launcher Modal & Fallback Handlers
  // =========================================================================
  const emailModal = document.getElementById('emailLauncherModal');
  const emailModalGmail = document.getElementById('emailModalGmail');
  const emailModalOutlookWeb = document.getElementById('emailModalOutlookWeb');
  const emailModalYahoo = document.getElementById('emailModalYahoo');
  const emailModalDefault = document.getElementById('emailModalDefault');
  const emailModalCopy = document.getElementById('emailModalCopy');
  const emailModalPreview = document.getElementById('emailModalPreview');

  let currentDraftText = '';

  function openEmailLauncher(subject = 'Inquiry for Vani Karaikta', body = '') {
    if (!body) {
      body = `Hi Vani,\n\nI love your artwork and would like to connect with you regarding...`;
    }

    currentDraftText = `To: ${ARTIST_EMAIL}\nSubject: ${subject}\n\n${body}`;

    const encSubject = encodeURIComponent(subject);
    const encBody = encodeURIComponent(body);

    const mailtoUrl = `mailto:${ARTIST_EMAIL}?subject=${encSubject}&body=${encBody}`;
    const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${ARTIST_EMAIL}&su=${encSubject}&body=${encBody}`;
    const outlookWebUrl = `https://outlook.live.com/mail/0/deeplink/compose?to=${ARTIST_EMAIL}&subject=${encSubject}&body=${encBody}`;
    const yahooWebUrl = `https://compose.mail.yahoo.com/?to=${ARTIST_EMAIL}&subj=${encSubject}&body=${encBody}`;

    if (emailModalDefault) emailModalDefault.href = mailtoUrl;
    if (emailModalGmail) emailModalGmail.href = gmailWebUrl;
    const outlookBtn = document.getElementById('emailModalOutlookWeb');
    if (outlookBtn) outlookBtn.href = outlookWebUrl;
    const yahooBtn = document.getElementById('emailModalYahoo');
    if (yahooBtn) yahooBtn.href = yahooWebUrl;

    if (emailModalPreview) {
      emailModalPreview.innerHTML = `
        <div><strong>To:</strong> ${ARTIST_EMAIL}</div>
        <div><strong>Subject:</strong> ${subject}</div>
        <div style="margin-top: 0.5rem; color: var(--text-secondary); white-space: pre-line; max-height: 120px; overflow-y: auto;">${body}</div>
      `;
    }

    if (emailModal) {
      emailModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    } else {
      window.location.href = mailtoUrl;
    }
  }
  window.openEmailLauncher = openEmailLauncher;

  window.closeEmailLauncher = function() {
    if (emailModal) {
      emailModal.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  if (emailModal) {
    emailModal.addEventListener('click', (e) => {
      if (e.target === emailModal) {
        window.closeEmailLauncher();
      }
    });
  }

  if (emailModalCopy) {
    emailModalCopy.addEventListener('click', () => {
      const copyContent = currentDraftText || `To: ${ARTIST_EMAIL}\nSubject: Inquiry for Vani Karaikta`;
      navigator.clipboard.writeText(copyContent).then(() => {
        showToast('Email draft & address copied to clipboard! (vanikaraikta@gmail.com)', '📋');
      }).catch(() => {
        showToast(`Email: ${ARTIST_EMAIL}`, '✉️');
      });
    });
  }

  // Intercept all links targeting vanikaraikta@gmail.com for seamless cross-browser experience
  document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      let subject = 'Inquiry for Vani Karaikta';
      let body = 'Hi Vani,\n\nI am reaching out regarding...';

      if (href.includes('?')) {
        const query = href.split('?')[1];
        const params = new URLSearchParams(query);
        if (params.get('subject')) subject = decodeURIComponent(params.get('subject'));
        if (params.get('body')) body = decodeURIComponent(params.get('body'));
      }

      openEmailLauncher(subject, body);
    });
  });

  // =========================================================================
  // 3. Sticky Header Scroll Effect
  // =========================================================================
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // =========================================================================
  // 4. Mobile Menu Toggle
  // =========================================================================
  const mobileToggle = document.querySelector('.mobile-nav-toggle');
  const mobileDrawer = document.querySelector('.mobile-nav-drawer');
  const mobileLinks = document.querySelectorAll('.mobile-nav-link');

  if (mobileToggle && mobileDrawer) {
    const toggleMenu = () => {
      const isOpen = mobileDrawer.classList.toggle('open');
      mobileToggle.classList.toggle('open', isOpen);
      mobileToggle.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };

    mobileToggle.addEventListener('click', toggleMenu);

    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (mobileDrawer.classList.contains('open')) {
          toggleMenu();
        }
      });
    });
  }

  // =========================================================================
  // 5. Gallery Filter Tabs (work.html artwork catalog)
  // =========================================================================
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  if (filterBtns.length > 0 && galleryItems.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');

        galleryItems.forEach(item => {
          const cat = item.getAttribute('data-category');
          const status = item.getAttribute('data-status');
          const show = filter === 'all' || cat === filter || status === filter;
          item.style.display = show ? '' : 'none';
        });
      });
    });
  }

  // =========================================================================
  // 6. Smooth In-Page Anchor Navigation
  // =========================================================================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId.length <= 1) return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const headerOffset = 85;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // =========================================================================
  // 6. Video Showcase System (Render, Filter, Theater Modal, Add Video)
  // =========================================================================
  const videoCatalogContainer = document.getElementById('videoCatalogGrid');
  let currentVideoFilter = 'all';

  function renderVideos() {
    if (!videoCatalogContainer) return;
    
    const videos = typeof getStoredVideos === 'function' ? getStoredVideos() : [];
    
    const filtered = currentVideoFilter === 'all' 
      ? videos 
      : videos.filter(v => v.category === currentVideoFilter);

    if (filtered.length === 0) {
      videoCatalogContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1.5rem; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-light); max-width: 640px; margin: 0 auto;">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem;">🎬</div>
          <h3 style="font-size: 1.35rem; margin-bottom: 0.5rem; color: var(--text-primary);">Studio Videos &amp; Reels</h3>
          <p style="color: var(--text-secondary); max-width: 480px; margin: 0 auto 1.5rem; font-size: 0.95rem; line-height: 1.6;">
            Studio vlogs, painting process sessions, and daily reels will appear here. Follow @unfiltered_vaniii on Instagram to watch daily clips.
          </p>
          <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
            <a href="https://www.instagram.com/unfiltered_vaniii/?hl=en" target="_blank" rel="noopener noreferrer" class="btn btn-primary" style="font-size: 0.88rem;">
              Watch on Instagram ↗
            </a>
          </div>
        </div>
      `;
      return;
    }

    videoCatalogContainer.innerHTML = filtered.map(vid => {
      const categoryLabel = vid.category === 'studio' ? 'Studio Vlog'
        : vid.category === 'process' ? 'Art Process'
        : vid.category === 'reels' ? 'Reel / Short'
        : 'Studio Video';

      const thumbImg = vid.thumbnail
        ? `<img src="${vid.thumbnail}" alt="${vid.title}" class="video-thumb-img" loading="lazy" onerror="this.style.display='none'">`
        : `<div style="background: linear-gradient(135deg, #1C1C1E 0%, #2A1F1A 60%, #3A2010 100%); width: 100%; height: 100%; min-height: 200px; display: flex; align-items: center; justify-content: center;"><span style="font-size: 2rem;">🎬</span></div>`;

      return `
        <article class="video-showcase-card" data-video-id="${vid.id}">
          <div class="video-thumb-wrapper" onclick="window.openTheaterVideo('${vid.embedUrl || vid.url}', '${encodeURIComponent(vid.title)}')">
            ${thumbImg}
            <div class="video-play-btn" aria-label="Play video">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
            <span class="video-badge">${categoryLabel}</span>
          </div>
          <div class="video-info">
            <h3 class="video-card-title">${vid.title}</h3>
            ${vid.description ? `<p class="video-card-desc">${vid.description}</p>` : ''}
            <div class="video-card-footer">
              <span class="video-platform-tag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                ${(vid.platform || 'Studio').toUpperCase()} · ${vid.date || new Date().getFullYear()}
              </span>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <button class="btn-link" style="font-size: 0.85rem; font-weight: 600;" onclick="window.openTheaterVideo('${vid.embedUrl || vid.url}', '${encodeURIComponent(vid.title)}')">Watch Now →</button>
                <button class="btn-delete-video" onclick="window.deleteVideoItem('${vid.id}')" title="Delete video">✕</button>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  // Initial video render
  renderVideos();

  // Video Filter Buttons
  const videoFilterBtns = document.querySelectorAll('.v-filter-btn');
  videoFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      videoFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentVideoFilter = btn.getAttribute('data-vfilter');
      renderVideos();
    });
  });

  // Theater Video Modal
  const theaterModal = document.getElementById('theaterVideoModal');
  const theaterIframe = document.getElementById('theaterIframe');

  window.openTheaterVideo = function(embedUrl, title) {
    if (!theaterModal) return;
    const isFile = embedUrl.startsWith('/uploads/') || embedUrl.match(/\.(mp4|webm|mov|m4v)$/i);
    let videoPlayer = document.getElementById('theaterNativeVideo');

    if (isFile) {
      if (theaterIframe) theaterIframe.style.display = 'none';
      if (!videoPlayer) {
        videoPlayer = document.createElement('video');
        videoPlayer.id = 'theaterNativeVideo';
        videoPlayer.controls = true;
        videoPlayer.autoplay = true;
        videoPlayer.style.width = '100%';
        videoPlayer.style.height = '100%';
        videoPlayer.style.maxHeight = '80vh';
        videoPlayer.style.borderRadius = '12px';
        videoPlayer.style.backgroundColor = '#000';
        if (theaterIframe && theaterIframe.parentElement) {
          theaterIframe.parentElement.appendChild(videoPlayer);
        }
      }
      videoPlayer.style.display = 'block';
      videoPlayer.src = embedUrl;
      videoPlayer.play().catch(e => console.log('Autoplay handled:', e));
    } else {
      if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.style.display = 'none';
        videoPlayer.src = '';
      }
      if (theaterIframe) {
        theaterIframe.style.display = 'block';
        const autoplayUrl = embedUrl.includes('?') ? `${embedUrl}&autoplay=1` : `${embedUrl}?autoplay=1`;
        theaterIframe.src = autoplayUrl;
      }
    }

    theaterModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeTheaterVideo = function() {
    if (!theaterModal) return;
    if (theaterIframe) theaterIframe.src = '';
    const videoPlayer = document.getElementById('theaterNativeVideo');
    if (videoPlayer) {
      videoPlayer.pause();
      videoPlayer.src = '';
      videoPlayer.style.display = 'none';
    }
    theaterModal.classList.remove('open');
    document.body.style.overflow = '';
  };

  if (theaterModal) {
    theaterModal.addEventListener('click', (e) => {
      if (e.target === theaterModal) {
        window.closeTheaterVideo();
      }
    });
  }

  // Post / Add Video Modal
  const postVideoModal = document.getElementById('postVideoModal');
  const postVideoForm = document.getElementById('postVideoForm');

  window.openPostVideoModal = function() {
    if (postVideoModal) {
      postVideoModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closePostVideoModal = function() {
    if (postVideoModal) {
      postVideoModal.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  if (postVideoModal) {
    postVideoModal.addEventListener('click', (e) => {
      if (e.target === postVideoModal) {
        window.closePostVideoModal();
      }
    });
  }

  if (postVideoForm) {
    postVideoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const url = document.getElementById('postVideoUrl').value.trim();
      const title = document.getElementById('postVideoTitle').value.trim();
      const category = document.getElementById('postVideoCategory').value;
      const desc = document.getElementById('postVideoDesc').value.trim();
      const thumb = document.getElementById('postVideoThumb').value.trim();

      if (!url) {
        alert('Please enter a valid video link.');
        return;
      }

      if (typeof addVideoToPortfolio === 'function') {
        addVideoToPortfolio({
          url: url,
          title: title || 'New Studio Video',
          category: category || 'studio',
          description: desc,
          thumbnail: thumb,
          platform: url.includes('instagram') ? 'instagram' : 'youtube'
        });

        renderVideos();
        postVideoForm.reset();
        window.closePostVideoModal();
        showToast('Video added to your portfolio! ✦', '🎬');
      }
    });
  }

  window.deleteVideoItem = function(id) {
    if (confirm('Are you sure you want to remove this video from your portfolio?')) {
      if (typeof removeVideoFromPortfolio === 'function') {
        removeVideoFromPortfolio(id);
        renderVideos();
        showToast('Video removed from portfolio.', '🗑️');
      }
    }
  };

  // =========================================================================
  // 6b. Artwork Purchase / Inquiry Modal Logic
  // =========================================================================
  window.openArtworkInquiryModal = function(artId) {
    let artworks = typeof getArtworks === 'function' ? getArtworks() : [];
    let art = artworks.find(a => String(a.id) === String(artId));

    // Fallback: check GALLERY_DATA from gallery-data.js
    if (!art && typeof GALLERY_DATA !== 'undefined' && Array.isArray(GALLERY_DATA)) {
      art = GALLERY_DATA.find(a => String(a.id) === String(artId));
    }
    // Fallback default
    if (!art) {
      art = { id: artId, title: 'Original Artwork', price: '', medium: '', dimensions: '', year: '', imageUrl: '' };
    }

    const modal = document.getElementById('artworkInquiryModal');
    if (!modal) {
      console.warn('artworkInquiryModal element not found');
      return;
    }

    // Set snapshot info
    const thumbEl = document.getElementById('artInquiryThumb');
    const titleEl = document.getElementById('artInquiryPieceTitle');
    const metaEl = document.getElementById('artInquiryPieceMeta');
    const priceEl = document.getElementById('artInquiryPiecePrice');

    if (thumbEl) {
      if (art.imageUrl) {
        thumbEl.src = art.imageUrl;
        thumbEl.style.display = 'block';
      } else {
        thumbEl.style.display = 'none';
      }
    }
    if (titleEl) titleEl.textContent = art.title || 'Original Artwork';
    if (metaEl) metaEl.textContent = [art.medium, art.dimensions, art.year].filter(Boolean).join(' · ') || 'Original Work';
    if (priceEl) priceEl.textContent = art.price ? `Price: ${art.price}` : 'Available on Inquiry';

    // Set hidden form fields
    const fId = document.getElementById('artInquiryArtId'); if (fId) fId.value = art.id || artId;
    const fTitle = document.getElementById('artInquiryArtTitle'); if (fTitle) fTitle.value = art.title || '';
    const fPrice = document.getElementById('artInquiryArtPrice'); if (fPrice) fPrice.value = art.price || '';
    const fImg = document.getElementById('artInquiryArtImg'); if (fImg) fImg.value = art.imageUrl || '';
    const fMed = document.getElementById('artInquiryArtMedium'); if (fMed) fMed.value = art.medium || '';

    // Pre-fill message
    const msgEl = document.getElementById('artInquiryMessage');
    const priceNote = art.price ? ` (Listed Price: ${art.price})` : '';
    if (msgEl) {
      msgEl.value = `Hi Vani,\n\nI would love to inquire about purchasing your artwork "${art.title}"${priceNote}${art.medium ? ' (' + art.medium + ')' : ''}. Could you please provide details on acquisition, shipping, and availability?\n\nWarm regards,`;
    }

    modal.classList.add('open');
    modal.style.display = 'flex';
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    document.body.style.overflow = 'hidden';
  };

  window.closeArtworkInquiryModal = function() {
    const modal = document.getElementById('artworkInquiryModal');
    if (modal) {
      modal.classList.remove('open');
      modal.style.display = 'none';
      modal.style.opacity = '0';
      modal.style.visibility = 'hidden';
    }
    document.body.style.overflow = '';
  };

  // Anti-Spam Link Detector
  function containsLinkOrUrl(text) {
    if (!text || typeof text !== 'string') return false;
    const urlPattern = /(https?:\/\/|www\.|ftp:\/\/|[a-z0-9_-]+\.(com|net|org|io|xyz|ru|co|info|biz|site|online|me|tv|cc|top|click|link|app|dev|page)\b)/i;
    return urlPattern.test(text);
  }

  window.handleArtworkInquirySubmit = async function(e) {
    if (e && e.preventDefault) e.preventDefault();

    const artId = document.getElementById('artInquiryArtId') ? document.getElementById('artInquiryArtId').value : '';
    const artTitle = document.getElementById('artInquiryArtTitle') ? document.getElementById('artInquiryArtTitle').value : 'Original Artwork';
    const artPrice = document.getElementById('artInquiryArtPrice') ? document.getElementById('artInquiryArtPrice').value : '';
    const artImg = document.getElementById('artInquiryArtImg') ? document.getElementById('artInquiryArtImg').value : '';
    const artMedium = document.getElementById('artInquiryArtMedium') ? document.getElementById('artInquiryArtMedium').value : '';
    const senderName = document.getElementById('artInquirySenderName') ? document.getElementById('artInquirySenderName').value.trim() : '';
    const senderEmail = document.getElementById('artInquirySenderEmail') ? document.getElementById('artInquirySenderEmail').value.trim() : '';
    const message = document.getElementById('artInquiryMessage') ? document.getElementById('artInquiryMessage').value.trim() : '';

    if (!senderName || !senderEmail) {
      alert('Please enter your name and email address.');
      return;
    }

    if (containsLinkOrUrl(message) || containsLinkOrUrl(senderName)) {
      alert('For security and spam prevention, website links and URLs are not permitted in the inquiry message. Please write your text inquiry only.');
      return;
    }

    // 1. Save to Backend Database (visible in Admin Dashboard under Inquiries)
    if (typeof submitInquiry === 'function') {
      try {
        await submitInquiry({
          type: 'artwork_buy',
          artworkId: artId,
          artworkTitle: artTitle,
          artworkPrice: artPrice,
          artworkImageUrl: artImg,
          artworkMedium: artMedium,
          senderName: senderName,
          senderEmail: senderEmail,
          message: message
        });
      } catch (err) {
        console.warn('Inquiry record warning:', err);
      }
    }

    // 2. Prepare Email Draft to Vani with photo link and piece details
    let fullImageUrl = artImg;
    if (artImg && artImg.startsWith('/')) {
      fullImageUrl = window.location.origin + artImg;
    }

    let emailBody = `Dear Vani,\n\nI am interested in acquiring your artwork "${artTitle}".\n\n`;
    emailBody += `--- Artwork Details ---\n`;
    emailBody += `Piece: ${artTitle}\n`;
    if (artPrice) emailBody += `Listed Price: ${artPrice}\n`;
    if (artMedium) emailBody += `Medium: ${artMedium}\n`;
    if (fullImageUrl) emailBody += `Artwork Image: ${fullImageUrl}\n`;
    emailBody += `------------------------\n\n`;
    emailBody += `Buyer Information:\n`;
    emailBody += `Name: ${senderName}\n`;
    emailBody += `Email: ${senderEmail}\n\n`;
    emailBody += `Message:\n${message}\n\n`;
    emailBody += `Warm regards,\n${senderName}`;

    const subject = `Purchase Inquiry: "${artTitle}" from ${senderName}`;

    window.closeArtworkInquiryModal();
    if (typeof window.openEmailLauncher === 'function') {
      window.openEmailLauncher(subject, emailBody);
    } else {
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=vanikaraikta@gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
      window.open(gmailUrl, '_blank') || (window.location.href = `mailto:vanikaraikta@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`);
    }
    showToast('Inquiry recorded! Opening email...', '🎨');
  };

  window.handleArtworkInquiryWebOnly = async function(e) {
    if (e && e.preventDefault) e.preventDefault();

    const artId = document.getElementById('artInquiryArtId').value;
    const artTitle = document.getElementById('artInquiryArtTitle').value;
    const artPrice = document.getElementById('artInquiryArtPrice').value;
    const artImg = document.getElementById('artInquiryArtImg').value;
    const artMedium = document.getElementById('artInquiryArtMedium').value;
    const senderName = document.getElementById('artInquirySenderName').value.trim();
    const senderEmail = document.getElementById('artInquirySenderEmail').value.trim();
    const message = document.getElementById('artInquiryMessage').value.trim();

    if (!senderName || !senderEmail) {
      alert('Please enter your name and email address.');
      return;
    }

    if (containsLinkOrUrl(message) || containsLinkOrUrl(senderName)) {
      alert('For security and spam prevention, website links and URLs are not permitted in the inquiry message. Please write your text inquiry only.');
      return;
    }

    if (typeof submitInquiry === 'function') {
      await submitInquiry({
        type: 'artwork_buy',
        artworkId: artId,
        artworkTitle: artTitle,
        artworkPrice: artPrice,
        artworkImageUrl: artImg,
        artworkMedium: artMedium,
        senderName: senderName,
        senderEmail: senderEmail,
        message: message
      });
    }

    window.closeArtworkInquiryModal();
    showToast('Inquiry sent to Vani! She will reply to your email. ✦', '✉️');
  };

  // =========================================================================
  // 7. Global Keyboard (Escape to close modals)
  // =========================================================================
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.closeTheaterVideo();
      window.closePostVideoModal();
      window.closeEmailLauncher();
      window.closeArtworkInquiryModal();
      if (window.lightbox && window.lightbox.isOpen && window.lightbox.isOpen()) {
        window.lightbox.close();
      }
    }
  });

  // =========================================================================
  // 8. Contact & Commission Form Handler
  // =========================================================================
  const commissionForm = document.getElementById('commissionForm');
  if (commissionForm) {
    commissionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(commissionForm);
      const name = formData.get('name') || 'Art Patron';
      const email = formData.get('email') || '';
      const medium = formData.get('medium');
      const dimensions = formData.get('dimensions');
      const budget = formData.get('budget');
      const message = formData.get('message') || '';

      if (containsLinkOrUrl(message) || containsLinkOrUrl(name)) {
        alert('For security and spam prevention, website links and URLs are not permitted in the inquiry message. Please write your text inquiry only.');
        return;
      }

      let bodyText = `Dear Vani,\n\nI am reaching out via your portfolio website regarding an inquiry / collaboration.\n\n`;
      bodyText += `From: ${name}\n`;
      if (email) bodyText += `Email: ${email}\n`;
      if (medium) bodyText += `Preferred Medium: ${medium}\n`;
      if (dimensions) bodyText += `Approx. Dimensions: ${dimensions}\n`;
      if (budget) bodyText += `Budget Range: ${budget}\n`;
      bodyText += `\nMessage / Vision:\n${message}\n\n`;
      bodyText += `Looking forward to connecting with you!\n${name}`;

      const subject = `Inquiry for Vani Karaikta from ${name}`;

      // Save to Backend Database
      if (typeof submitInquiry === 'function') {
        submitInquiry({
          type: 'general_commission',
          senderName: name,
          senderEmail: email,
          message: bodyText
        });
      }

      // Open Email Launcher Dialog directly with prefilled draft
      openEmailLauncher(subject, bodyText);
    });
  }

  // =========================================================================
  // 9. Newsletter Form Handler
  // =========================================================================
  document.querySelectorAll('.footer-newsletter-form').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = form.querySelector('input[type="email"]');
      if (emailInput && emailInput.value) {
        showToast('Thank you! You\'ll receive exclusive previews. ✦', '✉️');
        emailInput.value = '';
      }
    });
  });

  // =========================================================================
  // 10. Auto-update copyright year
  // =========================================================================
  const yearSpan = document.getElementById('yearSpan');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});

