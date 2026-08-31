/**
 * VANI KARAIKTA — SHARED SITE DATA & BACKEND API BRIDGE
 * Synchronizes artworks, social links, videos, and inquiries with the Node.js + SQLite backend.
 */

const API_BASE = (window.location.protocol.startsWith('http')) ? '' : 'http://localhost:3000';

function getAdminAuthHeaders(extraHeaders = {}) {
  const token = sessionStorage.getItem('vani_admin_token') || localStorage.getItem('vani_admin_auth') || 'vani2026';
  return {
    'Content-Type': 'application/json',
    'x-admin-token': token,
    ...extraHeaders
  };
}

const SOCIAL_KEY = 'vani_social_links_v1';

const DEFAULT_SOCIAL_LINKS = [
  {
    id: 'instagram',
    platform: 'Instagram',
    handle: '@unfiltered_vaniii',
    url: 'https://www.instagram.com/unfiltered_vaniii/?hl=en',
    color: '#E1306C',
    iconType: 'instagram',
    active: true,
    isDefault: true
  },
  {
    id: 'youtube',
    platform: 'YouTube',
    handle: '',
    url: '',
    color: '#FF0000',
    iconType: 'youtube',
    active: false,
    isDefault: true
  },
  {
    id: 'threads',
    platform: 'Threads',
    handle: '',
    url: '',
    color: '#000000',
    iconType: 'threads',
    active: false,
    isDefault: true
  },
  {
    id: 'pinterest',
    platform: 'Pinterest',
    handle: '',
    url: '',
    color: '#E60023',
    iconType: 'pinterest',
    active: false,
    isDefault: true
  }
];

function getSocialLinks() {
  try {
    const data = localStorage.getItem(SOCIAL_KEY);
    if (data) return JSON.parse(data);
  } catch (e) { console.warn('Could not read social links:', e); }
  return JSON.parse(JSON.stringify(DEFAULT_SOCIAL_LINKS));
}

function saveSocialLinks(links) {
  try {
    localStorage.setItem(SOCIAL_KEY, JSON.stringify(links));
  } catch (e) { console.error('Could not save social links locally:', e); }

  // Sync with backend API
  fetch(`${API_BASE}/api/social-links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(links)
  }).catch(err => console.warn('Backend social sync skipped:', err));
}

function fetchSocialLinksFromServer(callback) {
  fetch(`${API_BASE}/api/social-links`)
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(SOCIAL_KEY, JSON.stringify(data));
        if (callback) callback(data);
      }
    })
    .catch(err => console.warn('Could not fetch social links from server:', err));
}

function getActiveSocialLinks() {
  return getSocialLinks().filter(l => l.active && l.url && l.url.trim());
}

// ============================================================
// ARTWORKS
// ============================================================

const ARTWORK_KEY = 'vani_artworks_v1';

function getArtworks() {
  try {
    const data = localStorage.getItem(ARTWORK_KEY);
    if (data) return JSON.parse(data);
  } catch (e) { console.warn('Could not read artworks:', e); }
  return [];
}

function saveArtworks(artworks) {
  try {
    localStorage.setItem(ARTWORK_KEY, JSON.stringify(artworks));
  } catch (e) { console.error('Could not save artworks locally:', e); }
}

function fetchArtworksFromServer(callback) {
  fetch(`${API_BASE}/api/artworks`)
    .then(r => r.json())
    .then(data => {
      if (Array.isArray(data)) {
        localStorage.setItem(ARTWORK_KEY, JSON.stringify(data));
        if (callback) callback(data);
      }
    })
    .catch(err => console.warn('Could not fetch artworks from server:', err));
}

async function addArtwork(artworkData) {
  const artworks = getArtworks();
  const newArtwork = {
    id: artworkData.id || 'art-' + Date.now(),
    title: artworkData.title || 'Untitled',
    price: artworkData.price || '',
    imageUrl: artworkData.imageUrl || '',
    description: artworkData.description || '',
    medium: artworkData.medium || '',
    dimensions: artworkData.dimensions || '',
    year: artworkData.year || new Date().getFullYear().toString(),
    forSale: artworkData.forSale !== false,
    postedAt: new Date().toISOString()
  };

  artworks.unshift(newArtwork);
  saveArtworks(artworks);

  // Sync to Backend
  try {
    const res = await fetch(`${API_BASE}/api/artworks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newArtwork)
    });
    const saved = await res.json();
    return saved;
  } catch (err) {
    console.warn('Backend artwork sync skipped:', err);
    return newArtwork;
  }
}

async function updateArtwork(id, updates) {
  const artworks = getArtworks();
  const idx = artworks.findIndex(a => a.id === id);
  if (idx !== -1) {
    artworks[idx] = { ...artworks[idx], ...updates };
    saveArtworks(artworks);

    try {
      await fetch(`${API_BASE}/api/artworks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(artworks[idx])
      });
    } catch (err) {
      console.warn('Backend artwork update skipped:', err);
    }
    return artworks[idx];
  }
  return null;
}

async function deleteArtwork(id) {
  saveArtworks(getArtworks().filter(a => a.id !== id));
  try {
    await fetch(`${API_BASE}/api/artworks/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('Backend artwork delete skipped:', err);
  }
}

// Upload file directly to server /uploads
async function uploadArtworkPhoto(file) {
  const formData = new FormData();
  formData.append('photo', file);

  try {
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success && data.imageUrl) {
      return data.imageUrl;
    }
    throw new Error(data.error || 'Upload failed');
  } catch (err) {
    console.warn('Upload API not available, falling back to local optimization:', err);
    return null;
  }
}

// ============================================================
// INQUIRIES & MESSAGES
// ============================================================

const INQUIRIES_KEY = 'vani_inquiries_v1';

function getLocalInquiries() {
  try {
    const data = localStorage.getItem(INQUIRIES_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return [];
}async function fetchInquiriesFromServer() {
  try {
    const res = await fetch(`${API_BASE}/api/inquiries`, {
      headers: getAdminAuthHeaders()
    });
    const data = await res.json();
    if (Array.isArray(data)) {
      localStorage.setItem(INQUIRIES_KEY, JSON.stringify(data));
      return data;
    }
  } catch (e) {
    console.warn('Could not fetch inquiries from server:', e);
  }
  return getLocalInquiries();
}

async function submitInquiry(inquiryData) {
  const localList = getLocalInquiries();
  const newInq = {
    id: 'inq-' + Date.now(),
    type: inquiryData.type || 'artwork_inquiry',
    artworkId: inquiryData.artworkId || null,
    artworkTitle: inquiryData.artworkTitle || null,
    artworkPrice: inquiryData.artworkPrice || null,
    artworkImageUrl: inquiryData.artworkImageUrl || null,
    artworkMedium: inquiryData.artworkMedium || null,
    senderName: inquiryData.senderName || 'Anonymous',
    senderEmail: inquiryData.senderEmail || '',
    message: inquiryData.message || '',
    status: 'new',
    createdAt: new Date().toISOString()
  };

  localList.unshift(newInq);
  localStorage.setItem(INQUIRIES_KEY, JSON.stringify(localList));

  try {
    const res = await fetch(`${API_BASE}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInq)
    });
    return await res.json();
  } catch (err) {
    console.warn('Backend inquiry sync skipped:', err);
    return { success: true, inquiry: newInq };
  }
}

async function updateInquiryStatus(id, status) {
  const localList = getLocalInquiries();
  const idx = localList.findIndex(i => i.id === id);
  if (idx !== -1) {
    localList[idx].status = status;
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(localList));
  }

  try {
    await fetch(`${API_BASE}/api/inquiries/${id}/status`, {
      method: 'PATCH',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify({ status })
    });
  } catch (err) {}
}

async function deleteInquiry(id) {
  const localList = getLocalInquiries().filter(i => i.id !== id);
  localStorage.setItem(INQUIRIES_KEY, JSON.stringify(localList));

  try {
    const res = await fetch(`${API_BASE}/api/inquiries/${id}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders()
    });
    return await res.json();
  } catch (err) {
    console.warn('Backend delete inquiry skipped:', err);
  }
}

// ============================================================
// SOCIAL ICON SVG HELPER
// ============================================================

function getSocialIconSVG(iconType, size) {
  size = size || 22;
  const icons = {
    instagram: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`,
    youtube: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>`,
    threads: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.88 14.54c-.66.86-1.57 1.34-2.67 1.42-.45.03-.91.01-1.36-.06-1.93-.31-3.35-1.59-3.79-3.41-.47-1.98.24-3.95 1.83-5.11 1.47-1.07 3.29-1.28 5.04-.66.38.13.62.5.58.9-.04.4-.35.71-.75.69-1.39-.14-2.73.16-3.72.93-1.05.82-1.51 2.11-1.19 3.41.31 1.25 1.34 2.14 2.65 2.29.35.04.7.04 1.05-.01.76-.11 1.37-.47 1.83-1.08.31-.41.87-.5 1.28-.2.42.3.5.86.23 1.28z"/></svg>`,
    pinterest: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.09.375-.293 1.199-.334 1.365-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.538.535 6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>`,
    tiktok: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.72a8.23 8.23 0 0 0 4.82 1.54V6.8a4.85 4.85 0 0 1-1.05-.11z"/></svg>`,
    behance: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor"><path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 3.211 3.483 3.312 4.588 2.029H23.726zm-7.726-3h3.957c-.306-1.995-1.44-2.49-2.026-2.49-.658 0-1.74.389-1.931 2.49zM9.86 14.674c0 2.195-1.765 3.326-3.94 3.326H0V6h6.042c2.139 0 3.708 1.065 3.708 3.218 0 1.174-.537 1.98-1.352 2.486C9.205 12.163 9.86 13.14 9.86 14.674zm-6.48-6.28v1.997h2.055c.625 0 1.125-.407 1.125-1.02C6.56 8.783 6.043 8.394 5.435 8.394H3.38zm0 4.184v2.249h2.24c.637 0 1.268-.37 1.268-1.12 0-.748-.631-1.129-1.268-1.129H3.38z"/></svg>`,
    website: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    email: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
    other: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71\"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71\"/></svg>`
  };
  return icons[iconType] || icons.other;
}

// ============================================================
// PROFILE PHOTO MANAGEMENT
// ============================================================

const PROFILE_PHOTO_KEY = 'vani_profile_photo_v1';
const DEFAULT_PROFILE_PHOTO = 'assests/ppf.png';

function getProfilePhoto() {
  try {
    const data = localStorage.getItem(PROFILE_PHOTO_KEY);
    if (data) return data;
  } catch (e) {}
  return DEFAULT_PROFILE_PHOTO;
}

function applyProfilePhotoToDOM(photoUrl) {
  if (!photoUrl || typeof document === 'undefined') return;
  
  document.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src') || '';
    if (src.includes('ppf.png') || src.includes('uploads/art-') || img.classList.contains('profile-photo-target') || img.id === 'headerProfileImg' || img.id === 'aboutProfileImg') {
      img.src = photoUrl;
    }
  });
}

function fetchProfilePhotoFromServer(callback) {
  fetch(`${API_BASE}/api/profile-photo`)
    .then(r => r.json())
    .then(data => {
      if (data && data.activePhoto) {
        localStorage.setItem(PROFILE_PHOTO_KEY, data.activePhoto);
        applyProfilePhotoToDOM(data.activePhoto);
        if (callback) callback(data);
      }
    })
    .catch(err => console.warn('Could not fetch profile photo from server:', err));
}

async function saveNewProfilePhoto(fileOrUrl) {
  let photoUrl = fileOrUrl;

  if (fileOrUrl instanceof File || (fileOrUrl && fileOrUrl.name)) {
    const uploadedUrl = await uploadArtworkPhoto(fileOrUrl);
    if (uploadedUrl) {
      photoUrl = uploadedUrl;
    }
  }

  localStorage.setItem(PROFILE_PHOTO_KEY, photoUrl);
  applyProfilePhotoToDOM(photoUrl);

  try {
    const res = await fetch(`${API_BASE}/api/profile-photo`, {
      method: 'POST',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify({ imageUrl: photoUrl })
    });
    return await res.json();
  } catch (e) {
    console.warn('Backend profile photo sync skipped:', e);
    return { imageUrl: photoUrl, isActive: true };
  }
}

async function activateOldProfilePhoto(id) {
  try {
    const res = await fetch(`${API_BASE}/api/profile-photo/${id}/activate`, {
      method: 'PUT',
      headers: getAdminAuthHeaders()
    });
    const data = await res.json();
    if (data && data.imageUrl) {
      localStorage.setItem(PROFILE_PHOTO_KEY, data.imageUrl);
      applyProfilePhotoToDOM(data.imageUrl);
      return data;
    }
  } catch (e) {
    console.warn('Could not activate profile photo:', e);
  }
}

async function deleteOldProfilePhoto(id) {
  try {
    await fetch(`${API_BASE}/api/profile-photo/${id}`, {
      method: 'DELETE',
      headers: getAdminAuthHeaders()
    });
    fetchProfilePhotoFromServer();
  } catch (e) {
    console.warn('Could not delete profile photo:', e);
  }
}

// Auto-fetch data from server on load
if (typeof window !== 'undefined') {
  fetchArtworksFromServer();
  fetchSocialLinksFromServer();
  fetchProfilePhotoFromServer();
  document.addEventListener('DOMContentLoaded', () => {
    applyProfilePhotoToDOM(getProfilePhoto());
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getSocialLinks, saveSocialLinks, getActiveSocialLinks,
    getArtworks, saveArtworks, addArtwork, updateArtwork, deleteArtwork,
    uploadArtworkPhoto, submitInquiry, fetchInquiriesFromServer,
    updateInquiryStatus, deleteInquiry, getSocialIconSVG,
    getProfilePhoto, saveNewProfilePhoto, activateOldProfilePhoto,
    deleteOldProfilePhoto, fetchProfilePhotoFromServer, applyProfilePhotoToDOM,
    DEFAULT_SOCIAL_LINKS, SOCIAL_KEY, ARTWORK_KEY, PROFILE_PHOTO_KEY
  };
}

