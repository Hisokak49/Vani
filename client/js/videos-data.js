/**
 * VANI KARAIKTA — VIDEO PORTFOLIO DATA
 * ============================================================
 * DEFAULT_VIDEOS are placeholder entries — no real YouTube links yet.
 * Vani can add her actual videos using the "+ Post Video" button on the site,
 * or replace the placeholder URLs below with her real YouTube links.
 *
 * HOW TO ADD A REAL VIDEO:
 *   1. Open index.html in your browser
 *   2. Click the "+ Post Video" button in the Videos section
 *   3. Paste any YouTube / Reel / Shorts URL — done!
 *
 * OR edit this file directly:
 *   Replace  url: "PASTE_YOUTUBE_URL_HERE"
 *   with     url: "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"
 * ============================================================
 */

const DEFAULT_VIDEOS = [];

const STORAGE_KEY = "vani_portfolio_videos_v1";

/**
 * Get all videos — returns custom (localStorage) videos if any exist,
 * otherwise returns DEFAULT_VIDEOS placeholders.
 */
function getStoredVideos() {
  try {
    const custom = localStorage.getItem(STORAGE_KEY);
    if (custom) {
      const parsed = JSON.parse(custom);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not read custom videos from localStorage:", e);
  }
  return DEFAULT_VIDEOS;
}

/**
 * Save videos array to LocalStorage
 */
function saveVideos(videos) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
  } catch (e) {
    console.error("Could not save videos to localStorage:", e);
  }
}

/**
 * Convert a standard video URL (YouTube, Vimeo, Shorts) into embed URL
 */
function convertToEmbedUrl(url) {
  if (!url || url === "PLACEHOLDER") return "";
  url = url.trim();

  // YouTube watch / shorts / youtu.be
  const ytWatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (ytWatch && ytWatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytWatch[1]}`;
  }

  // Vimeo
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo && vimeo[1]) {
    return `https://player.vimeo.com/video/${vimeo[1]}`;
  }

  return url;
}

/**
 * Add a new video to the portfolio (called by + Post Video modal)
 */
function addVideoToPortfolio(videoData) {
  // Get stored videos but strip placeholders so real videos take their place
  const current = getStoredVideos().filter(v => !v.isPlaceholder);
  const embedUrl = convertToEmbedUrl(videoData.url);

  // Auto-generate YouTube thumbnail if not provided
  let thumb = videoData.thumbnail;
  const ytMatch = videoData.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
  if (!thumb && ytMatch && ytMatch[1]) {
    thumb = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  } else if (!thumb) {
    thumb = "";
  }

  const newVideo = {
    id: "vid-" + Date.now(),
    title: videoData.title || "Studio Video",
    category: videoData.category || "studio",
    platform: videoData.platform || "youtube",
    url: videoData.url,
    embedUrl: embedUrl,
    thumbnail: thumb,
    description: videoData.description || "",
    date: new Date().getFullYear().toString(),
    featured: false,
    isPlaceholder: false
  };

  const updated = [newVideo, ...current];
  saveVideos(updated);
  return newVideo;
}

/**
 * Remove a video by ID
 */
function removeVideoFromPortfolio(id) {
  const current = getStoredVideos().filter(v => !v.isPlaceholder);
  const filtered = current.filter(v => v.id !== id);
  saveVideos(filtered);
  return filtered;
}

/**
 * Reset all custom videos — restores placeholder defaults
 */
function resetVideosToDefault() {
  localStorage.removeItem(STORAGE_KEY);
  return DEFAULT_VIDEOS;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DEFAULT_VIDEOS,
    getStoredVideos,
    saveVideos,
    convertToEmbedUrl,
    addVideoToPortfolio,
    removeVideoFromPortfolio,
    resetVideosToDefault
  };
}

