const assetMirrorProvider = process.env.ASSET_MIRROR_PROVIDER?.toLowerCase();

export default {
  title: "Project Portfolio",
  description: "Selected projects generated from Notion.",

  source: {
    type: "notion",
    token: process.env.NOTION_TOKEN,
    dataSourceId: process.env.NOTION_DATA_SOURCE_ID ?? process.env.NOTION_DATABASE_ID,
    notionVersion: "2026-03-11",
    pageSize: 100,
    includePageContent: true,
    filter: {
      property: "Published",
      checkbox: { equals: true }
    },
    sorts: [
      { property: "Order", direction: "ascending" },
      { timestamp: "last_edited_time", direction: "descending" }
    ]
  },

  project: {
    fields: {
      title: "Name",
      parent: "Parent item",
      repoUrl: "Repo URL",
      deployUrl: "Deploy URL",
      timeline: "Timeline",
      tags: "Tags",
      published: "Published",
      order: "Order",
      slug: "Slug"
    }
  },

  theme: {
    accent: "#6f7772"
  },

  assets: assetMirrorProvider === "r2"
    ? {
        provider: "r2",
        accountId: process.env.R2_ACCOUNT_ID,
        bucket: process.env.R2_BUCKET,
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        publicBaseUrl: process.env.R2_PUBLIC_URL,
        prefix: process.env.R2_PREFIX ?? "notion2page",
        includeExternal: envFlag(process.env.R2_MIRROR_EXTERNAL),
        urlStyle: process.env.R2_URL_STYLE
      }
    : undefined
};

function envFlag(value) {
  return ["1", "true", "yes", "on"].includes(String(value ?? "").toLowerCase());
}
