export function normalizeNotionPage(page) {
  const properties = {};

  for (const [name, value] of Object.entries(page.properties ?? {})) {
    properties[name] = normalizeNotionProperty(value);
  }

  return {
    id: page.id,
    sourceUrl: page.url,
    cover: normalizeCover(page.cover),
    icon: normalizeIcon(page.icon),
    content: [],
    createdTime: page.created_time,
    lastEditedTime: page.last_edited_time,
    properties,
    raw: page
  };
}

export function normalizePlainRecord(row, index) {
  const properties = {};

  for (const [name, value] of Object.entries(row ?? {})) {
    properties[name] = normalizePlainValue(value);
  }

  return {
    id: String(row?.id ?? `row-${index + 1}`),
    sourceUrl: row?.url ?? row?.URL,
    cover: stringOrUndefined(row?.cover ?? row?.Cover),
    icon: normalizePlainIcon(row?.icon ?? row?.Icon),
    content: normalizePlainContent(row?.content ?? row?.Content),
    createdTime: stringOrUndefined(row?.created_time ?? row?.createdTime),
    lastEditedTime: stringOrUndefined(row?.last_edited_time ?? row?.lastEditedTime),
    properties,
    raw: row
  };
}

function normalizeNotionProperty(property) {
  if (!property || !property.type) {
    return emptyValue(property);
  }

  switch (property.type) {
    case "title":
      return textValue("title", richTextToPlain(property.title), property);
    case "rich_text":
      return textValue("rich_text", richTextToPlain(property.rich_text), property);
    case "number":
      return { type: "number", text: formatPrimitive(property.number), value: property.number, raw: property };
    case "select":
      return optionValue("select", property.select, property);
    case "status":
      return optionValue("status", property.status, property);
    case "multi_select":
      return {
        type: "multi_select",
        text: property.multi_select?.map((option) => option.name).join(", ") ?? "",
        values: property.multi_select?.map((option) => ({
          text: option.name,
          color: option.color
        })) ?? [],
        raw: property
      };
    case "date":
      return {
        type: "date",
        text: formatDateRange(property.date),
        value: property.date?.start ?? null,
        end: property.date?.end ?? null,
        raw: property
      };
    case "checkbox":
      return {
        type: "checkbox",
        text: property.checkbox ? "Yes" : "No",
        value: Boolean(property.checkbox),
        raw: property
      };
    case "url":
    case "email":
    case "phone_number":
      return textValue(property.type, property[property.type], property);
    case "files":
      return {
        type: "files",
        text: property.files?.map((file) => file.name).join(", ") ?? "",
        values: property.files?.map((file) => file.file?.url ?? file.external?.url).filter(Boolean) ?? [],
        raw: property
      };
    case "people":
      return {
        type: "people",
        text: property.people?.map((person) => person.name).join(", ") ?? "",
        values: property.people?.map((person) => person.name).filter(Boolean) ?? [],
        raw: property
      };
    case "relation":
      return {
        type: "relation",
        text: property.relation?.map((relation) => relation.id).join(", ") ?? "",
        values: property.relation?.map((relation) => relation.id) ?? [],
        raw: property
      };
    case "formula":
      return normalizeFormula(property);
    case "rollup":
      return normalizeRollup(property);
    case "created_time":
    case "last_edited_time":
      return textValue(property.type, property[property.type], property);
    case "unique_id":
      return textValue(
        "unique_id",
        `${property.unique_id?.prefix ?? ""}${property.unique_id?.number ?? ""}`,
        property
      );
    default:
      return {
        type: property.type,
        text: formatPrimitive(property[property.type]),
        value: property[property.type] ?? null,
        raw: property
      };
  }
}

function normalizePlainValue(value) {
  if (value === null || value === undefined || value === "") {
    return emptyValue(value);
  }

  if (Array.isArray(value)) {
    return {
      type: "multi_select",
      text: value.map(formatPrimitive).join(", "),
      values: value.map((entry) => ({ text: formatPrimitive(entry) })),
      raw: value
    };
  }

  if (typeof value === "number") {
    return { type: "number", text: formatPrimitive(value), value, raw: value };
  }

  if (typeof value === "boolean") {
    return { type: "checkbox", text: value ? "Yes" : "No", value, raw: value };
  }

  if (value instanceof Date) {
    return { type: "date", text: value.toISOString(), value: value.toISOString(), raw: value };
  }

  if (typeof value === "object") {
    if (value.url) {
      return textValue("url", value.url, value);
    }
    if (value.name) {
      return textValue("text", value.name, value);
    }
  }

  return textValue("text", String(value), value);
}

function normalizeFormula(property) {
  const formula = property.formula;
  if (!formula) return emptyValue(property);

  if (formula.type === "string") return textValue("formula", formula.string, property);
  if (formula.type === "number") return { type: "number", text: formatPrimitive(formula.number), value: formula.number, raw: property };
  if (formula.type === "boolean") return { type: "checkbox", text: formula.boolean ? "Yes" : "No", value: formula.boolean, raw: property };
  if (formula.type === "date") {
    return {
      type: "date",
      text: formatDateRange(formula.date),
      value: formula.date?.start ?? null,
      end: formula.date?.end ?? null,
      raw: property
    };
  }

  return emptyValue(property);
}

function normalizeRollup(property) {
  const rollup = property.rollup;
  if (!rollup) return emptyValue(property);

  if (rollup.type === "number") return { type: "number", text: formatPrimitive(rollup.number), value: rollup.number, raw: property };
  if (rollup.type === "date") {
    return {
      type: "date",
      text: formatDateRange(rollup.date),
      value: rollup.date?.start ?? null,
      end: rollup.date?.end ?? null,
      raw: property
    };
  }
  if (rollup.type === "array") {
    const values = rollup.array?.map((entry) => normalizeNotionProperty(entry).text).filter(Boolean) ?? [];
    return {
      type: "multi_select",
      text: values.join(", "),
      values: values.map((text) => ({ text })),
      raw: property
    };
  }

  return {
    type: "rollup",
    text: formatPrimitive(rollup[rollup.type]),
    value: rollup[rollup.type] ?? null,
    raw: property
  };
}

function normalizeCover(cover) {
  if (!cover) return undefined;
  return cover.external?.url ?? cover.file?.url ?? undefined;
}

function normalizeIcon(icon) {
  if (!icon) return undefined;
  if (icon.type === "emoji") {
    return { type: "emoji", value: icon.emoji };
  }
  if (icon.type === "external") {
    return { type: "image", url: icon.external?.url };
  }
  if (icon.type === "file") {
    return {
      type: "image",
      url: icon.file?.url,
      expiresAt: icon.file?.expiry_time
    };
  }
  return undefined;
}

function normalizePlainIcon(icon) {
  if (!icon) return undefined;
  if (typeof icon === "string") {
    if (/^https?:\/\//i.test(icon)) return { type: "image", url: icon };
    return { type: "emoji", value: icon };
  }
  if (typeof icon === "object") return icon;
  return undefined;
}

function normalizePlainContent(content) {
  if (!content) return [];
  if (Array.isArray(content)) {
    return content.map((entry) => {
      if (typeof entry === "string") {
        return { type: "paragraph", text: entry };
      }
      return entry;
    });
  }
  return String(content)
    .split(/\n{2,}/)
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text) => ({ type: "paragraph", text }));
}

function optionValue(type, option, raw) {
  return {
    type,
    text: option?.name ?? "",
    value: option?.name ?? null,
    color: option?.color,
    raw
  };
}

function textValue(type, value, raw) {
  return {
    type,
    text: value ?? "",
    value: value ?? null,
    raw
  };
}

function emptyValue(raw) {
  return {
    type: "empty",
    text: "",
    value: null,
    raw
  };
}

function richTextToPlain(parts) {
  return parts?.map((part) => part.plain_text ?? "").join("") ?? "";
}

function formatDateRange(date) {
  if (!date?.start) return "";
  if (!date.end) return date.start;
  return `${date.start} - ${date.end}`;
}

function formatPrimitive(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function stringOrUndefined(value) {
  return value === null || value === undefined ? undefined : String(value);
}
