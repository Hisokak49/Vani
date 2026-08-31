const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

// Database path configuration (supports Vercel Serverless /tmp)
const isVercel = Boolean(process.env.VERCEL);
let dataDir = path.join(__dirname, 'data');
let dbPath = path.join(dataDir, 'portfolio.db');

if (isVercel) {
  const tmpDbPath = '/tmp/portfolio.db';
  if (!fs.existsSync(tmpDbPath)) {
    if (fs.existsSync(dbPath)) {
      try {
        fs.copyFileSync(dbPath, tmpDbPath);
      } catch (e) {}
    }
  }
  dbPath = tmpDbPath;
} else {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

const db = new DatabaseSync(dbPath);

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS artworks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    price TEXT,
    imageUrl TEXT,
    description TEXT,
    medium TEXT,
    dimensions TEXT,
    year TEXT,
    forSale INTEGER DEFAULT 1,
    postedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS social_links (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL,
    handle TEXT,
    url TEXT NOT NULL,
    color TEXT,
    iconType TEXT,
    active INTEGER DEFAULT 1,
    isDefault INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'studio',
    platform TEXT DEFAULT 'youtube',
    url TEXT NOT NULL,
    embedUrl TEXT,
    thumbnail TEXT,
    description TEXT,
    date TEXT,
    featured INTEGER DEFAULT 0,
    isPlaceholder INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS inquiries (
    id TEXT PRIMARY KEY,
    type TEXT DEFAULT 'artwork_inquiry',
    artworkId TEXT,
    artworkTitle TEXT,
    artworkPrice TEXT,
    artworkImageUrl TEXT,
    artworkMedium TEXT,
    senderName TEXT NOT NULL,
    senderEmail TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'new',
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS profile_photos (
    id TEXT PRIMARY KEY,
    imageUrl TEXT NOT NULL,
    uploadedAt TEXT,
    isActive INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed default social links if empty
const countSocial = db.prepare('SELECT COUNT(*) AS count FROM social_links').get();
if (countSocial.count === 0) {
  const insertSocial = db.prepare(`
    INSERT INTO social_links (id, platform, handle, url, color, iconType, active, isDefault)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSocial.run('instagram', 'Instagram', '@unfiltered_vaniii', 'https://www.instagram.com/unfiltered_vaniii/?hl=en', '#E1306C', 'instagram', 1, 1);
  insertSocial.run('youtube', 'YouTube', '', '', '#FF0000', 'youtube', 0, 1);
  insertSocial.run('threads', 'Threads', '', '', '#000000', 'threads', 0, 1);
  insertSocial.run('pinterest', 'Pinterest', '', '', '#E60023', 'pinterest', 0, 1);
}

// Seed default password if empty
const pwRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_password');
if (!pwRow) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('admin_password', 'vani2026');
}

module.exports = {
  db,

  // Artworks
  getArtworks() {
    const rows = db.prepare('SELECT * FROM artworks ORDER BY rowid DESC').all();
    return rows.map(r => ({ ...r, forSale: Boolean(r.forSale) }));
  },
  getArtworkById(id) {
    const row = db.prepare('SELECT * FROM artworks WHERE id = ?').get(id);
    if (!row) return null;
    return { ...row, forSale: Boolean(row.forSale) };
  },
  addArtwork(art) {
    const stmt = db.prepare(`
      INSERT INTO artworks (id, title, price, imageUrl, description, medium, dimensions, year, forSale, postedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      art.id || 'art-' + Date.now(),
      art.title || 'Untitled',
      art.price || '',
      art.imageUrl || '',
      art.description || '',
      art.medium || '',
      art.dimensions || '',
      art.year || new Date().getFullYear().toString(),
      art.forSale ? 1 : 0,
      art.postedAt || new Date().toISOString()
    );
    return this.getArtworkById(art.id || 'art-' + Date.now());
  },
  updateArtwork(id, updates) {
    const current = this.getArtworkById(id);
    if (!current) return null;
    const merged = { ...current, ...updates };
    const stmt = db.prepare(`
      UPDATE artworks
      SET title = ?, price = ?, imageUrl = ?, description = ?, medium = ?, dimensions = ?, year = ?, forSale = ?
      WHERE id = ?
    `);
    stmt.run(
      merged.title,
      merged.price,
      merged.imageUrl,
      merged.description,
      merged.medium,
      merged.dimensions,
      merged.year,
      merged.forSale ? 1 : 0,
      id
    );
    return this.getArtworkById(id);
  },
  deleteArtwork(id) {
    db.prepare('DELETE FROM artworks WHERE id = ?').run(id);
    return true;
  },

  // Social Links
  getSocialLinks() {
    const rows = db.prepare('SELECT * FROM social_links').all();
    return rows.map(r => ({ ...r, active: Boolean(r.active), isDefault: Boolean(r.isDefault) }));
  },
  saveSocialLinks(links) {
    db.exec('DELETE FROM social_links');
    const stmt = db.prepare(`
      INSERT INTO social_links (id, platform, handle, url, color, iconType, active, isDefault)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const l of links) {
      stmt.run(
        l.id || 'social-' + Date.now(),
        l.platform || '',
        l.handle || '',
        l.url || '',
        l.color || '#888888',
        l.iconType || 'other',
        l.active ? 1 : 0,
        l.isDefault ? 1 : 0
      );
    }
    return this.getSocialLinks();
  },

  // Videos
  getVideos() {
    const rows = db.prepare('SELECT * FROM videos ORDER BY rowid DESC').all();
    return rows.map(r => ({ ...r, featured: Boolean(r.featured), isPlaceholder: Boolean(r.isPlaceholder) }));
  },
  addVideo(vid) {
    const stmt = db.prepare(`
      INSERT INTO videos (id, title, category, platform, url, embedUrl, thumbnail, description, date, featured, isPlaceholder)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const id = vid.id || 'vid-' + Date.now();
    stmt.run(
      id,
      vid.title || 'Studio Video',
      vid.category || 'studio',
      vid.platform || 'youtube',
      vid.url || '',
      vid.embedUrl || '',
      vid.thumbnail || '',
      vid.description || '',
      vid.date || new Date().getFullYear().toString(),
      vid.featured ? 1 : 0,
      vid.isPlaceholder ? 1 : 0
    );
    return db.prepare('SELECT * FROM videos WHERE id = ?').get(id);
  },
  deleteVideo(id) {
    db.prepare('DELETE FROM videos WHERE id = ?').run(id);
    return true;
  },

  // Inquiries
  getInquiries() {
    return db.prepare('SELECT * FROM inquiries ORDER BY rowid DESC').all();
  },
  addInquiry(inq) {
    const stmt = db.prepare(`
      INSERT INTO inquiries (id, type, artworkId, artworkTitle, artworkPrice, artworkImageUrl, artworkMedium, senderName, senderEmail, message, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const id = 'inq-' + Date.now();
    stmt.run(
      id,
      inq.type || 'artwork_inquiry',
      inq.artworkId || null,
      inq.artworkTitle || null,
      inq.artworkPrice || null,
      inq.artworkImageUrl || null,
      inq.artworkMedium || null,
      inq.senderName || 'Anonymous',
      inq.senderEmail || '',
      inq.message || '',
      'new',
      new Date().toISOString()
    );
    return db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id);
  },
  updateInquiryStatus(id, status) {
    db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(status, id);
    return db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id);
  },
  deleteInquiry(id) {
    db.prepare('DELETE FROM inquiries WHERE id = ?').run(id);
    return true;
  },

  // Settings / Auth
  getPassword() {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('admin_password');
    return row ? row.value : 'vani2026';
  },
  setPassword(newPw) {
    db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(newPw, 'admin_password');
    return true;
  },

  // Profile Photos
  getActiveProfilePhoto() {
    const row = db.prepare('SELECT * FROM profile_photos WHERE isActive = 1 ORDER BY rowid DESC LIMIT 1').get();
    if (row) return row;
    return { id: 'default', imageUrl: 'assests/ppf.png', isActive: 1, uploadedAt: null };
  },
  getAllProfilePhotos() {
    const rows = db.prepare('SELECT * FROM profile_photos ORDER BY rowid DESC').all();
    return rows.map(r => ({ ...r, isActive: Boolean(r.isActive) }));
  },
  addProfilePhoto(imageUrl) {
    // Set all other photos to inactive
    db.exec('UPDATE profile_photos SET isActive = 0');
    const id = 'ppf-' + Date.now();
    const uploadedAt = new Date().toISOString();
    db.prepare('INSERT INTO profile_photos (id, imageUrl, uploadedAt, isActive) VALUES (?, ?, ?, 1)')
      .run(id, imageUrl, uploadedAt);
    return { id, imageUrl, uploadedAt, isActive: true };
  },
  setActiveProfilePhoto(id) {
    db.exec('UPDATE profile_photos SET isActive = 0');
    db.prepare('UPDATE profile_photos SET isActive = 1 WHERE id = ?').run(id);
    return this.getActiveProfilePhoto();
  },
  deleteProfilePhoto(id) {
    const target = db.prepare('SELECT * FROM profile_photos WHERE id = ?').get(id);
    if (!target) return false;
    db.prepare('DELETE FROM profile_photos WHERE id = ?').run(id);
    // If it was active, set latest remaining photo as active
    if (target.isActive) {
      const latest = db.prepare('SELECT id FROM profile_photos ORDER BY rowid DESC LIMIT 1').get();
      if (latest) {
        db.prepare('UPDATE profile_photos SET isActive = 1 WHERE id = ?').run(latest.id);
      }
    }
    return true;
  }
};
