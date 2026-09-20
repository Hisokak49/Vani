# Vani Karaikta — Artist Portfolio Website

A fast, responsive, image-forward portfolio website designed and built for visual artist **Vani Karaikta** ([@unfiltered_vaniii](https://www.instagram.com/unfiltered_vaniii/?hl=en)).

---

## 🎨 Overview & Live Pages

The browser-facing pages live under `client/`:

- **`client/index.html`** — Long-scrolling home experience:
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
- **`client/about.html`** — Dedicated artist bio, artist statement, studio philosophy, and portrait (`client/assests/ppf.png`).
- **`client/contact.html`** — Direct inquiry and commission builder form, studio channels, and FAQ.
- **`client/work.html`** — Complete catalog with real-time category filtering (Paintings, Studies, Available, Sold).
- **`client/admin.html`** — Protected administration interface for portfolio/inquiry management.
- **`server/` / `api/`** — Backend and deployment-facing API code.

---

## 🚀 How to Run Locally

Because the browser client is built using **Semantic HTML5, CSS3 Custom Properties, and Vanilla JavaScript**, there is no frontend build step or dependency install needed for the static pages.

You can serve the repository locally with Python or Node:

```bash
# Python 3
python -m http.server 8000

# or with npx
npx serve client
```

If you are working on the full-stack application, install the Node dependencies from the repository root and use the project scripts defined in `package.json`.

Then visit `http://localhost:8000` (or the URL printed by `npx serve`).

---

## 🧪 Backend API Tests

The repository includes a Node-based API smoke-test suite at `server/test-suite.js` and exposes it through `npm test`.

The authenticated tests intentionally **do not contain a real admin password/token**. Set the token for your local environment before running the suite:

```bash
VANI_ADMIN_TOKEN="your-local-admin-token" npm test
```

On Windows PowerShell:

```powershell
$env:VANI_ADMIN_TOKEN="your-local-admin-token"; npm test
```

The inquiry test uses a unique email for each run and deletes the test inquiry after verification, so repeated test runs do not intentionally accumulate test records.

---

## 🖼️ How to Replace Artwork Placeholders

Artwork entries and metadata are managed in the client-side JavaScript under [`client/js/`](client/js/).

To replace placeholder blocks with real photos:
1. Save your photos in `client/assests/` (for example, `client/assests/artwork1.jpg`).
2. Update the relevant gallery data/template in `client/js/`, or replace an `art-placeholder` with a standard `<img src="assests/artwork1.jpg" alt="Title">` element where appropriate.
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
