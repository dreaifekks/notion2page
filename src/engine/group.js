import { displayText, getProperty } from "./fields.js";

export function buildGroups(cards, groupConfig, depth = 0) {
  const current = groupConfig[depth];
  if (!current) return [];

  const buckets = new Map();

  for (const card of cards) {
    const keys = groupKeys(card, current);
    for (const key of keys) {
      if (!buckets.has(key)) {
        buckets.set(key, []);
      }
      buckets.get(key).push(card);
    }
  }

  return sortGroupEntries([...buckets.entries()], current).map(([key, bucketCards]) => {
    const childGroups = buildGroups(bucketCards, groupConfig, depth + 1);

    return {
      key,
      label: key,
      property: current.property,
      propertyLabel: current.label ?? current.property,
      style: current.style ?? "section",
      depth,
      count: bucketCards.length,
      cards: childGroups.length > 0 ? [] : bucketCards,
      groups: childGroups
    };
  });
}

function groupKeys(card, config) {
  const value = getProperty(cardAsItem(card), config.property);

  if (!value || value.type === "empty" || !displayText(value)) {
    if (config.empty === "hide") return [];
    return [config.emptyLabel ?? "Uncategorized"];
  }

  if (value.type === "multi_select") {
    const values = value.values?.map((entry) => entry.text).filter(Boolean) ?? [];
    if (values.length === 0) return [config.emptyLabel ?? "Uncategorized"];
    if (config.multiValue === "join") return [values.join(", ")];
    return values;
  }

  if (value.type === "date" && config.bucket) {
    return [bucketDate(value.value, config.bucket, config.emptyLabel)];
  }

  if (value.type === "checkbox") {
    return [value.value ? config.trueLabel ?? "Yes" : config.falseLabel ?? "No"];
  }

  return [displayText(value)];
}

function sortGroupEntries(entries, config) {
  if (Array.isArray(config.order)) {
    const order = new Map(config.order.map((label, index) => [label, index]));
    return entries.sort((a, b) => {
      const left = order.has(a[0]) ? order.get(a[0]) : Number.MAX_SAFE_INTEGER;
      const right = order.has(b[0]) ? order.get(b[0]) : Number.MAX_SAFE_INTEGER;
      if (left !== right) return left - right;
      return a[0].localeCompare(b[0], undefined, { numeric: true });
    });
  }

  if (config.sort === "desc" || config.sort === "descending") {
    return entries.sort((a, b) => b[0].localeCompare(a[0], undefined, { numeric: true }));
  }

  return entries.sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
}

function bucketDate(value, bucket, emptyLabel = "Uncategorized") {
  if (!value) return emptyLabel;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  if (bucket === "year") return String(year);
  if (bucket === "month") return `${year}-${month}`;
  if (bucket === "day") return `${year}-${month}-${day}`;
  return String(value);
}

function cardAsItem(card) {
  return {
    id: card.id,
    sourceUrl: card.sourceUrl,
    cover: card.image,
    properties: card.properties
  };
}
