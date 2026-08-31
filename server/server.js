const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// SECURITY HEADERS & RATE LIMITING
// ==========================================

// HTTP Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Simple In-Memory Rate Limiter for Login & Inquiries
const rateLimitMap = new Map();

function rateLimiter(keyPrefix, maxAttempts, windowMs) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    const record = rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count++;
    rateLimitMap.set(key, record);

    if (record.count > maxAttempts) {
      const waitMinutes = Math.ceil((record.resetTime - now) / 60000);
      return res.status(429).json({
        error: `Too many requests. Please wait ${waitMinutes} minute(s) before trying again.`
      });
    }

    next();
  };
}

// Admin Token Session Store
const activeTokens = new Map();

function createAdminSession() {
  const token = crypto.randomBytes(32).toString('hex');
  activeTokens.set(token, {
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  });
  return token;
}

function isValidAdminToken(token) {
  if (!token) return false;
  
  // 1. Check active session tokens
  if (activeTokens.has(token)) {
    const session = activeTokens.get(token);
    if (Date.now() < session.expiresAt) {
      return true;
    } else {
      activeTokens.delete(token);
    }
  }

  // 2. Direct password token fallback
  const currentPassword = db.getPassword();
  if (token === currentPassword) {
    return true;
  }

  return false;
}

// Authentication Middleware for Protected Admin Endpoints
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
  const token = req.headers['x-admin-token'] || bearerToken || req.query.token;

  if (isValidAdminToken(token)) {
    return next();
  }

  return res.status(401).json({
    error: 'Access Denied: Administrative authentication token required.'
  });
}

// Ensure uploads folder exists (supports Vercel Serverless /tmp)
const uploadDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (e) {}
}

// Safe allowed extensions
const ALLOWED_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];
const ALLOWED_VIDEO_EXTS = ['.mp4', '.webm', '.mov', '.ogg'];

// Multer storage with sanitized filenames
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const isVideo = file.mimetype.startsWith('video/');
    const allowed = isVideo ? ALLOWED_VIDEO_EXTS : ALLOWED_IMAGE_EXTS;

    if (!allowed.includes(ext)) {
      return cb(new Error('Disallowed file extension.'));
    }

    const prefix = isVideo ? 'vid-' : 'media-';
    const safeName = prefix + Date.now() + '-' + crypto.randomBytes(6).toString('hex') + ext;
    cb(null, safeName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 250 * 1024 * 1024 }, // 250MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.mimetype.startsWith('image/') && ALLOWED_IMAGE_EXTS.includes(ext)) {
      cb(null, true);
    } else if (file.mimetype.startsWith('video/') && ALLOWED_VIDEO_EXTS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type! Only verified images and videos are allowed.'), false);
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
const clientDir = path.join(__dirname, '../client');
app.use('/uploads', express.static(uploadDir));
app.use(express.static(clientDir));

// ==========================================
// API ROUTES
// ==========================================

// ---- Admin Auth Routes ----
app.post('/api/admin/login', rateLimiter('login', 5, 5 * 60 * 1000), (req, res) => {
  const { password } = req.body || {};
  const currentPassword = db.getPassword();

  if (!password || password !== currentPassword) {
    return res.status(401).json({ error: 'Invalid admin password.' });
  }

  const token = createAdminSession();
  res.json({ success: true, token, message: 'Authentication successful.' });
});

app.get('/api/admin/verify', (req, res) => {
  const authHeader = req.headers['authorization'] || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : '';
  const token = req.headers['x-admin-token'] || bearerToken;

  if (isValidAdminToken(token)) {
    return res.json({ authenticated: true });
  }
  return res.status(401).json({ authenticated: false });
});

// ---- Media Upload Endpoints ----
app.post('/api/upload', requireAdminAuth, upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, imageUrl: fileUrl, filename: req.file.filename });
});

app.post('/api/upload-video', requireAdminAuth, upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file uploaded.' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, videoUrl: fileUrl, filename: req.file.filename });
});

// ---- Artworks ----
app.get('/api/artworks', (req, res) => {
  try {
    const artworks = db.getArtworks();
    res.json(artworks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/artworks', requireAdminAuth, (req, res) => {
  try {
    const newArt = db.addArtwork(req.body);
    res.status(201).json(newArt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/artworks/:id', requireAdminAuth, (req, res) => {
  try {
    const updated = db.updateArtwork(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Artwork not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/artworks/:id', requireAdminAuth, (req, res) => {
  try {
    db.deleteArtwork(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Social Links ----
app.get('/api/social-links', (req, res) => {
  try {
    res.json(db.getSocialLinks());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/social-links', requireAdminAuth, (req, res) => {
  try {
    const updated = db.saveSocialLinks(req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Videos ----
app.get('/api/videos', (req, res) => {
  try {
    res.json(db.getVideos());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/videos', requireAdminAuth, (req, res) => {
  try {
    const vid = db.addVideo(req.body);
    res.status(201).json(vid);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/videos/:id', requireAdminAuth, (req, res) => {
  try {
    db.deleteVideo(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Anti-Spam Link Detector
function containsLinkOrUrl(text) {
  if (!text || typeof text !== 'string') return false;
  const urlPattern = /(https?:\/\/|www\.|ftp:\/\/|[a-z0-9_-]+\.(com|net|org|io|xyz|ru|co|info|biz|site|online|me|tv|cc|top|click|link|app|dev|page)\b)/i;
  return urlPattern.test(text);
}

// ---- Inquiries & Messages ----
app.get('/api/inquiries', requireAdminAuth, (req, res) => {
  try {
    res.json(db.getInquiries());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/inquiries', rateLimiter('inquiry', 10, 60 * 1000), (req, res) => {
  try {
    const { senderName, senderEmail, message } = req.body || {};
    if (!senderName || !senderEmail) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }
    if (containsLinkOrUrl(message) || containsLinkOrUrl(senderName)) {
      return res.status(400).json({
        error: 'For security and spam prevention, website links and URLs are not permitted in inquiry messages. Please provide text only.'
      });
    }
    const inq = db.addInquiry(req.body);
    res.status(201).json({ success: true, inquiry: inq });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/inquiries/:id/status', requireAdminAuth, (req, res) => {
  try {
    const updated = db.updateInquiryStatus(req.params.id, req.body.status || 'read');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/inquiries/:id', requireAdminAuth, (req, res) => {
  try {
    db.deleteInquiry(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Authentication ----
app.post('/api/auth/login', rateLimiter('login', 5, 5 * 60 * 1000), (req, res) => {
  try {
    const { password } = req.body || {};
    const currentPw = db.getPassword();
    if (password === currentPw) {
      const token = createAdminSession();
      res.json({ success: true, token, message: 'Logged in successfully' });
    } else {
      res.status(401).json({ success: false, error: 'Incorrect password' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/change-password', requireAdminAuth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    const currentPw = db.getPassword();
    if (currentPassword !== currentPw) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect' });
    }
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ success: false, error: 'New password must be at least 4 characters' });
    }
    db.setPassword(newPassword);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Profile Photo Management ----
app.get('/api/profile-photo', (req, res) => {
  try {
    const active = db.getActiveProfilePhoto();
    const history = db.getAllProfilePhotos();
    res.json({ activePhoto: active.imageUrl, history, active });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profile-photo', requireAdminAuth, (req, res) => {
  try {
    const { imageUrl } = req.body || {};
    if (!imageUrl) return res.status(400).json({ error: 'Image URL or file required' });
    const result = db.addProfilePhoto(imageUrl);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile-photo/:id/activate', requireAdminAuth, (req, res) => {
  try {
    const result = db.setActiveProfilePhoto(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/profile-photo/:id', requireAdminAuth, (req, res) => {
  try {
    db.deleteProfilePhoto(req.params.id);
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback to index.html for unknown web routes
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(clientDir, 'index.html'));
});

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🎨 Vani Karaikta Portfolio Server running!`);
    console.log(`🌐 Website:   http://localhost:${PORT}/index.html`);
    console.log(`⚙️  Admin:     http://localhost:${PORT}/admin.html`);
    console.log(`====================================================`);
  });
}

module.exports = app;
