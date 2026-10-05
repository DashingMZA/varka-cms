import { theme11 } from './manifest';

const t = theme11.tokens;

export const theme11Css = `
:root {
  --varka-bg: ${t.bg};
  --varka-ink: ${t.ink};
  --varka-accent: ${t.accent};
  --varka-muted: ${t.muted};
  --varka-card: ${t.card};
  --varka-border: ${t.border};
  --varka-font-sans: ${t.fontSans};
  --varka-body: #032075;
  --varka-nav: #290342;
  --varka-blue: #4d40ff;
  --varka-footer-border: #3e3063;
  --varka-btn-grad-1: #8920f3;
  --varka-btn-grad-2: #ff7c58;
  --varka-shadow: 0 15px 15px -10px rgba(0, 0, 0, 0.05);
}

body {
  margin: 0;
  background: var(--varka-bg);
  color: var(--varka-body);
  font-family: 'Overpass', 'Segoe UI', system-ui, sans-serif;
  font-size: 18px;
  line-height: 1.6;
}

/* ---- Layout container ---- */
.celebrtiy-container {
  max-width: 1400px;
  margin: 0 auto;
  padding-inline: 1.5rem;
}

/* ---- Header ---- */
.celebrtiy-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: #ffffff;
  box-shadow: var(--varka-shadow);
}
.celebrtiy-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 0;
}
.celebrtiy-logo {
  color: var(--varka-accent);
  font-weight: 800;
  font-style: italic;
  font-size: 1.6rem;
  text-decoration: none;
  letter-spacing: -0.01em;
}
.celebrtiy-nav {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.celebrtiy-nav-link {
  color: var(--varka-nav);
  font-weight: 600;
  text-decoration: none;
  font-size: 1rem;
}
.celebrtiy-nav-link:hover {
  color: var(--varka-accent);
}
.celebrtiy-search-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--varka-border);
  background: #ffffff;
  color: var(--varka-nav);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.celebrtiy-search-btn:hover {
  border-color: var(--varka-accent);
  color: var(--varka-accent);
}

/* ---- Search drawer ---- */
.celebrtiy-search-drawer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 200;
  background: #ffffff;
  padding: 1.25rem 0;
  box-shadow: var(--varka-shadow);
  transform: translateY(-110%);
  transition: transform 0.25s ease;
}
.celebrtiy-search-drawer.open {
  transform: translateY(0);
}
.celebrtiy-search-form {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.celebrtiy-search-form input {
  flex: 1;
  padding: 0.8rem 1.25rem;
  border: 1px solid var(--varka-border);
  border-radius: 100px;
  font-size: 1rem;
  font-family: inherit;
}
.celebrtiy-search-form button {
  padding: 0.8rem 2rem;
  border: 0;
  border-radius: 100px;
  background: var(--varka-accent);
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
}

/* ---- Hero band + breadcrumbs ---- */
.celebrtiy-hero-band {
  background: var(--varka-border);
  padding: 2.5rem 0;
}
.celebrtiy-breadcrumbs {
  font-size: 0.85rem;
  color: var(--varka-muted);
  margin-bottom: 0.75rem;
}
.celebrtiy-breadcrumbs a {
  color: var(--varka-muted);
  text-decoration: none;
}
.celebrtiy-breadcrumbs a:hover {
  color: var(--varka-accent);
}
.celebrtiy-breadcrumbs .sep {
  margin: 0 0.5rem;
}
.celebrtiy-hero-title {
  margin: 0;
  font-size: 40px;
  font-weight: 800;
  text-transform: capitalize;
  color: var(--varka-ink);
  line-height: 1.2;
}

/* ---- Featured grid: 1 large + 4 small ---- */
.celebrtiy-featured-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  grid-template-rows: repeat(2, 1fr);
  gap: 1.25rem;
}
.celebrtiy-featured-grid .celebrtiy-featured-main {
  grid-row: 1 / -1;
}

/* ---- Cards ---- */
.celebrtiy-card {
  background: #ffffff;
  border-radius: 6px;
  box-shadow: var(--varka-shadow);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.celebrtiy-card-media img {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  display: block;
}
.celebrtiy-card-body {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
}
.celebrtiy-card-cat {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--varka-muted);
  font-weight: 700;
}
.celebrtiy-card-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.35;
}
.celebrtiy-card-title a {
  color: var(--varka-nav);
  text-decoration: none;
}
.celebrtiy-card-title a:hover {
  color: var(--varka-accent);
}
.celebrtiy-card-meta {
  font-size: 13px;
  color: var(--varka-muted);
}
.celebrtiy-card-excerpt {
  color: var(--varka-muted);
  font-size: 1rem;
}
.celebrtiy-card-link {
  color: var(--varka-accent);
  font-weight: 600;
  text-decoration: none;
}
.celebrtiy-card-link:hover {
  text-decoration: underline;
}

/* ---- Sections ---- */
.celebrtiy-section {
  padding-block: 3rem;
}
.celebrtiy-section-title {
  font-size: 30px;
  font-weight: 800;
  color: var(--varka-nav);
  margin: 0 0 1.5rem;
}
.celebrtiy-cat-links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.celebrtiy-cat-link {
  display: inline-block;
  padding: 0.55rem 1.5rem;
  border: 1px solid var(--varka-border);
  border-radius: 100px;
  background: #ffffff;
  color: var(--varka-nav);
  font-weight: 600;
  text-decoration: none;
  font-size: 0.95rem;
}
.celebrtiy-cat-link:hover {
  background: var(--varka-accent);
  border-color: var(--varka-accent);
  color: #ffffff;
}

/* ---- Card rows ---- */
.celebrtiy-card-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
}

/* ---- Category block ---- */
.celebrtiy-cat-block {
  background: #ffffff;
  border-radius: 6px;
  box-shadow: var(--varka-shadow);
  padding: 2rem;
}
.celebrtiy-cat-block p {
  color: var(--varka-muted);
}
.celebrtiy-cat-block .celebrtiy-card-link {
  display: inline-block;
  margin-top: 1rem;
}

/* ---- Tabs + carousel ---- */
.celebrtiy-tabs {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}
.celebrtiy-tab {
  border: 1px solid var(--varka-border);
  background: #ffffff;
  border-radius: 100px;
  padding: 0.5rem 1.4rem;
  font-weight: 600;
  color: var(--varka-nav);
  cursor: pointer;
  font-size: 0.95rem;
}
.celebrtiy-tab--active {
  background: var(--varka-accent);
  border-color: var(--varka-accent);
  color: #ffffff;
}
.celebrtiy-carousel {
  display: flex;
  gap: 1.25rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 0.5rem;
}
.celebrtiy-carousel .celebrtiy-card {
  flex: 0 0 min(320px, 80vw);
  scroll-snap-align: start;
}

.celebrtiy-more-info {
  color: var(--varka-muted);
  font-size: 1rem;
  max-width: 70ch;
}

/* ---- Article layout ---- */
.celebrtiy-article-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 2rem;
  align-items: start;
}
.celebrtiy-article-card {
  background: #ffffff;
  border-radius: 6px;
  box-shadow: var(--varka-shadow);
  padding: 2.25rem;
}

/* ---- Prose ---- */
.celebrtiy-prose {
  font-size: 18px;
  line-height: 1.6;
  color: var(--varka-body);
}
.celebrtiy-prose h2 {
  background: var(--varka-accent);
  color: #ffffff;
  text-transform: uppercase;
  padding: 0.65rem 1rem;
  border-radius: 4px;
  font-size: 1.15rem;
  letter-spacing: 0.04em;
  margin: 2rem 0 1rem;
}
.celebrtiy-prose h3 {
  font-size: 24px;
  font-weight: 800;
  color: var(--varka-nav);
  margin: 1.75rem 0 0.75rem;
}
.celebrtiy-prose img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  display: block;
  margin: 1.25rem 0;
}
.celebrtiy-prose ul,
.celebrtiy-prose ol {
  margin: 1rem 0;
  padding-left: 1.5rem;
}
.celebrtiy-prose li {
  margin-bottom: 0.5rem;
}
.celebrtiy-prose a {
  color: var(--varka-accent);
}

/* ---- Sidebar ---- */
.celebrtiy-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.celebrtiy-pick {
  display: flex;
  gap: 1rem;
  align-items: center;
  background: #ffffff;
  border-radius: 6px;
  box-shadow: var(--varka-shadow);
  padding: 0.9rem;
}
.celebrtiy-pick img {
  width: 84px;
  height: 84px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
}
.celebrtiy-pick-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--varka-nav);
  line-height: 1.4;
}
.celebrtiy-pick-title a {
  color: inherit;
  text-decoration: none;
}
.celebrtiy-pick-title a:hover {
  color: var(--varka-accent);
}

.celebrtiy-similar {
  padding-block: 3rem;
}

/* ---- Footer ---- */
.celebrtiy-footer {
  background: var(--varka-ink);
  border-top: 4px solid var(--varka-footer-border);
  color: var(--varka-border);
  margin-top: 2rem;
}
.celebrtiy-footer-inner {
  padding: 3rem 0 1.5rem;
}
.celebrtiy-footer-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 2rem;
  margin-bottom: 1.5rem;
}
.celebrtiy-footer-nav a {
  color: var(--varka-border);
  text-decoration: none;
  font-weight: 600;
}
.celebrtiy-footer-nav a:hover {
  color: #ffffff;
}
.celebrtiy-social {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}
.celebrtiy-social a {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--varka-footer-border);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--varka-border);
  text-decoration: none;
}
.celebrtiy-social a:hover {
  border-color: var(--varka-accent);
  color: var(--varka-accent);
}
.celebrtiy-copyright {
  text-align: center;
  color: var(--varka-muted);
  font-size: 0.85rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--varka-footer-border);
}

/* ---- Button ---- */
.celebrtiy-btn {
  display: inline-block;
  border-radius: 100px;
  background: linear-gradient(43deg, var(--varka-btn-grad-1), var(--varka-btn-grad-2));
  color: #ffffff;
  font-weight: 600;
  padding: 0.8rem 2rem;
  text-decoration: none;
  border: 0;
  cursor: pointer;
}

/* ---- Pagination ---- */
.celebrtiy-pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
}
.celebrtiy-pagination a,
.celebrtiy-pagination span {
  min-width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1px solid var(--varka-border);
  background: #ffffff;
  color: var(--varka-nav);
  text-decoration: none;
  font-weight: 600;
}
.celebrtiy-pagination a:hover,
.celebrtiy-pagination .current {
  background: var(--varka-accent);
  border-color: var(--varka-accent);
  color: #ffffff;
}

/* ---- Author box ---- */
.celebrtiy-author-box {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
  background: var(--varka-card);
  border: 1px solid var(--varka-border);
  border-radius: 6px;
  padding: 1.5rem;
  margin-top: 2rem;
}
.celebrtiy-author-box .avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--varka-border);
  flex-shrink: 0;
}
.celebrtiy-author-box .author-name {
  font-weight: 800;
  color: var(--varka-nav);
  margin: 0 0 0.25rem;
}
.celebrtiy-author-box .author-bio {
  color: var(--varka-muted);
  font-size: 0.95rem;
  margin: 0;
}

/* ---- Responsive ---- */
@media (max-width: 1024px) {
  .celebrtiy-article-layout {
    grid-template-columns: 1fr;
  }
  .celebrtiy-card-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .celebrtiy-featured-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .celebrtiy-nav {
    overflow-x: auto;
    max-width: 100%;
    gap: 1rem;
    scrollbar-width: none;
  }
  .celebrtiy-nav::-webkit-scrollbar {
    display: none;
  }
  .celebrtiy-featured-grid {
    grid-template-columns: 1fr;
    grid-template-rows: none;
  }
  .celebrtiy-featured-grid .celebrtiy-featured-main {
    grid-row: auto;
  }
  .celebrtiy-card-row {
    grid-template-columns: 1fr;
  }
  .celebrtiy-hero-title {
    font-size: 30px;
  }
  .celebrtiy-article-card {
    padding: 1.5rem;
  }
  body {
    font-size: 16px;
  }
}
`.trim();
