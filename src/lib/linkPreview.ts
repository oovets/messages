import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import type { LinkPreview } from "@/types";
import { isTauriRuntime } from "@/lib/tauriEnv";

const URL_REGEX = /\bhttps?:\/\/[^\s<>]+[^\s<>.,;:!?)\]'"]/i;
const MAX_HTML_CHARS = 500_000;
const FETCH_TIMEOUT_MS = 8_000;

export function extractFirstUrl(text: string): string | null {
  const match = URL_REGEX.exec(text);
  if (!match) return null;
  return normalizePreviewUrl(match[0]);
}

export function normalizePreviewUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function emptyPreview(url: string, error: string): LinkPreview {
  return {
    url,
    siteName: "",
    title: "",
    description: "",
    image: "",
    favicon: "",
    status: "failed",
    fetchedAt: Date.now(),
    error,
  };
}

function cleanText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function absoluteUrl(value: string, baseUrl: string): string {
  if (!value) return "";
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return "";
  }
}

function getMeta(doc: Document, key: string): string {
  return cleanText(
    doc.querySelector(`meta[property="${key}"]`)?.getAttribute("content") ??
      doc.querySelector(`meta[name="${key}"]`)?.getAttribute("content")
  );
}

function parsePreviewHtml(url: string, html: string): LinkPreview {
  const doc = new DOMParser().parseFromString(html.slice(0, MAX_HTML_CHARS), "text/html");
  const parsedUrl = new URL(url);
  const title =
    getMeta(doc, "og:title") ||
    getMeta(doc, "twitter:title") ||
    cleanText(doc.querySelector("title")?.textContent);
  const description =
    getMeta(doc, "og:description") ||
    getMeta(doc, "twitter:description") ||
    getMeta(doc, "description");
  const siteName = getMeta(doc, "og:site_name") || parsedUrl.hostname.replace(/^www\./, "");
  const image = absoluteUrl(
    getMeta(doc, "og:image") || getMeta(doc, "twitter:image") || getMeta(doc, "twitter:image:src"),
    url
  );
  const favicon = absoluteUrl(
    doc.querySelector('link[rel~="icon"]')?.getAttribute("href") ??
      doc.querySelector('link[rel="shortcut icon"]')?.getAttribute("href") ??
      doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href") ??
      "",
    url
  );

  if (!title && !description && !image) {
    return emptyPreview(url, "No preview metadata found.");
  }

  return {
    url,
    siteName,
    title,
    description,
    image,
    favicon,
    status: "ready",
    fetchedAt: Date.now(),
  };
}

export async function fetchLinkPreview(url: string): Promise<LinkPreview> {
  if (!isTauriRuntime()) {
    return emptyPreview(url, "Link previews require the desktop app.");
  }

  const normalized = normalizePreviewUrl(url);
  if (!normalized) return emptyPreview(url, "Unsupported URL.");

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await tauriFetch(normalized, {
      method: "GET",
      signal: controller.signal,
      connectTimeout: FETCH_TIMEOUT_MS,
      maxRedirections: 5,
    });
    if (!response.ok) {
      return emptyPreview(normalized, `HTTP ${response.status}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType && !contentType.toLowerCase().includes("html")) {
      return emptyPreview(normalized, "URL is not an HTML page.");
    }

    const html = await response.text();
    return parsePreviewHtml(normalized, html);
  } catch (error) {
    return emptyPreview(normalized, String(error));
  } finally {
    window.clearTimeout(timeout);
  }
}
