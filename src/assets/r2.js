import { createHash, createHmac } from "node:crypto";

const DEFAULT_PREFIX = "notion2page";
const DEFAULT_CACHE_CONTROL = "public, max-age=31536000, immutable";
const DEFAULT_MAX_BYTES = 25 * 1024 * 1024;
const R2_REGION = "auto";
const S3_SERVICE = "s3";

export async function mirrorAssetsToR2(model, options) {
  const config = normalizeR2Options(options);
  const refs = collectAssetRefs(model);
  const refsToMirror = refs
    .map((ref) => ({ ref, sourceUrl: ref.get() }))
    .filter(({ sourceUrl }) => shouldMirrorUrl(sourceUrl, config));
  const urls = [...new Set(refsToMirror.map(({ sourceUrl }) => sourceUrl))];
  const publicUrlBySourceUrl = new Map();
  const publicUrlByHash = new Map();
  let uploaded = 0;

  for (const url of urls) {
    const asset = await downloadAsset(url, config);
    const hash = sha256Hex(asset.bytes);
    const ext = extensionForAsset(asset, url);
    const key = joinKey(config.prefix, `${hash}${ext}`);
    const publicUrl = joinPublicUrl(config.publicBaseUrl, key);

    if (!publicUrlByHash.has(hash)) {
      await putR2Object(config, key, asset, hash);
      publicUrlByHash.set(hash, publicUrl);
      uploaded += 1;
    }

    publicUrlBySourceUrl.set(url, publicUrlByHash.get(hash));
  }

  for (const { ref, sourceUrl } of refsToMirror) {
    ref.set(publicUrlBySourceUrl.get(sourceUrl));
  }

  return {
    model,
    stats: {
      mirrored: refsToMirror.length,
      uploaded,
      skipped: refs.length - refsToMirror.length
    }
  };
}

function normalizeR2Options(options) {
  const config = {
    accountId: trimString(options.accountId),
    bucket: trimString(options.bucket),
    accessKeyId: trimString(options.accessKeyId),
    secretAccessKey: trimString(options.secretAccessKey),
    publicBaseUrl: trimString(options.publicBaseUrl),
    prefix: trimSlashes(trimString(options.prefix) || DEFAULT_PREFIX),
    cacheControl: trimString(options.cacheControl) || DEFAULT_CACHE_CONTROL,
    includeExternal: Boolean(options.includeExternal),
    maxBytes: Number(options.maxBytes ?? DEFAULT_MAX_BYTES),
    urlStyle: options.urlStyle === "path" ? "path" : "virtualHosted"
  };
  const missing = [
    ["accountId", config.accountId],
    ["bucket", config.bucket],
    ["accessKeyId", config.accessKeyId],
    ["secretAccessKey", config.secretAccessKey],
    ["publicBaseUrl", config.publicBaseUrl]
  ].filter(([, value]) => !value);

  if (missing.length > 0) {
    throw new Error(`R2 asset mirror requires assets.${missing.map(([key]) => key).join(", assets.")}.`);
  }

  if (!Number.isFinite(config.maxBytes) || config.maxBytes <= 0) {
    throw new Error("R2 asset mirror requires assets.maxBytes to be a positive number.");
  }

  return config;
}

function collectAssetRefs(model) {
  const refs = [];

  for (const project of model.projects ?? []) {
    collectProjectAssetRefs(project, refs);
  }

  return refs;
}

function collectProjectAssetRefs(project, refs) {
  if (project.background?.type === "image" && project.background.url) {
    refs.push({
      get: () => project.background.url,
      set: (url) => {
        project.background.url = url;
      }
    });
  }

  collectIconRef(project.icon, refs);
  collectContentAssetRefs(project.content, refs);

  for (const child of project.children ?? []) {
    collectProjectAssetRefs(child, refs);
  }
}

function collectContentAssetRefs(content, refs) {
  for (const block of content ?? []) {
    if (block?.type === "image" && block.url) {
      refs.push({
        get: () => block.url,
        set: (url) => {
          block.url = url;
        }
      });
    }

    collectIconRef(block?.icon, refs);
  }
}

function collectIconRef(icon, refs) {
  if (icon?.type !== "image" || !icon.url) return;

  refs.push({
    get: () => icon.url,
    set: (url) => {
      icon.url = url;
    }
  });
}

function shouldMirrorUrl(value, config) {
  const parsed = parseHttpUrl(value);
  if (!parsed) return false;
  if (isUnderPublicBaseUrl(parsed, config.publicBaseUrl)) return false;
  if (config.includeExternal) return true;
  return isNotionHostedUrl(parsed);
}

function isUnderPublicBaseUrl(parsed, publicBaseUrl) {
  const base = parseHttpUrl(publicBaseUrl);
  if (!base) return false;
  return parsed.origin === base.origin && parsed.pathname.startsWith(normalizedBasePath(base.pathname));
}

function normalizedBasePath(pathname) {
  if (!pathname || pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function isNotionHostedUrl(parsed) {
  const host = parsed.hostname.toLowerCase();
  return (
    host.includes("notion") ||
    host === "prod-files-secure.s3.us-west-2.amazonaws.com" ||
    (host.startsWith("prod-files-secure.s3.") && host.endsWith(".amazonaws.com"))
  );
}

async function downloadAsset(url, config) {
  const response = await fetch(url, { redirect: "follow" });

  if (!response.ok) {
    throw new Error(`Failed to download asset ${url}: ${response.status} ${response.statusText}`);
  }

  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > config.maxBytes) {
    throw new Error(`Asset ${url} is ${contentLength} bytes, above the ${config.maxBytes} byte limit.`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > config.maxBytes) {
    throw new Error(`Asset ${url} is ${bytes.length} bytes, above the ${config.maxBytes} byte limit.`);
  }

  return {
    bytes,
    contentType: normalizeContentType(response.headers.get("content-type"))
  };
}

async function putR2Object(config, key, asset, payloadHash) {
  const { host, canonicalUri } = r2ObjectTarget(config, key);
  const url = `https://${host}${canonicalUri}`;
  const now = new Date();
  const amzDate = formatAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const headersToSign = {
    "cache-control": config.cacheControl,
    "content-type": asset.contentType,
    host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate
  };
  const authorization = signRequest({
    method: "PUT",
    canonicalUri,
    headers: headersToSign,
    payloadHash,
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    dateStamp,
    amzDate
  });
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: authorization,
      "Cache-Control": config.cacheControl,
      "Content-Type": asset.contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate
    },
    body: asset.bytes
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to upload R2 object ${key}: ${response.status} ${response.statusText} ${body.slice(0, 300)}`);
  }
}

function r2ObjectTarget(config, key) {
  if (config.urlStyle === "path") {
    return {
      host: `${config.accountId}.r2.cloudflarestorage.com`,
      canonicalUri: `/${uriEncodePathSegment(config.bucket)}/${encodeKeyPath(key)}`
    };
  }

  return {
    host: `${config.bucket}.${config.accountId}.r2.cloudflarestorage.com`,
    canonicalUri: `/${encodeKeyPath(key)}`
  };
}

function signRequest({ method, canonicalUri, headers, payloadHash, accessKeyId, secretAccessKey, dateStamp, amzDate }) {
  const canonicalQueryString = "";
  const headerNames = Object.keys(headers).sort();
  const canonicalHeaders = headerNames
    .map((name) => `${name}:${normalizeHeaderValue(headers[name])}\n`)
    .join("");
  const signedHeaders = headerNames.join(";");
  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join("\n");
  const scope = `${dateStamp}/${R2_REGION}/${S3_SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256Hex(canonicalRequest)
  ].join("\n");
  const signingKey = signingKeyFor(secretAccessKey, dateStamp);
  const signature = hmac(signingKey, stringToSign).toString("hex");

  return `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

function signingKeyFor(secretAccessKey, dateStamp) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, R2_REGION);
  const serviceKey = hmac(regionKey, S3_SERVICE);
  return hmac(serviceKey, "aws4_request");
}

function hmac(key, value) {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

function formatAmzDate(date) {
  return date.toISOString().replaceAll("-", "").replaceAll(":", "").replace(/\.\d{3}Z$/, "Z");
}

function normalizeHeaderValue(value) {
  return String(value).trim().replaceAll(/\s+/g, " ");
}

function extensionForAsset(asset, url) {
  const fromContentType = extensionFromContentType(asset.contentType);
  if (fromContentType) return fromContentType;

  const parsed = parseHttpUrl(url);
  const match = parsed?.pathname.match(/\.([a-z0-9]{1,8})$/i);
  return match ? `.${match[1].toLowerCase()}` : "";
}

function extensionFromContentType(contentType) {
  const type = contentType.split(";", 1)[0].trim().toLowerCase();
  const extensions = {
    "image/avif": ".avif",
    "image/gif": ".gif",
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/svg+xml": ".svg",
    "image/webp": ".webp"
  };

  return extensions[type] ?? "";
}

function normalizeContentType(value) {
  return trimString(value) || "application/octet-stream";
}

function joinKey(prefix, fileName) {
  return [trimSlashes(prefix), trimSlashes(fileName)].filter(Boolean).join("/");
}

function joinPublicUrl(baseUrl, key) {
  return `${baseUrl.replace(/\/+$/, "")}/${key.split("/").map(uriEncodePathSegment).join("/")}`;
}

function encodeKeyPath(key) {
  return key.split("/").map(uriEncodePathSegment).join("/");
}

function uriEncodePathSegment(value) {
  return encodeURIComponent(value).replaceAll(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);
}

function parseHttpUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function trimSlashes(value) {
  return String(value ?? "").replace(/^\/+|\/+$/g, "");
}

function trimString(value) {
  return typeof value === "string" ? value.trim() : value;
}
