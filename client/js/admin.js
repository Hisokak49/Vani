/**
 * VANI KARAIKTA — ADMIN DASHBOARD LOGIC
 * Handles login, artwork CRUD, social links CRUD, video management, settings.
 */

// ============================================================
// AUTH
// ============================================================

const AUTH_KEY = 'vani_admin_auth';
const DEFAULT_PASSWORD = 'vani2026';

function getStoredPassword() {
  return localStorage.getItem(AUTH_KEY) || DEFAULT_PASSWORD;
}

function isLoggedIn() {
  return sessionStorage.getItem('vani_admin_session') === 'active';
}

async function login(password) {
  try {
    const API_BASE = (window.location.protocol.startsWith('http')) ? '' : 'http://localhost:3000';
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      sessionStorage.setItem('vani_admin_session', 'active');
      if (data.token) {
        sessionStorage.setItem('vani_admin_token', data.token);
      }
      return true;
    } else {
      return false;
    }
  } catch (err) {
    // Offline fallback
    if (password === getStoredPassword()) {
      sessionStorage.setItem('vani_admin_session', 'active');
      return true;
    }
    return false;
  }
}

function logout() {
  sessionStorage.removeItem('vani_admin_session');
  sessionStorage.removeItem('vani_admin_token');
  showLoginScreen();
}

// ============================================================
// SCREEN MANAGEMENT
// ============================================================

function showLoginScreen() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';
  const pwInput = document.getElementById('passwordInput');
  if (pwInput) { pwInput.value = ''; pwInput.focus(); }
}

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'flex';
  showTab('artworks');
}

function showTab(tabName) {
  // Update sidebar buttons
  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });
  // Show/hide tab content
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.style.display = tab.getAttribute('data-tab-id') === tabName ? 'block' : 'none';
  });
  // Refresh content
  if (tabName === 'artworks') renderAdminArtworks();
  if (tabName === 'inquiries') renderAdminInquiries();
  if (tabName === 'social') renderAdminSocialLinks();
  if (tabName === 'videos') renderAdminVideos();
  updateInquiriesBadge();
}

window.openProfilePhotoModal = function() {
  const modal = document.getElementById('profilePhotoModal');
  if (modal) {
    modal.style.display = 'flex';
    renderAdminProfilePhoto();
  }
};

window.closeProfilePhotoModal = function() {
  const modal = document.getElementById('profilePhotoModal');
  if (modal) modal.style.display = 'none';
};

function updateSidebarAvatar(url) {
  const photoUrl = url || (typeof getProfilePhoto === 'function' ? getProfilePhoto() : 'assests/ppf.png');
  const sidebarImg = document.getElementById('sidebarAvatarImg');
  if (sidebarImg) {
    sidebarImg.src = photoUrl;
    sidebarImg.style.display = 'block';
  }
  const loginImg = document.getElementById('loginAvatarImg');
  if (loginImg) {
    loginImg.src = photoUrl;
    loginImg.style.display = 'block';
  }
}

// ============================================================
// ADMIN TOASTS
// ============================================================

function adminToast(msg, type) {
  type = type || 'success';
  let toast = document.getElementById('adminToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'adminToast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'admin-toast admin-toast-' + type + ' show';
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ============================================================
// ============================================================
// ARTWORK MANAGEMENT & DIRECT PHOTO UPLOAD
// ============================================================

/**
 * Compresses an image file from phone gallery or desktop files
 * to an optimized base64 string (max 1200px dimension, 85% quality JPEG)
 */
function compressAndReadImage(file, callback) {
  if (!file || !file.type.startsWith('image/')) {
    adminToast('Please select a valid image file (JPG, PNG, WebP).', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const maxDim = 1200;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Output as compressed JPEG
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      callback(compressedDataUrl);
    };
    img.onerror = function() {
      adminToast('Could not load the image file.', 'error');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function handleArtworkFileSelect(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const dropZone = document.getElementById('artDropZone');
  if (dropZone) dropZone.classList.add('uploading');

  compressAndReadImage(file, function(dataUrl) {
    document.getElementById('artImageBase64').value = dataUrl;
    
    const previewContainer = document.getElementById('artPreviewContainer');
    const previewImg = document.getElementById('artImagePreview');
    const dropZone = document.getElementById('artDropZone');

    if (previewImg) previewImg.src = dataUrl;
    if (previewContainer) previewContainer.style.display = 'block';
    if (dropZone) {
      dropZone.style.display = 'none';
      dropZone.classList.remove('uploading');
    }
    adminToast('Photo selected! 📸');
  });
}

function removeArtworkPhoto() {
  document.getElementById('artImageBase64').value = '';
  const fileInput = document.getElementById('artFileInput');
  if (fileInput) fileInput.value = '';
  
  const previewContainer = document.getElementById('artPreviewContainer');
  const dropZone = document.getElementById('artDropZone');
  if (previewContainer) previewContainer.style.display = 'none';
  if (dropZone) dropZone.style.display = 'block';
}

function renderAdminArtworks() {
  const artworks = getArtworks();
  const container = document.getElementById('adminArtworkList');
  if (!container) return;

  container.className = 'admin-artwork-grid';

  if (artworks.length === 0) {
    container.innerHTML = `
      <div class="admin-empty-state" style="grid-column: 1 / -1;">
        <div class="admin-empty-icon">🖼️</div>
        <h3>No artworks yet</h3>
        <p>Click "＋ Add New Artwork" above to post your first piece.</p>
      </div>`;
    return;
  }

  container.innerHTML = artworks.map(art => `
    <div class="admin-artwork-card" id="acard-${art.id}">
      <div class="admin-artwork-thumb">
        ${art.imageUrl
          ? `<img src="${art.imageUrl}" alt="${escHtml(art.title)}" onerror="this.parentElement.innerHTML='<div class=\\'thumb-placeholder\\'>📷<br>No image</div>'">`
          : `<div class="thumb-placeholder">📷<br>No photo</div>`
        }
      </div>
      <div class="admin-artwork-info">
        <h3 class="admin-artwork-title">${escHtml(art.title)}</h3>
        <p class="admin-artwork-meta">${[art.medium, art.dimensions, art.year].filter(Boolean).join(' · ')}</p>
        ${art.description ? `<p class="admin-artwork-desc">${escHtml(art.description)}</p>` : ''}
        <div class="admin-artwork-badges">
          <span class="admin-badge ${art.forSale ? 'badge-sale' : 'badge-nosale'}">
            ${art.forSale ? '✓ Available for Sale' : '✗ Not for Sale'}
          </span>
          ${art.price ? `<span class="admin-badge badge-price">💰 ${escHtml(art.price)}</span>` : ''}
        </div>
      </div>
      <div class="admin-artwork-actions">
        <button class="admin-btn admin-btn-sm admin-btn-secondary" onclick="openEditArtwork('${art.id}')">✏️ Edit</button>
        <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="confirmDeleteArtwork('${art.id}')">🗑️ Delete</button>
      </div>
    </div>
  `).join('');
}

function openAddArtworkPanel() {
  const panel = document.getElementById('addArtworkPanel');
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
  document.getElementById('artworkFormTitle').textContent = 'Add New Artwork';
  document.getElementById('artworkForm').reset();
  document.getElementById('artworkEditId').value = '';
  document.getElementById('artImageBase64').value = '';
  
  const previewContainer = document.getElementById('artPreviewContainer');
  const dropZone = document.getElementById('artDropZone');
  if (previewContainer) previewContainer.style.display = 'none';
  if (dropZone) dropZone.style.display = 'block';

  if (panel.style.display === 'block') panel.scrollIntoView({ behavior: 'smooth' });
}

function openEditArtwork(id) {
  const art = getArtworks().find(a => a.id === id);
  if (!art) return;
  const panel = document.getElementById('addArtworkPanel');
  panel.style.display = 'block';
  document.getElementById('artworkFormTitle').textContent = 'Edit Artwork';
  document.getElementById('artworkEditId').value = id;
  document.getElementById('artTitle').value = art.title || '';
  document.getElementById('artPrice').value = art.price || '';
  document.getElementById('artImageBase64').value = art.imageUrl || '';
  document.getElementById('artDesc').value = art.description || '';
  document.getElementById('artMedium').value = art.medium || '';
  document.getElementById('artDimensions').value = art.dimensions || '';
  document.getElementById('artYear').value = art.year || '';
  document.getElementById('artForSale').value = art.forSale ? 'yes' : 'no';
  
  const previewContainer = document.getElementById('artPreviewContainer');
  const previewImg = document.getElementById('artImagePreview');
  const dropZone = document.getElementById('artDropZone');

  if (art.imageUrl) {
    if (previewImg) previewImg.src = art.imageUrl;
    if (previewContainer) previewContainer.style.display = 'block';
    if (dropZone) dropZone.style.display = 'none';
  } else {
    if (previewContainer) previewContainer.style.display = 'none';
    if (dropZone) dropZone.style.display = 'block';
  }

  panel.scrollIntoView({ behavior: 'smooth' });
}

function saveArtworkForm(e) {
  e.preventDefault();
  const editId = document.getElementById('artworkEditId').value;
  const data = {
    title: document.getElementById('artTitle').value.trim(),
    price: document.getElementById('artPrice').value.trim(),
    imageUrl: document.getElementById('artImageBase64').value.trim(),
    description: document.getElementById('artDesc').value.trim(),
    medium: document.getElementById('artMedium').value.trim(),
    dimensions: document.getElementById('artDimensions').value.trim(),
    year: document.getElementById('artYear').value.trim(),
    forSale: document.getElementById('artForSale').value === 'yes'
  };
  if (!data.title) { adminToast('Please enter a title for the artwork.', 'error'); return; }

  if (editId) {
    updateArtwork(editId, data);
    adminToast('Artwork updated! ✦');
  } else {
    addArtwork(data);
    adminToast('Artwork added to your portfolio! ✦');
  }
  document.getElementById('addArtworkPanel').style.display = 'none';
  document.getElementById('artworkForm').reset();
  renderAdminArtworks();
}

function confirmDeleteArtwork(id) {
  const art = getArtworks().find(a => a.id === id);
  if (!art) return;
  if (confirm(`Delete "${art.title}"? This cannot be undone.`)) {
    deleteArtwork(id);
    adminToast('Artwork removed.', 'info');
    renderAdminArtworks();
  }
}

// ============================================================
// INQUIRIES & MESSAGES MANAGEMENT
// ============================================================

async function renderAdminInquiries() {
  const container = document.getElementById('adminInquiriesList');
  if (!container) return;

  const inquiries = typeof fetchInquiriesFromServer === 'function' 
    ? await fetchInquiriesFromServer() 
    : (typeof getLocalInquiries === 'function' ? getLocalInquiries() : []);

  updateInquiriesBadge(inquiries);

  if (inquiries.length === 0) {
    container.innerHTML = `
      <div class="admin-empty-state">
        <div class="admin-empty-icon">📬</div>
        <h3>No inquiries yet</h3>
        <p>When someone sends an inquiry or purchase request from your portfolio, it will appear here.</p>
      </div>`;
    return;
  }

  container.innerHTML = inquiries.map(inq => {
    const isNew = inq.status === 'new';
    const dateStr = inq.createdAt ? new Date(inq.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '';
    const hasArtwork = inq.artworkTitle || inq.artworkImageUrl;

    return `
      <div class="inquiry-card ${isNew ? 'status-new' : ''}" id="inqcard-${inq.id}">
        <div class="inquiry-header">
          <div>
            <div class="inquiry-sender-name">
              <span>👤 ${escHtml(inq.senderName)}</span>
              ${isNew ? '<span class="admin-badge badge-sale">NEW</span>' : '<span class="admin-badge" style="background:#E5E5EA;color:#666;">READ</span>'}
            </div>
            <a href="mailto:${escHtml(inq.senderEmail)}" class="inquiry-sender-email">✉️ ${escHtml(inq.senderEmail)}</a>
          </div>
          <div class="inquiry-time">${dateStr}</div>
        </div>

        ${hasArtwork ? `
          <div class="inquiry-artwork-box">
            ${inq.artworkImageUrl
              ? `<img src="${inq.artworkImageUrl}" alt="${escHtml(inq.artworkTitle || '')}" class="inquiry-artwork-thumb" onerror="this.style.display='none'">`
              : '<div class="inquiry-artwork-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.2rem;">🖼️</div>'
            }
            <div>
              <div class="inquiry-artwork-title">🎨 ${escHtml(inq.artworkTitle || 'Artwork')}</div>
              ${inq.artworkMedium ? `<div class="inquiry-artwork-meta">${escHtml(inq.artworkMedium)}</div>` : ''}
            </div>
            ${inq.artworkPrice ? `<div class="inquiry-artwork-price">${escHtml(inq.artworkPrice)}</div>` : ''}
          </div>
        ` : ''}

        <div class="inquiry-message">
          <strong>Message:</strong><br>
          ${escHtml(inq.message || 'No additional message provided.')}
        </div>

        <div class="inquiry-actions">
          <a href="mailto:${encodeURIComponent(inq.senderEmail)}?subject=${encodeURIComponent('Re: ' + (inq.artworkTitle ? 'Inquiry regarding "' + inq.artworkTitle + '"' : 'Your Portfolio Message'))}&body=${encodeURIComponent('Hi ' + inq.senderName + ',\n\nThank you for reaching out regarding ' + (inq.artworkTitle ? '"' + inq.artworkTitle + '"' : 'my artwork') + '!\n\nWarm regards,\nVani Karaikta')}"
             class="admin-btn admin-btn-sm admin-btn-primary">
            ✉️ Reply via Email
          </a>
          ${isNew ? `
            <button class="admin-btn admin-btn-sm admin-btn-secondary" onclick="markInquiryRead('${inq.id}')">
              ✓ Mark Read
            </button>
          ` : ''}
          <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="deleteInquiryBtn('${inq.id}')">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function markInquiryRead(id) {
  if (typeof updateInquiryStatus === 'function') {
    await updateInquiryStatus(id, 'read');
    renderAdminInquiries();
    adminToast('Inquiry marked as read.');
  }
}

async function deleteInquiryBtn(id) {
  if (confirm('Delete this inquiry?')) {
    if (typeof deleteInquiry === 'function') {
      await deleteInquiry(id);
      renderAdminInquiries();
      adminToast('Inquiry deleted.', 'info');
    }
  }
}

function updateInquiriesBadge(inquiries) {
  const badge = document.getElementById('adminInquiriesBadge');
  if (!badge) return;

  const list = inquiries || (typeof getLocalInquiries === 'function' ? getLocalInquiries() : []);
  const newCount = list.filter(i => i.status === 'new').length;

  if (newCount > 0) {
    badge.textContent = newCount;
    badge.style.display = 'inline-block';
  } else {
    badge.style.display = 'none';
  }
}

// ============================================================
// PROFILE PHOTO MANAGEMENT
// ============================================================

async function renderAdminProfilePhoto() {
  const currentImg = document.getElementById('adminCurrentProfileImg');
  const historyContainer = document.getElementById('adminProfileHistoryList');

  try {
    const res = await fetch(`${API_BASE}/api/profile-photo`);
    const data = await res.json();

    const activeUrl = (data && data.activePhoto) ? data.activePhoto : (typeof getProfilePhoto === 'function' ? getProfilePhoto() : 'assests/ppf.png');
    if (currentImg) currentImg.src = activeUrl;
    updateSidebarAvatar(activeUrl);

    const history = (data && data.history) ? data.history : [];

    if (historyContainer) {
      if (history.length === 0) {
        historyContainer.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; color: var(--admin-text-muted); padding: 1.5rem;">
            No previous photos uploaded yet. When you upload new photos, past ones will appear here.
          </div>`;
        return;
      }

      historyContainer.innerHTML = history.map(item => {
        const isCurrent = item.imageUrl === activeUrl || item.isActive;
        const dateStr = item.uploadedAt ? new Date(item.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

        return `
          <div class="profile-history-item ${isCurrent ? 'is-active' : ''}">
            <img src="${item.imageUrl}" alt="Past avatar" class="profile-history-thumb" onerror="this.src='assests/ppf.png'">
            <div style="font-size: 0.78rem; color: var(--admin-text-muted); margin-bottom: 0.5rem;">
              ${dateStr || 'Uploaded photo'}
            </div>
            ${isCurrent 
              ? '<span class="admin-badge badge-sale" style="display:inline-block;margin-bottom:0.35rem;">✓ Active</span>' 
              : `<button class="admin-btn admin-btn-sm admin-btn-secondary" style="width:100%;margin-bottom:0.35rem;" onclick="restoreOldProfilePhoto('${item.id}')">✓ Set Active</button>`
            }
            ${!isCurrent ? `
              <button class="admin-btn admin-btn-sm admin-btn-danger" style="width:100%;" onclick="removeOldProfilePhoto('${item.id}')">🗑️ Delete</button>
            ` : ''}
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    console.warn('Could not load profile photos:', err);
  }
}

async function handleProfilePhotoFileSelect(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    adminToast('Please select a valid image file (JPG, PNG, WebP).', 'error');
    return;
  }

  adminToast('Optimizing & uploading profile photo...', 'info');

  try {
    // Compress and read image for instant feedback & storage
    const optimizedBase64 = await compressAndReadImage(file, 800, 0.85);
    
    // Save locally and to backend
    if (typeof saveNewProfilePhoto === 'function') {
      await saveNewProfilePhoto(file || optimizedBase64);
    }

    renderAdminProfilePhoto();
    adminToast('Profile photo updated and saved to database! ✦');
  } catch (err) {
    console.error('Profile photo upload error:', err);
    adminToast('Could not upload profile photo. Please try again.', 'error');
  }

  // Clear input
  e.target.value = '';
}

async function restoreOldProfilePhoto(id) {
  if (typeof activateOldProfilePhoto === 'function') {
    await activateOldProfilePhoto(id);
    renderAdminProfilePhoto();
    adminToast('Profile photo restored! ✦');
  }
}

async function removeOldProfilePhoto(id) {
  if (confirm('Delete this photo from your history?')) {
    if (typeof deleteOldProfilePhoto === 'function') {
      await deleteOldProfilePhoto(id);
      renderAdminProfilePhoto();
      adminToast('Photo removed from history.', 'info');
    }
  }
}

// ============================================================
// SOCIAL LINKS MANAGEMENT (2-COLUMN RESPONSIVE CARDS)
// ============================================================

function renderAdminSocialLinks() {
  const links = getSocialLinks();
  const container = document.getElementById('adminSocialList');
  if (!container) return;

  container.className = 'admin-social-grid';
  container.innerHTML = links.map((link, idx) => `
    <div class="admin-social-card" id="srow-${link.id}">
      <div class="social-card-top">
        <div class="social-card-brand">
          <div class="social-card-icon-badge" style="background: ${link.color};">
            ${getSocialIconSVG(link.iconType, 24)}
          </div>
          <div>
            <div class="social-card-name">${escHtml(link.platform)}</div>
            <div class="social-card-status">${link.active ? '🟢 Active on Portfolio' : '⚪ Hidden'}</div>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:0.5rem;">
          <label style="font-size:0.8rem; font-weight:600; color:var(--admin-text-muted); cursor:pointer;">
            <input type="checkbox" ${link.active ? 'checked' : ''} onchange="updateSocialField(${idx}, 'active', this.checked)" style="width:18px;height:18px;vertical-align:middle;accent-color:var(--admin-accent);">
            Show
          </label>
        </div>
      </div>

      <div class="social-card-fields">
        <div class="admin-form-row" style="margin-bottom:0.4rem;">
          <div class="admin-field">
            <label style="font-size:0.75rem;">Platform Name</label>
            <input type="text" value="${escHtml(link.platform)}" onchange="updateSocialField(${idx}, 'platform', this.value)" placeholder="e.g. Instagram">
          </div>
          <div class="admin-field">
            <label style="font-size:0.75rem;">Username / Handle</label>
            <input type="text" value="${escHtml(link.handle)}" onchange="updateSocialField(${idx}, 'handle', this.value)" placeholder="e.g. @unfiltered_vaniii">
          </div>
        </div>

        <div class="admin-field" style="margin-bottom:0.4rem;">
          <label style="font-size:0.75rem;">Profile URL</label>
          <input type="url" value="${escHtml(link.url)}" onchange="updateSocialField(${idx}, 'url', this.value)" placeholder="https://...">
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.25rem;">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <label style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--admin-text-muted);">Colour:</label>
            <input type="color" value="${link.color}" onchange="updateSocialField(${idx}, 'color', this.value)" style="width:36px; height:32px; padding:2px; border:1px solid #ddd; border-radius:6px; cursor:pointer;">
          </div>

          <div style="display:flex; gap:0.5rem;">
            ${link.url ? `<a href="${escHtml(link.url)}" target="_blank" rel="noopener" class="admin-btn admin-btn-sm admin-btn-secondary" style="text-decoration:none;">↗ Visit</a>` : ''}
            ${!link.isDefault ? `<button type="button" class="admin-btn admin-btn-sm admin-btn-danger" onclick="deleteSocialLink(${idx})">🗑️ Remove</button>` : ''}
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function updateSocialField(idx, field, value) {
  const links = getSocialLinks();
  if (links[idx]) {
    links[idx][field] = value;
    saveSocialLinks(links);
    // If toggled visibility or color, re-render to update badges
    if (field === 'active' || field === 'color') renderAdminSocialLinks();
    adminToast('Saved ✦');
  }
}

function saveSocialLinksBtn() {
  adminToast('Social links are saved automatically! ✦');
}

function deleteSocialLink(idx) {
  const links = getSocialLinks();
  const link = links[idx];
  if (!link) return;
  if (confirm(`Remove "${link.platform}" from your portfolio?`)) {
    links.splice(idx, 1);
    saveSocialLinks(links);
    renderAdminSocialLinks();
    adminToast('Platform removed.');
  }
}

function addNewPlatform(e) {
  e.preventDefault();
  const name = document.getElementById('newPlatformName').value.trim();
  const handle = document.getElementById('newPlatformHandle').value.trim();
  const url = document.getElementById('newPlatformUrl').value.trim();
  const color = document.getElementById('newPlatformColor').value;

  if (!name || !url) { adminToast('Please enter at least a platform name and URL.', 'error'); return; }

  const links = getSocialLinks();
  links.push({
    id: 'custom-' + Date.now(),
    platform: name,
    handle: handle,
    url: url,
    color: color || '#888888',
    iconType: guessPlatformIcon(name),
    active: true,
    isDefault: false
  });
  saveSocialLinks(links);
  document.getElementById('newPlatformForm').reset();
  document.getElementById('addPlatformPanel').style.display = 'none';
  renderAdminSocialLinks();
  adminToast(name + ' added to your portfolio! ✦');
}

function guessPlatformIcon(name) {
  const n = name.toLowerCase();
  if (n.includes('tiktok')) return 'tiktok';
  if (n.includes('behance')) return 'behance';
  if (n.includes('instagram')) return 'instagram';
  if (n.includes('youtube')) return 'youtube';
  if (n.includes('pinterest')) return 'pinterest';
  if (n.includes('threads')) return 'threads';
  if (n.includes('website') || n.includes('blog')) return 'website';
  return 'other';
}

// ============================================================
// VIDEO MANAGEMENT (DIRECT UPLOAD & YOUTUBE / SOCIAL LINKS)
// ============================================================

window.switchVideoMode = function(mode) {
  const isUpload = mode === 'upload';
  document.getElementById('adminVideoSourceType').value = mode;
  document.getElementById('vmodeUploadBtn').classList.toggle('active', isUpload);
  document.getElementById('vmodeLinkBtn').classList.toggle('active', !isUpload);
  document.getElementById('videoUploadModeGroup').style.display = isUpload ? 'block' : 'none';
  document.getElementById('videoLinkModeGroup').style.display = isUpload ? 'none' : 'block';
};

window.handleAdminVideoFileSelect = async function(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const dropZone = document.getElementById('videoDropZone');
  const titleText = document.getElementById('videoUploadTitleText');
  const subText = document.getElementById('videoUploadSubText');
  const previewBox = document.getElementById('adminVideoPreviewBox');
  const player = document.getElementById('adminVideoFilePlayer');
  const submitBtn = document.getElementById('adminVideoSubmitBtn');

  if (!file.type.startsWith('video/')) {
    adminToast('Please select a valid video file (MP4, MOV, WebM).', 'error');
    return;
  }

  // File size check (250MB)
  if (file.size > 250 * 1024 * 1024) {
    adminToast('Video is larger than 250MB. Please select a smaller video.', 'error');
    return;
  }

  const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
  titleText.textContent = `Uploading ${file.name} (${fileSizeMB} MB)...`;
  subText.textContent = 'Please wait while your video is saved to the server...';
  if (submitBtn) submitBtn.disabled = true;

  try {
    const formData = new FormData();
    formData.append('video', file);

    const res = await fetch(`${API_BASE}/api/upload-video`, {
      method: 'POST',
      body: formData
    });
    const result = await res.json();

    if (result.success && result.videoUrl) {
      document.getElementById('adminUploadedVideoUrl').value = result.videoUrl;
      
      // Auto fill title if empty
      const titleInput = document.getElementById('adminVideoTitle');
      if (!titleInput.value) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        titleInput.value = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      }

      dropZone.style.display = 'none';
      previewBox.style.display = 'block';
      player.src = result.videoUrl;
      adminToast('Video uploaded successfully! 🎬');
    } else {
      throw new Error(result.error || 'Upload failed');
    }
  } catch (err) {
    console.error('Video upload error:', err);
    adminToast('Could not upload video file. Please try again.', 'error');
    titleText.textContent = 'Choose Video File from Desktop or Phone';
    subText.textContent = 'Tap or click to select your video file (MP4, MOV, WebM)';
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
};

window.removeAdminVideoFile = function() {
  document.getElementById('adminUploadedVideoUrl').value = '';
  document.getElementById('adminVideoFileInput').value = '';
  document.getElementById('videoDropZone').style.display = 'block';
  document.getElementById('adminVideoPreviewBox').style.display = 'none';
  document.getElementById('adminVideoFilePlayer').src = '';
  document.getElementById('videoUploadTitleText').textContent = 'Choose Video File from Desktop or Phone';
  document.getElementById('videoUploadSubText').textContent = 'Tap or click to select your video file (MP4, MOV, WebM)';
};

function renderAdminVideos() {
  const videos = typeof getStoredVideos === 'function' ? getStoredVideos().filter(v => !v.isPlaceholder) : [];
  const container = document.getElementById('adminVideoList');
  if (!container) return;

  if (videos.length === 0) {
    container.innerHTML = `
      <div class="admin-empty-state" style="grid-column: 1 / -1;">
        <div class="admin-empty-icon">🎬</div>
        <h3>No videos added yet</h3>
        <p>Upload a video from your computer or paste a YouTube / Instagram link above.</p>
      </div>`;
    return;
  }

  container.innerHTML = videos.map(v => {
    const isFile = v.platform === 'local' || (v.url && v.url.startsWith('/uploads/'));
    return `
      <div class="admin-video-card" id="vcard-${v.id}">
        <div class="admin-video-preview-wrapper">
          ${isFile 
            ? `<video src="${v.url}" controls poster="${v.thumbnail || ''}" style="width:100%;height:220px;object-fit:contain;background:#000;"></video>`
            : (v.embedUrl 
                ? `<iframe src="${v.embedUrl}" allowfullscreen allow="autoplay; encrypted-media"></iframe>`
                : `<div style="color:#aaa;padding:2rem;text-align:center;">🎬 ${escHtml(v.platform || 'Video')}</div>`
              )
          }
        </div>
        <div class="admin-video-card-body">
          <div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem; margin-bottom:0.4rem;">
              <span class="admin-badge badge-cat">${escHtml(v.category || 'Studio')}</span>
              <span style="font-size:0.78rem; color:var(--admin-text-muted);">${v.date || ''}</span>
            </div>
            <h4 class="admin-video-card-title">${escHtml(v.title)}</h4>
            ${v.description ? `<p style="font-size:0.85rem; color:#555; margin-top:0.35rem; line-height:1.4;">${escHtml(v.description)}</p>` : ''}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.85rem; padding-top:0.75rem; border-top:1px solid var(--admin-border);">
            <span style="font-size:0.8rem; color:var(--admin-text-muted);">
              ${isFile ? '📁 Uploaded File' : '🔗 ' + (v.platform || 'YouTube')}
            </span>
            <button type="button" class="admin-btn admin-btn-sm admin-btn-danger" onclick="adminDeleteVideo('${v.id}')">
              🗑️ Remove
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function adminDeleteVideo(id) {
  if (typeof removeVideoFromPortfolio === 'function') {
    if (confirm('Remove this video from your portfolio?')) {
      removeVideoFromPortfolio(id);
      renderAdminVideos();
      adminToast('Video removed.', 'info');
    }
  }
}

function adminAddVideo(e) {
  e.preventDefault();
  const sourceType = document.getElementById('adminVideoSourceType').value;
  const title = document.getElementById('adminVideoTitle').value.trim();
  const category = document.getElementById('adminVideoCategory').value;
  const desc = document.getElementById('adminVideoDesc').value.trim();

  let finalUrl = '';
  let platform = 'youtube';

  if (sourceType === 'upload') {
    finalUrl = document.getElementById('adminUploadedVideoUrl').value.trim();
    if (!finalUrl) {
      adminToast('Please select and upload a video file first.', 'error');
      return;
    }
    platform = 'local';
  } else {
    finalUrl = document.getElementById('adminVideoUrl').value.trim();
    if (!finalUrl) {
      adminToast('Please paste a YouTube or video URL.', 'error');
      return;
    }
    platform = finalUrl.includes('instagram') ? 'instagram' : 'youtube';
  }

  if (typeof addVideoToPortfolio === 'function') {
    addVideoToPortfolio({
      url: finalUrl,
      title: title || 'Studio Video',
      category: category,
      description: desc,
      platform: platform
    });

    document.getElementById('adminVideoForm').reset();
    window.removeAdminVideoFile();
    renderAdminVideos();
    adminToast('Video posted to your portfolio! 🎬');
  }
}

// ============================================================
// SETTINGS
// ============================================================

async function changePassword(e) {
  e.preventDefault();
  const current = document.getElementById('currentPw').value;
  const newPw = document.getElementById('newPw').value;
  const confirm2 = document.getElementById('confirmPw').value;

  if (newPw.length < 4) { adminToast('New password must be at least 4 characters.', 'error'); return; }
  if (newPw !== confirm2) { adminToast('New passwords do not match.', 'error'); return; }

  try {
    const API_BASE = (window.location.protocol.startsWith('http')) ? '' : 'http://localhost:3000';
    const res = await fetch(`${API_BASE}/api/auth/change-password`, {
      method: 'POST',
      headers: typeof getAdminAuthHeaders === 'function' ? getAdminAuthHeaders() : { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: newPw })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      localStorage.setItem(AUTH_KEY, newPw);
      document.getElementById('changePasswordForm').reset();
      adminToast('Password changed securely in database! ✦');
      return;
    } else {
      adminToast(data.error || 'Could not change password.', 'error');
      return;
    }
  } catch (err) {
    if (current !== getStoredPassword()) { adminToast('Current password is wrong. Try again.', 'error'); return; }
    localStorage.setItem(AUTH_KEY, newPw);
    document.getElementById('changePasswordForm').reset();
    adminToast('Password changed successfully! ✦');
  }
}

// ============================================================
// HELPERS
// ============================================================

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  updateSidebarAvatar();
  if (typeof fetchProfilePhotoFromServer === 'function') {
    fetchProfilePhotoFromServer(data => {
      if (data && data.activePhoto) updateSidebarAvatar(data.activePhoto);
    });
  }

  if (isLoggedIn()) {
    showDashboard();
  } else {
    showLoginScreen();
  }

  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const pw = document.getElementById('passwordInput').value;
      const ok = await login(pw);
      if (ok) {
        showDashboard();
      } else {
        const errEl = document.getElementById('loginError');
        if (errEl) errEl.textContent = 'Wrong password or account temporarily locked. Please try again.';
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordInput').focus();
      }
    });
  }

  // Artwork form
  const artworkForm = document.getElementById('artworkForm');
  if (artworkForm) artworkForm.addEventListener('submit', saveArtworkForm);

  // New platform form
  const newPlatformForm = document.getElementById('newPlatformForm');
  if (newPlatformForm) newPlatformForm.addEventListener('submit', addNewPlatform);

  // Video form
  const adminVideoForm = document.getElementById('adminVideoForm');
  if (adminVideoForm) adminVideoForm.addEventListener('submit', adminAddVideo);

  // Password change form
  const changePwForm = document.getElementById('changePasswordForm');
  if (changePwForm) changePwForm.addEventListener('submit', changePassword);

  // Escape key - close panels and modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const panel = document.getElementById('addArtworkPanel');
      if (panel) panel.style.display = 'none';
      const platPanel = document.getElementById('addPlatformPanel');
      if (platPanel) platPanel.style.display = 'none';
      if (typeof window.closeProfilePhotoModal === 'function') {
        window.closeProfilePhotoModal();
      }
    }
  });
});
