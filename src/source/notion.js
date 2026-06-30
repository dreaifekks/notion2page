import { normalizeNotionPage } from "./normalize.js";
import { normalizeNotionBlocks } from "./blocks.js";

const API_BASE = "https://api.notion.com/v1";

export async function readNotionSource(config) {
  const source = config.source;
  const sourceId = source.dataSourceId ?? source.databaseId;
  const notionVersion = source.notionVersion ?? "2026-03-11";
  const pageSize = Math.min(Math.max(source.pageSize ?? 100, 1), 100);
  const filterProperties = source.filterProperties ?? [];
  const propertiesQuery = buildFilterPropertiesQuery(filterProperties);

  const resolved = await resolveDataSource({
    sourceId,
    preferredDataSourceName: source.dataSourceName,
    token: source.token,
    notionVersion
  });
  const dataSource = resolved.dataSource;
  const dataSourceId = dataSource.id;

  const results = [];
  let startCursor = undefined;

  do {
    const body = {
      page_size: pageSize,
      filter: source.filter,
      sorts: source.sorts,
      result_type: source.resultType ?? "page",
      start_cursor: startCursor
    };

    const page = await requestJson({
      path: `/data_sources/${dataSourceId}/query${propertiesQuery}`,
      method: "POST",
      token: source.token,
      notionVersion,
      body: dropUndefined(body)
    });

    results.push(...page.results);
    startCursor = page.has_more ? page.next_cursor : undefined;
  } while (startCursor);

  const items = results.map(normalizeNotionPage);

  if (source.includePageContent !== false) {
    for (const item of items) {
      item.content = await readPageContent({
        pageId: item.id,
        token: source.token,
        notionVersion,
        pageSize: source.blockPageSize ?? 100
      });
    }
  }

  return {
    items,
    meta: {
      sourceType: "notion",
      inputSourceId: sourceId,
      dataSourceId,
      databaseId: resolved.database?.id,
      dataSourceName: dataSource.title?.map((part) => part.plain_text).join("") ?? undefined,
      totalFetched: results.length
    }
  };
}

async function resolveDataSource({ sourceId, preferredDataSourceName, token, notionVersion }) {
  const dataSource = await requestJson({
    path: `/data_sources/${sourceId}`,
    method: "GET",
    token,
    notionVersion,
    allowNotFound: true
  });

  if (dataSource) {
    return { dataSource };
  }

  const database = await requestJson({
    path: `/databases/${sourceId}`,
    method: "GET",
    token,
    notionVersion
  });

  const dataSources = database.data_sources ?? [];

  if (dataSources.length === 0) {
    throw new Error(`Database "${sourceId}" has no data sources.`);
  }

  const picked = preferredDataSourceName
    ? dataSources.find((entry) => entry.name === preferredDataSourceName)
    : dataSources.length === 1 ? dataSources[0] : undefined;

  if (!picked) {
    const names = dataSources.map((entry) => `${entry.name} (${entry.id})`).join(", ");
    throw new Error(`Database "${sourceId}" has multiple data sources. Set source.dataSourceName to one of: ${names}`);
  }

  const resolvedDataSource = await requestJson({
    path: `/data_sources/${picked.id}`,
    method: "GET",
    token,
    notionVersion
  });

  return {
    database,
    dataSource: resolvedDataSource
  };
}

async function readPageContent({ pageId, token, notionVersion, pageSize }) {
  const results = [];
  let startCursor = undefined;

  do {
    const params = new URLSearchParams();
    params.set("page_size", String(Math.min(Math.max(pageSize, 1), 100)));
    if (startCursor) params.set("start_cursor", startCursor);

    const page = await requestJson({
      path: `/blocks/${pageId}/children?${params.toString()}`,
      method: "GET",
      token,
      notionVersion
    });

    results.push(...page.results);
    startCursor = page.has_more ? page.next_cursor : undefined;
  } while (startCursor);

  return normalizeNotionBlocks(results);
}

async function requestJson({ path, method, token, notionVersion, body, allowNotFound = false }) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": notionVersion
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};

  if (!response.ok) {
    if (allowNotFound && response.status === 404) {
      return undefined;
    }

    const message = payload.message ? `: ${payload.message}` : "";
    throw new Error(`Notion API ${response.status} ${response.statusText}${message}`);
  }

  return payload;
}

function buildFilterPropertiesQuery(properties) {
  if (!properties || properties.length === 0) {
    return "";
  }

  const params = new URLSearchParams();
  for (const property of properties) {
    if (property && !property.startsWith("$")) {
      params.append("filter_properties[]", property);
    }
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

function dropUndefined(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  );
}
