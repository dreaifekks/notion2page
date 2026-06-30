# notion2page

`notion2page` is a zero-dependency Node static site generator for an English project portfolio backed by Notion.

The current shape is intentionally narrow:

```txt
Notion projects data source
  -> main projects from rows without Parent item
  -> subprojects from rows with Parent item
  -> page content, icon and cover
  -> static two-column project page
```

## Quick Start

Build the local demo without a Notion token:

```bash
npm run build:demo
npm run serve
```

Then open the URL printed by the server, or open `dist/index.html` directly.

For LAN testing:

```bash
HOST=0.0.0.0 npm run serve
```

## Notion Structure

Use one Notion data source. Enable Notion Sub-items on that data source and keep only two levels:

```txt
Main project
  - Subproject
```

Recommended properties:

| Property | Type | Notes |
|---|---|---|
| `Name` | Title | Project name |
| `Parent item` | Sub-items relation | Empty means main project; set means subproject |
| `Repo URL` | URL | GitHub or Git repo URL |
| `Deploy URL` | URL | Public deployment URL |
| `Timeline` | Date | Single date or date range |
| `Tags` | Multi-select | Shown only on main projects |
| `Published` | Checkbox | Build includes only checked rows |
| `Order` | Number | Manual sort order |
| `Slug` | Text / Formula | Optional stable section id |

Do not add `Description` or `Cover URL` fields for the normal flow:

- Description comes from the page content blocks.
- Background comes from the Notion page cover.
- Icon comes from the Notion page icon.
- A subproject without an icon inherits the main project icon.
- A missing icon becomes a generated initials icon.
- A missing cover becomes a generated background.

## Configure Notion

1. Create a Notion integration with read content access.
2. Share the target data source with that integration.
3. Set environment variables:

```bash
export NOTION_TOKEN=secret_xxx
export NOTION_DATA_SOURCE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

`NOTION_DATA_SOURCE_ID` may be either:

- The database ID from the Notion URL.
- The resolved data source ID returned by the Notion API.

When a database ID is provided, `notion2page` automatically retrieves the database and uses its data source. If the database has multiple data sources, set `source.dataSourceName` in `notion2page.config.js`.

By default, the Notion query fetches all page properties. `source.filterProperties` is intentionally opt-in because Notion expects property identifiers there, and some automatic fields such as Sub-items can fail when filtered by their visible names.

4. Build:

```bash
npm run build
```

The default config is in `notion2page.config.js`.

## Page Content Support

The first version renders common Notion blocks:

- Paragraphs
- Headings
- Bulleted and numbered list items
- Quotes
- Callouts
- Code
- Images
- Dividers

Subprojects are not full cards. They render as compact rows inside the main project, showing their icon, name, GitHub/Live links, timeline and the first content line when present.

## Static Output

The build writes:

- `dist/index.html`
- `dist/style.css`
- `dist/data.json`

`data.json` is the generated page model for debugging.

## Asset Note

Notion-hosted file URLs are temporary. For production on Cloudflare Pages, page cover/icon files should be mirrored to R2 during build or replaced with stable external URLs. The current version reads the URLs and renders the static site; R2 mirroring is the next implementation step.
