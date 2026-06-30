export function normalizeNotionBlocks(blocks) {
  return blocks
    .map(normalizeBlock)
    .filter(Boolean);
}

function normalizeBlock(block) {
  if (!block?.type) return undefined;

  switch (block.type) {
    case "paragraph":
      return textBlock("paragraph", block.paragraph?.rich_text);
    case "heading_1":
      return textBlock("heading_1", block.heading_1?.rich_text);
    case "heading_2":
      return textBlock("heading_2", block.heading_2?.rich_text);
    case "heading_3":
      return textBlock("heading_3", block.heading_3?.rich_text);
    case "bulleted_list_item":
      return textBlock("bulleted_list_item", block.bulleted_list_item?.rich_text);
    case "numbered_list_item":
      return textBlock("numbered_list_item", block.numbered_list_item?.rich_text);
    case "quote":
      return textBlock("quote", block.quote?.rich_text);
    case "callout":
      return {
        type: "callout",
        text: richTextToPlain(block.callout?.rich_text),
        icon: normalizeBlockIcon(block.callout?.icon)
      };
    case "code":
      return {
        type: "code",
        text: richTextToPlain(block.code?.rich_text),
        language: block.code?.language
      };
    case "image":
      return {
        type: "image",
        url: block.image?.external?.url ?? block.image?.file?.url,
        caption: richTextToPlain(block.image?.caption)
      };
    case "divider":
      return { type: "divider" };
    default:
      return undefined;
  }
}

function textBlock(type, richText) {
  const text = richTextToPlain(richText);
  if (!text) return undefined;
  return { type, text };
}

function richTextToPlain(parts) {
  return parts?.map((part) => part.plain_text ?? "").join("") ?? "";
}

function normalizeBlockIcon(icon) {
  if (!icon) return undefined;
  if (icon.type === "emoji") return { type: "emoji", value: icon.emoji };
  if (icon.type === "external") return { type: "image", url: icon.external?.url };
  if (icon.type === "file") return { type: "image", url: icon.file?.url };
  return undefined;
}
