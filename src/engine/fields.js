export function collectReferencedProperties(config) {
  const properties = new Set();
  const add = (value) => {
    if (!value) return;
    if (typeof value === "string") {
      properties.add(value);
      return;
    }
    if (typeof value === "object" && value.property) {
      properties.add(value.property);
    }
  };

  add(config.card?.title);
  add(config.card?.description);
  add(config.card?.image);
  add(config.card?.link);

  for (const badge of config.card?.badges ?? []) add(badge);
  for (const meta of config.card?.meta ?? []) add(meta);
  for (const group of config.groupBy ?? []) add(group);

  const projectFields = config.project?.fields ?? {};
  for (const value of Object.values(projectFields)) add(value);

  return properties;
}

export function getProperty(item, descriptor) {
  if (!descriptor) return undefined;

  if (typeof descriptor === "string") {
    if (descriptor === "$notionUrl" || descriptor === "$sourceUrl") {
      return textLikeValue(item.sourceUrl);
    }
    if (descriptor === "$cover") {
      return textLikeValue(item.cover);
    }
    if (descriptor === "$createdTime") {
      return textLikeValue(item.createdTime);
    }
    if (descriptor === "$lastEditedTime") {
      return textLikeValue(item.lastEditedTime);
    }
    return item.properties[descriptor];
  }

  if (typeof descriptor === "object") {
    return getProperty(item, descriptor.property);
  }

  return undefined;
}

export function propertyText(item, descriptor, fallback = "") {
  const value = getProperty(item, descriptor);
  const text = displayText(value);
  return text || fallback;
}

export function displayText(value) {
  if (!value) return "";
  if (value.type === "relation") {
    return value.values?.join(", ") ?? value.text ?? "";
  }
  if (value.type === "multi_select") {
    return value.values?.map((entry) => entry.text).filter(Boolean).join(", ") ?? value.text ?? "";
  }
  if (Array.isArray(value.values)) {
    return value.values.map((entry) => typeof entry === "string" ? entry : entry.text).filter(Boolean).join(", ");
  }
  return value.text ?? "";
}

export function propertyLabel(descriptor) {
  if (!descriptor) return "";
  if (typeof descriptor === "string") return descriptor.replace(/^\$/, "");
  return descriptor.label ?? descriptor.property ?? "";
}

export function fieldPropertyName(descriptor) {
  if (!descriptor) return undefined;
  if (typeof descriptor === "string") return descriptor;
  return descriptor.property;
}

export function relationIds(item, descriptor) {
  const value = getProperty(item, descriptor);
  if (!value) return [];
  if (value.type === "relation") return value.values ?? [];
  if (Array.isArray(value.values)) {
    return value.values
      .map((entry) => typeof entry === "string" ? entry : entry.id ?? entry.value ?? entry.text)
      .filter(Boolean);
  }
  return value.text ? [value.text] : [];
}

export function multiTextValues(item, descriptor) {
  const value = getProperty(item, descriptor);
  if (!value) return [];
  if (value.type === "multi_select") {
    return value.values?.map((entry) => entry.text).filter(Boolean) ?? [];
  }
  if (Array.isArray(value.values)) {
    return value.values
      .map((entry) => typeof entry === "string" ? entry : entry.text ?? entry.value)
      .filter(Boolean);
  }
  return value.text ? [value.text] : [];
}

export function propertyNumber(item, descriptor) {
  const value = getProperty(item, descriptor);
  if (!value) return undefined;
  if (typeof value.value === "number") return value.value;
  const parsed = Number(value.text);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function propertyBoolean(item, descriptor, fallback = false) {
  const value = getProperty(item, descriptor);
  if (!value) return fallback;
  if (typeof value.value === "boolean") return value.value;
  if (value.text === "Yes" || value.text === "true") return true;
  if (value.text === "No" || value.text === "false") return false;
  return fallback;
}

function textLikeValue(value) {
  if (!value) return undefined;
  return {
    type: "text",
    text: String(value),
    value: String(value)
  };
}
