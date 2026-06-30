export default {
  title: "Project Portfolio",
  description: "Selected projects organized by main project, with subprojects shown inline.",

  source: {
    type: "file",
    path: "examples/demo-data.json"
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
