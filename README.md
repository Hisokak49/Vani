# Vani Karaikta — Artist Portfolio Website

A fast, responsive, image-forward portfolio website designed and built for visual artist **Vani Karaikta** ([@unfiltered_vaniii](https://www.instagram.com/unfiltered_vaniii/?hl=en)).

---

## 🎨 Overview & Live Pages

- **`index.html`** — Long-scrolling home experience:
  1. *Hero* with statement & CTAs
  2. *Spotlight Feature* (Terra Incognita Series)
  3. *Follow the Studio* (Instagram & Community)
  4. *Fan Favorites* (Interactive Lightbox Viewer)
  5. *Featured In & Video Showcase* (Plays `https://youtu.be/eHTXQW58WhA` directly inline without redirecting)
  6. *Secondary Offering* (Archival Prints & Editions)
  7. *Commissions Studio* (Turnaround stats, 4-step workflow, and inquiry trigger)
  8. *Latest Works* with responsive filtering
  9. *The Archive* (Dark aesthetic record)
  10. *Site Footer* with newsletter, navigation, and contact
- **`about.html`** — Dedicated artist bio, artist statement, studio philosophy, and portrait (`assests/ppf.png`).
- **`contact.html`** — Direct inquiry and commission builder form, studio channels, and FAQ.
- **`work.html`** — Complete catalog with real-time category filtering (Paintings, Studies, Available, Sold).

---

## 🚀 How to Run Locally

Because this project is built using pure **Semantic HTML5, CSS3 Custom Properties, and Vanilla JavaScript**, there is **no build step or dependency install needed**.

You can run it in any of the following ways:

### Option 1: Double Click
Simply open `index.html` in your favorite web browser (Chrome, Safari, Firefox, Edge).

### Option 2: Local HTTP Server (Recommended)
Using Python or Node:

```bash
# Python 3
python -m http.server 8000

# or with npx
npx serve
```
Then visit `http://localhost:8000`.

---

## 🖼️ How to Replace Artwork Placeholders

All artwork entries and metadata are managed cleanly in [`js/gallery-data.js`](file:///c:/Users/amit/OneDrive/Documents/Desktop/vaniii/js/gallery-data.js).

To replace placeholder blocks with your real photos:
1. Save your photos in the `assests/` folder (e.g. `assests/artwork1.jpg`).
2. In `gallery-data.js` or directly inside the HTML `art-placeholder` tags, replace the placeholder gradient with standard `<img src="assests/artwork1.jpg" alt="Title">`.
3. Recommended image dimensions:
   - **Hero artwork**: `1200 × 1500 px` (4:5 aspect ratio)
   - **Gallery cards**: `800 × 1000 px` (4:5 aspect ratio)
   - **Spotlight banner**: `1400 × 960 px` (16:11 aspect ratio)

---

## 📱 Responsiveness & Accessibility
- **Breakpoints**: Handcrafted for Mobile (375px), Tablet (768px), and Desktop (1440px+).
- **Keyboard Navigation**:
  - `Esc` closes the lightbox modal.
  - `←` and `→` keys cycle through artworks.
  - Interactive hamburger menu with visible keyboard focus rings.
- **Motion**: Fully honors `prefers-reduced-motion`.
