import {
  multiTextValues,
  propertyBoolean,
  propertyNumber,
  propertyText,
  relationIds
} from "./fields.js";
import { slugify } from "../renderer/utils.js";

const DEFAULT_FIELDS = {
  title: "Name",
  parent: "Parent item",
  repoUrl: "Repo URL",
  deployUrl: "Deploy URL",
  timeline: "Timeline",
  tags: "Tags",
  published: "Published",
  order: "Order",
  slug: "Slug"
};

export function buildPageModel(config, items, sourceMeta = {}) {
  const fields = {
    ...DEFAULT_FIELDS,
    ...(config.project?.fields ?? {})
  };

  const projects = items
    .filter((item) => propertyBoolean(item, fields.published, true))
    .map((item) => buildProject(item, fields))
    .filter((project) => project.name);

  const projectMap = new Map(projects.map((project) => [project.id, project]));
  const roots = [];

  for (const project of projects) {
    if (project.parentIds.length === 0) {
      roots.push(project);
      continue;
    }

    if (project.parentIds.length > 1) {
      throw new Error(`Project "${project.name}" has multiple parents. Only one parent is supported.`);
    }

    const parent = projectMap.get(project.parentIds[0]);
    if (!parent) {
      throw new Error(`Project "${project.name}" points to a missing or unpublished parent.`);
    }

    parent.children.push(project);
  }

  for (const root of roots) {
    if (!root.icon) {
      root.icon = generatedIcon(root.name);
    }

    for (const child of root.children) {
      if (child.children.length > 0) {
        throw new Error(`Project "${child.name}" has children. Only main project and subproject levels are supported.`);
      }

      if (!child.icon) {
        child.icon = root.icon ?? generatedIcon(child.name);
      }
    }
  }

  const sortedRoots = sortProjects(roots);
  for (const root of sortedRoots) {
    root.children = sortProjects(root.children);
  }

  const subprojectCount = sortedRoots.reduce((total, project) => total + project.children.length, 0);

  return {
    title: config.title ?? "Notion2Page",
    description: config.description ?? "",
    generatedAt: new Date().toISOString(),
    source: sourceMeta,
    stats: {
      projects: sortedRoots.length,
      subprojects: subprojectCount
    },
    fields,
    projects: sortedRoots
  };
}

function buildProject(item, fields) {
  const name = propertyText(item, fields.title, item.id);
  const explicitSlug = propertyText(item, fields.slug);

  return {
    id: item.id,
    slug: explicitSlug || slugify(name || item.id),
    name,
    parentIds: relationIds(item, fields.parent),
    repoUrl: propertyText(item, fields.repoUrl),
    deployUrl: propertyText(item, fields.deployUrl),
    timeline: propertyText(item, fields.timeline),
    tags: multiTextValues(item, fields.tags),
    order: propertyNumber(item, fields.order),
    sourceUrl: item.sourceUrl,
    icon: item.icon,
    background: item.cover
      ? { type: "image", url: item.cover }
      : generatedBackground(item.id || name),
    content: item.content ?? [],
    children: [],
    properties: sanitizeProperties(item.properties)
  };
}

function sortProjects(projects) {
  return [...projects].sort((left, right) => {
    const leftOrder = left.order ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.order ?? Number.MAX_SAFE_INTEGER;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
    return left.name.localeCompare(right.name, undefined, { numeric: true });
  });
}

function generatedIcon(name) {
  return {
    type: "initials",
    value: initials(name)
  };
}

function generatedBackground(seed) {
  const colors = [
    ["#111827", "#374151", "#020617"],
    ["#18181b", "#3f3f46", "#030712"],
    ["#0f172a", "#334155", "#030712"],
    ["#111827", "#4b5563", "#020617"],
    ["#161616", "#3a403d", "#030712"]
  ];
  const index = hashString(seed) % colors.length;

  return {
    type: "generated",
    colors: colors[index]
  };
}

function hashString(value) {
  let hash = 0;
  for (const char of String(value)) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

function initials(value) {
  const parts = String(value)
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0].toUpperCase()).join("") || "P";
}

function sanitizeProperties(properties = {}) {
  return Object.fromEntries(
    Object.entries(properties).map(([name, value]) => [name, sanitizeValue(value)])
  );
}

function sanitizeValue(value) {
  if (!value || typeof value !== "object") return value;

  const { raw, ...rest } = value;
  if (Array.isArray(rest.values)) {
    rest.values = rest.values.map((entry) => (
      entry && typeof entry === "object" ? { ...entry } : entry
    ));
  }

  return rest;
}
