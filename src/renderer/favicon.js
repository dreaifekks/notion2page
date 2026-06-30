export function renderFavicon(config) {
  const accent = config.theme?.accent ?? "#6f7772";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#050505"/>
  <rect x="7" y="7" width="50" height="50" rx="11" fill="#101211" stroke="#242a27" stroke-width="2"/>
  <path d="M18 41V20h16c7 0 12 4 12 10s-5 11-12 11h-8v-8h8c2 0 4-1 4-3s-2-3-4-3h-8v14h-8Z" fill="${escapeSvg(accent)}"/>
</svg>`;
}

function escapeSvg(value) {
  return String(value).replace(/[^#a-zA-Z0-9(),.% -]/g, "");
}
