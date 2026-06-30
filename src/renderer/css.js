export function renderCss(config) {
  const accent = config.theme?.accent ?? "#0f766e";

  return `:root {
  color-scheme: dark;
  --bg: #050505;
  --surface: #101211;
  --surface-muted: #171a19;
  --text: #f2f5f3;
  --muted: #9aa6a1;
  --line: #242a27;
  --accent: ${accent};
  --accent-soft: color-mix(in srgb, var(--accent), black 76%);
  --shadow: 0 18px 36px rgba(0, 0, 0, 0.36);
}

* {
  box-sizing: border-box;
}

html {
  min-height: 100%;
  background: var(--bg);
}

body {
  min-height: 100%;
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  letter-spacing: 0;
}

a {
  color: inherit;
  text-decoration: none;
}

.site-header {
  border-bottom: 1px solid var(--line);
  background: #080908;
}

.site-header__inner {
  width: min(1220px, calc(100vw - 32px));
  min-height: 172px;
  margin: 0 auto;
  padding: 34px 0 28px;
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 28px;
}

.site-kicker {
  margin: 0 0 10px;
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 760;
  text-transform: uppercase;
}

h1 {
  max-width: 760px;
  margin: 0;
  font-size: 4rem;
  line-height: 1.02;
  font-weight: 780;
}

.site-description {
  max-width: 720px;
  margin: 14px 0 0;
  color: var(--muted);
  font-size: 1rem;
  line-height: 1.6;
}

.site-actions {
  display: grid;
  gap: 10px;
  justify-items: end;
}

.github-link {
  min-height: 40px;
  border: 1px solid var(--line);
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 6px 10px 6px 7px;
  background: #111412;
  color: var(--text);
  font-size: 0.86rem;
  font-weight: 760;
}

.github-link:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
}

.github-link__mark {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: inline-grid;
  place-items: center;
  background: #050505;
  color: #f8faf9;
  font-size: 0.68rem;
  font-weight: 820;
}

.site-stats {
  min-width: 118px;
  min-height: 86px;
  border: 1px solid var(--line);
  border-radius: 8px;
  display: grid;
  grid-template-columns: 1fr;
  background: #111412;
}

.site-stats div {
  display: grid;
  place-items: center;
  padding: 14px 16px;
}

.site-stats div + div {
  border-left: 1px solid var(--line);
}

.site-stats span {
  display: block;
  font-size: 1.9rem;
  font-weight: 780;
}

.site-stats small {
  display: block;
  color: var(--muted);
  font-size: 0.74rem;
  font-weight: 720;
  text-transform: uppercase;
}

.page-shell {
  width: min(1220px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 28px 0 56px;
}

.project-grid {
  columns: 2 360px;
  column-gap: 20px;
}

.project {
  min-width: 0;
  width: 100%;
  display: inline-block;
  margin: 0 0 20px;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  background: var(--surface);
  box-shadow: var(--shadow);
  break-inside: avoid;
}

.project-cover {
  position: relative;
  min-height: 250px;
  aspect-ratio: 16 / 9;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 18px;
  overflow: hidden;
  background: #111412;
}

.project-cover--generated {
  background:
    repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 18px),
    linear-gradient(135deg, var(--cover-a), var(--cover-b) 54%, var(--cover-c));
}

.project-cover > img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.project-cover__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.82));
}

.project-cover__content {
  position: relative;
  z-index: 1;
  margin-top: auto;
  display: flex;
  align-items: end;
  gap: 14px;
  color: #fff;
}

.project-icon,
.subproject-icon,
.content-icon {
  flex: 0 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.5);
  display: inline-grid;
  place-items: center;
  overflow: hidden;
  background: rgba(10, 12, 11, 0.92);
  color: #f8faf9;
}

.project-icon {
  width: 54px;
  height: 54px;
  border-radius: 8px;
  font-size: 1.55rem;
  font-weight: 800;
}

.subproject-icon,
.content-icon {
  width: 32px;
  height: 32px;
  border-radius: 7px;
  font-size: 1rem;
  font-weight: 780;
}

.project-icon img,
.subproject-icon img,
.content-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.project-cover h2 {
  margin: 0;
  font-size: 1.8rem;
  line-height: 1.12;
  font-weight: 780;
  overflow-wrap: anywhere;
}

.project-timeline {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.84);
  font-size: 0.86rem;
  font-weight: 680;
}

.tag-row {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 22px 0 0 68px;
}

.tag {
  max-width: 100%;
  min-height: 24px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  color: #fff;
  background: rgba(0, 0, 0, 0.38);
  font-size: 0.75rem;
  font-weight: 720;
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.project-body {
  padding: 18px;
}

.project-links,
.subproject-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.project-links {
  margin: 0 0 16px;
}

.project-links a,
.subproject-links a {
  min-height: 32px;
  border: 1px solid var(--line);
  border-radius: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 11px;
  color: var(--text);
  background: #0b0d0c;
  font-size: 0.82rem;
  font-weight: 760;
}

.project-links a:hover,
.subproject-links a:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
}

.project-content {
  display: grid;
  gap: 10px;
  color: var(--text);
}

.project-content p,
.project-content blockquote,
.project-content aside {
  margin: 0;
  color: var(--muted);
  font-size: 0.94rem;
  line-height: 1.62;
}

.project-content h3 {
  margin: 6px 0 0;
  font-size: 1rem;
  line-height: 1.3;
  font-weight: 780;
}

.project-content blockquote {
  border-left: 3px solid var(--accent);
  padding-left: 12px;
}

.project-content aside {
  border: 1px solid var(--line);
  border-radius: 8px;
  display: flex;
  gap: 10px;
  align-items: start;
  padding: 10px 12px;
  background: var(--surface-muted);
}

.project-content pre {
  margin: 0;
  border-radius: 8px;
  overflow-x: auto;
  padding: 12px;
  background: #060706;
  color: #f4f7f6;
  font-size: 0.82rem;
  line-height: 1.5;
}

.project-content figure {
  margin: 0;
}

.project-content figure img {
  width: 100%;
  border-radius: 8px;
  display: block;
}

.project-content figcaption {
  margin-top: 6px;
  color: var(--muted);
  font-size: 0.78rem;
}

.project-content hr {
  width: 100%;
  border: 0;
  border-top: 1px solid var(--line);
}

.content-list-item::before {
  content: "- ";
  color: var(--accent);
  font-weight: 760;
}

.content-list-item--numbered::before {
  content: "# ";
}

.subprojects {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.subprojects h3 {
  margin: 0 0 10px;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 760;
  text-transform: uppercase;
}

.subprojects ul {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.subproject {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid color-mix(in srgb, var(--line), white 8%);
}

.subproject:first-child {
  border-top: 0;
}

.subproject-main {
  min-width: 0;
  display: flex;
  gap: 10px;
  align-items: start;
}

.subproject-copy {
  min-width: 0;
}

.subproject-title-row {
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}

.subproject h4 {
  margin: 0;
  font-size: 0.98rem;
  line-height: 1.3;
  font-weight: 760;
  overflow-wrap: anywhere;
}

.subproject-title-row span {
  color: var(--muted);
  font-size: 0.76rem;
  font-weight: 680;
}

.subproject p {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 0.86rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.subproject-links {
  justify-content: end;
}

@media (max-width: 860px) {
  .site-header__inner {
    min-height: 0;
    display: grid;
    align-items: start;
    padding: 28px 0 24px;
  }

  h1 {
    font-size: 2.45rem;
  }

  .site-stats {
    width: 100%;
  }

  .site-actions {
    justify-items: stretch;
  }

  .github-link {
    justify-content: center;
  }

  .project-grid {
    columns: 1;
  }
}

@media (max-width: 560px) {
  .page-shell,
  .site-header__inner {
    width: min(100vw - 24px, 1220px);
  }

  h1 {
    font-size: 2.05rem;
  }

  .project-cover {
    min-height: 218px;
    padding: 14px;
  }

  .tag-row {
    margin-left: 0;
  }

  .project-cover h2 {
    font-size: 1.45rem;
  }

  .project-body {
    padding: 14px;
  }

  .subproject {
    grid-template-columns: 1fr;
  }

  .subproject-links {
    justify-content: start;
    padding-left: 42px;
  }
}
`;
}
