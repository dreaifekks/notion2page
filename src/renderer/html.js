import { escapeHtml, escapeAttribute } from "./utils.js";

export function renderHtml(model, config) {
  const styleVersion = encodeURIComponent(model.generatedAt);

  return `<!doctype html>
<html lang="${escapeAttribute(config.lang ?? "en")}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="dark">
  <title>${escapeHtml(model.title)}</title>
  <meta name="description" content="${escapeAttribute(model.description)}">
  <link rel="stylesheet" href="./style.css?v=${styleVersion}">
</head>
<body>
  <header class="site-header">
    <div class="site-header__inner">
      <div>
        <p class="site-kicker">${escapeHtml(formatGeneratedAt(model.generatedAt))}</p>
        <h1>${escapeHtml(model.title)}</h1>
        ${model.description ? `<p class="site-description">${escapeHtml(model.description)}</p>` : ""}
      </div>
      <div class="site-stats" aria-label="Page stats">
        <div>
          <span>${model.stats.projects}</span>
          <small>projects</small>
        </div>
      </div>
    </div>
  </header>
  <main class="page-shell">
    <section class="project-grid" aria-label="Projects">
      ${model.projects.map(renderProject).join("")}
    </section>
  </main>
</body>
</html>`;
}

function renderProject(project) {
  return `<article class="project" id="${escapeAttribute(project.slug)}">
    ${renderProjectCover(project)}
    <div class="project-body">
      ${renderLinkRow(project)}
      ${project.content.length > 0 ? `<div class="project-content">${project.content.map(renderContentBlock).join("")}</div>` : ""}
      ${project.children.length > 0 ? renderSubprojects(project.children) : ""}
    </div>
  </article>`;
}

function renderProjectCover(project) {
  const background = project.background?.type === "image"
    ? `<img src="${escapeAttribute(project.background.url)}" alt="">`
    : "";
  const generatedClass = project.background?.type === "generated" ? " project-cover--generated" : "";
  const style = project.background?.type === "generated" ? generatedBackgroundStyle(project.background.colors) : "";

  return `<div class="project-cover${generatedClass}"${style}>
    ${background}
    <div class="project-cover__shade"></div>
    <div class="project-cover__content">
      ${renderIcon(project.icon, "project-icon")}
      <div>
        <h2>${escapeHtml(project.name)}</h2>
        ${project.timeline ? `<p class="project-timeline">${escapeHtml(project.timeline)}</p>` : ""}
      </div>
    </div>
    ${project.tags.length > 0 ? `<div class="tag-row">${project.tags.map(renderTag).join("")}</div>` : ""}
  </div>`;
}

function renderSubprojects(children) {
  return `<section class="subprojects" aria-label="Subprojects">
    <h3>Subprojects</h3>
    <ul>
      ${children.map(renderSubproject).join("")}
    </ul>
  </section>`;
}

function renderSubproject(project) {
  const contentLine = summarizeContent(project.content);

  return `<li class="subproject">
    <div class="subproject-main">
      ${renderIcon(project.icon, "subproject-icon")}
      <div class="subproject-copy">
        <div class="subproject-title-row">
          <h4>${escapeHtml(project.name)}</h4>
          ${project.timeline ? `<span>${escapeHtml(project.timeline)}</span>` : ""}
        </div>
        ${contentLine ? `<p>${escapeHtml(contentLine)}</p>` : ""}
      </div>
    </div>
    ${renderLinkRow(project, "subproject-links")}
  </li>`;
}

function renderLinkRow(project, className = "project-links") {
  const links = [
    project.repoUrl ? { label: "GitHub", url: project.repoUrl } : undefined,
    project.deployUrl ? { label: "Live", url: project.deployUrl } : undefined
  ].filter(Boolean);

  if (links.length === 0) return "";

  return `<nav class="${escapeAttribute(className)}" aria-label="${escapeAttribute(project.name)} links">
    ${links.map((link) => `<a href="${escapeAttribute(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`).join("")}
  </nav>`;
}

function renderIcon(icon, className) {
  if (icon?.type === "image" && icon.url) {
    return `<span class="${escapeAttribute(className)} ${escapeAttribute(className)}--image"><img src="${escapeAttribute(icon.url)}" alt=""></span>`;
  }

  if (icon?.type === "emoji" && icon.value) {
    return `<span class="${escapeAttribute(className)} ${escapeAttribute(className)}--emoji" aria-hidden="true">${escapeHtml(icon.value)}</span>`;
  }

  return `<span class="${escapeAttribute(className)} ${escapeAttribute(className)}--initials" aria-hidden="true">${escapeHtml(icon?.value ?? "P")}</span>`;
}

function renderContentBlock(block) {
  if (!block) return "";

  switch (block.type) {
    case "heading_1":
    case "heading_2":
    case "heading_3":
      return `<h3>${escapeHtml(block.text)}</h3>`;
    case "bulleted_list_item":
      return `<p class="content-list-item">${escapeHtml(block.text)}</p>`;
    case "numbered_list_item":
      return `<p class="content-list-item content-list-item--numbered">${escapeHtml(block.text)}</p>`;
    case "quote":
      return `<blockquote>${escapeHtml(block.text)}</blockquote>`;
    case "callout":
      return `<aside>${block.icon ? renderIcon(block.icon, "content-icon") : ""}<span>${escapeHtml(block.text)}</span></aside>`;
    case "code":
      return `<pre><code>${escapeHtml(block.text)}</code></pre>`;
    case "image":
      if (!block.url) return "";
      return `<figure><img src="${escapeAttribute(block.url)}" alt="">${block.caption ? `<figcaption>${escapeHtml(block.caption)}</figcaption>` : ""}</figure>`;
    case "divider":
      return "<hr>";
    default:
      return block.text ? `<p>${escapeHtml(block.text)}</p>` : "";
  }
}

function renderTag(tag) {
  return `<span class="tag">${escapeHtml(tag)}</span>`;
}

function summarizeContent(content) {
  const text = content
    .map((block) => block?.text)
    .find(Boolean);

  if (!text) return "";
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
}

function generatedBackgroundStyle(colors = []) {
  const [first = "#111827", second = "#0f766e", third = "#020617"] = colors;
  return ` style="--cover-a: ${escapeAttribute(first)}; --cover-b: ${escapeAttribute(second)}; --cover-c: ${escapeAttribute(third)}"`;
}

function formatGeneratedAt(value) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
