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
    accent: "#0f766e"
  }
};
