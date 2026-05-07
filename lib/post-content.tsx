import type { Klass, LexicalNode, SerializedEditorState } from "lexical";
import type { ReactNode } from "react";

import parse from "html-react-parser";
import { Tweet } from "react-tweet";

import {
  extractLexicalSerializedState,
  extractPostBodyText,
  plainTextToLexicalSerializedState,
} from "@/lib/utils";

let lexicalDomInitialized = false;
const SUPPORTED_NODE_TYPES = new Set([
  "root",
  "paragraph",
  "heading",
  "quote",
  "list",
  "listitem",
  "table",
  "tablerow",
  "tablecell",
  "link",
  "autolink",
  "text",
  "linebreak",
  "tab",
]);

type LexicalRuntime = {
  $generateHtmlFromNodes: typeof import("@lexical/html").$generateHtmlFromNodes;
  createHeadlessEditor: typeof import("@lexical/headless").createHeadlessEditor;
  nodes: ReadonlyArray<Klass<LexicalNode>>;
};

let lexicalRuntimePromise: Promise<LexicalRuntime> | null = null;
const SANITIZE_OPTIONS = {
  USE_PROFILES: { html: true },
  ADD_TAGS: ["iframe", "tweet-embed"],
  ADD_ATTR: [
    "allow",
    "allowfullscreen",
    "frameborder",
    "loading",
    "referrerpolicy",
    "title",
    "data-tweet-id",
  ],
};

type DomPurifyModule = {
  sanitize: (dirty: string, options?: typeof SANITIZE_OPTIONS) => string;
};

let domPurifyPromise: Promise<DomPurifyModule | null> | null = null;

function fallbackSanitize(html: string): string {
  return html
    .replaceAll(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replaceAll(/\son\w+="[^"]*"/gi, "")
    .replaceAll(/\son\w+='[^']*'/gi, "")
    .replaceAll(/javascript:/gi, "");
}

async function sanitizeHtml(html: string): Promise<string> {
  if (!domPurifyPromise) {
    domPurifyPromise = import("isomorphic-dompurify")
      .then((mod) => mod.default as DomPurifyModule)
      .catch(() => null);
  }

  const sanitizer = await domPurifyPromise;
  if (!sanitizer) {
    return fallbackSanitize(html);
  }

  return sanitizer.sanitize(html, SANITIZE_OPTIONS);
}

function parseContentHtml(html: string): ReactNode {
  return parse(html, {
    replace(domNode) {
      const tagNode = domNode as {
        type?: string;
        name?: string;
        attribs?: Record<string, string | undefined>;
      };

      if (tagNode.type !== "tag" || tagNode.name !== "tweet-embed") {
        return null;
      }

      const tweetId = tagNode.attribs?.["data-tweet-id"];
      if (!tweetId) {
        return null;
      }

      return <Tweet id={tweetId} />;
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createTextNode(text: string): Record<string, unknown> {
  return {
    detail: 0,
    format: 0,
    mode: "normal",
    style: "",
    text,
    type: "text",
    version: 1,
  };
}

function createParagraphNodes(text: string): Array<Record<string, unknown>> {
  const normalized = text.trim();
  if (!normalized) {
    return [];
  }

  return normalized.split("\n").map((line) => ({
    children: line.length > 0 ? [createTextNode(line)] : [],
    direction: null,
    format: "",
    indent: 0,
    type: "paragraph",
    version: 1,
  }));
}

const INLINE_PARENT_TYPES = new Set(["paragraph", "heading", "quote", "link"]);

function createReplacementNodes(
  text: string,
  parentType: string | null,
): Array<Record<string, unknown>> {
  if (INLINE_PARENT_TYPES.has(parentType ?? "")) {
    return text.trim() ? [createTextNode(text.trim())] : [];
  }
  return createParagraphNodes(text);
}

function extractNodeText(node: unknown): string {
  if (!isRecord(node)) {
    return "";
  }

  if (node.type === "linebreak") {
    return "\n";
  }

  if (typeof node.text === "string") {
    return node.text;
  }

  if (!Array.isArray(node.children)) {
    return "";
  }

  return node.children.map(extractNodeText).join("");
}

function renderNodeListToHtml(nodes: unknown, listContext: "check" | null = null): string {
  if (!Array.isArray(nodes)) {
    return "";
  }
  return nodes.map((node) => renderNodeToHtml(node, listContext)).join("");
}

function renderNodeToHtml(node: unknown, listContext: "check" | null = null): string {
  if (!isRecord(node)) {
    return "";
  }

  const type = typeof node.type === "string" ? node.type : "";

  if (type === "text" || type === "code-highlight") {
    const text = typeof node.text === "string" ? node.text : "";
    return escapeHtml(text);
  }

  if (type === "linebreak") {
    return "<br />";
  }

  if (type === "paragraph") {
    return `<p>${renderNodeListToHtml(node.children, null)}</p>`;
  }

  if (type === "heading") {
    const tag = typeof node.tag === "string" && /^h[1-6]$/.test(node.tag) ? node.tag : "h2";
    return `<${tag}>${renderNodeListToHtml(node.children, null)}</${tag}>`;
  }

  if (type === "quote") {
    return `<blockquote>${renderNodeListToHtml(node.children, null)}</blockquote>`;
  }

  if (type === "list") {
    const listType =
      node.listType === "number" ? "number" : node.listType === "check" ? "check" : "bullet";
    const listTag = listType === "number" ? "ol" : "ul";
    const attrs = listType === "check" ? ' data-list-type="check"' : "";
    const childContext: "check" | null = listType === "check" ? "check" : null;
    return `<${listTag}${attrs}>${renderNodeListToHtml(node.children, childContext)}</${listTag}>`;
  }

  if (type === "listitem") {
    const content = renderNodeListToHtml(node.children, null);
    if (listContext === "check") {
      const checked = node.checked === true;
      const marker = checked ? "☑" : "☐";
      return `<li data-checked="${checked ? "true" : "false"}"><span>${marker}</span> ${content}</li>`;
    }
    return `<li>${content}</li>`;
  }

  if (type === "code") {
    return `<pre><code>${escapeHtml(extractNodeText(node))}</code></pre>`;
  }

  if (type === "horizontalrule") {
    return "<hr />";
  }

  if (type === "table") {
    return `<table><tbody>${renderNodeListToHtml(node.children, null)}</tbody></table>`;
  }

  if (type === "tablerow") {
    return `<tr>${renderNodeListToHtml(node.children, null)}</tr>`;
  }

  if (type === "tablecell") {
    const tag = typeof node.headerState === "number" && node.headerState > 0 ? "th" : "td";
    return `<${tag}>${renderNodeListToHtml(node.children, null)}</${tag}>`;
  }

  if ((type === "link" || type === "autolink") && typeof node.url === "string") {
    const safeHref = escapeHtml(node.url);
    return `<a href="${safeHref}" rel="noopener noreferrer" target="_blank">${renderNodeListToHtml(node.children, null)}</a>`;
  }

  if (type === "image") {
    const src = typeof node.src === "string" ? escapeHtml(node.src) : "";
    const alt = typeof node.altText === "string" ? escapeHtml(node.altText) : "";
    if (!src) {
      return "";
    }
    return `<p><img src="${src}" alt="${alt}" /></p>`;
  }

  if (type === "datetime" && typeof node.dateTime === "string") {
    const date = new Date(node.dateTime);
    const value = Number.isNaN(date.getTime()) ? node.dateTime : date.toDateString();
    return `<p>${escapeHtml(value)}</p>`;
  }

  if (type === "youtube" && typeof node.videoID === "string") {
    const id = escapeHtml(node.videoID);
    return `<div><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="YouTube video" loading="lazy" frameborder="0" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
  }

  if (type === "tweet" && typeof node.id === "string") {
    const id = escapeHtml(node.id);
    return `<tweet-embed data-tweet-id="${id}"></tweet-embed>`;
  }

  if (type === "layout-container" || type === "layout-item") {
    return `<div>${renderNodeListToHtml(node.children, null)}</div>`;
  }

  if (Array.isArray(node.children)) {
    return renderNodeListToHtml(node.children, null);
  }

  if (typeof node.text === "string") {
    return `<p>${escapeHtml(node.text)}</p>`;
  }

  return "";
}

function renderStructuredFallbackHtml(contentJson: unknown): string {
  if (!isRecord(contentJson) || !isRecord(contentJson.root)) {
    return "";
  }

  return renderNodeListToHtml((contentJson.root as { children?: unknown }).children);
}

function normalizeChildren(
  children: unknown,
  parentType: string | null = null,
): Array<Record<string, unknown>> {
  if (!Array.isArray(children)) {
    return [];
  }

  return children.flatMap((child) => normalizeNode(child, parentType));
}

function normalizeNode(
  node: unknown,
  parentType: string | null = null,
): Array<Record<string, unknown>> {
  if (!isRecord(node)) {
    return [];
  }

  const type = typeof node.type === "string" ? node.type : "";

  if (type === "layout-container" || type === "layout-item") {
    return normalizeChildren(node.children, type);
  }

  if (type === "code") {
    return createReplacementNodes(extractNodeText(node), parentType);
  }

  if (type === "tweet" && typeof node.id === "string") {
    return createReplacementNodes(`https://x.com/i/web/status/${node.id}`, parentType);
  }

  if (type === "youtube" && typeof node.videoID === "string") {
    return createReplacementNodes(`https://www.youtube.com/watch?v=${node.videoID}`, parentType);
  }

  if (type === "image" && typeof node.src === "string") {
    return createReplacementNodes(node.src, parentType);
  }

  if (type === "datetime" && typeof node.dateTime === "string") {
    return createReplacementNodes(node.dateTime, parentType);
  }

  if (type === "autocomplete") {
    return [];
  }

  if (SUPPORTED_NODE_TYPES.has(type)) {
    const normalizedNode: Record<string, unknown> = { ...node };
    if ("children" in normalizedNode) {
      normalizedNode.children = normalizeChildren(normalizedNode.children, type);
    }
    return [normalizedNode];
  }

  if (typeof node.text === "string") {
    return createReplacementNodes(node.text, parentType);
  }

  return normalizeChildren(node.children, type);
}

function normalizeSerializedStateForServerRender(
  serializedState: SerializedEditorState,
): SerializedEditorState {
  const rootNode: Record<string, unknown> = isRecord(serializedState.root)
    ? serializedState.root
    : {};
  const children = normalizeChildren(rootNode.children);

  return {
    ...serializedState,
    root: {
      ...rootNode,
      children,
      type: "root",
      version: typeof rootNode["version"] === "number" ? rootNode["version"] : 1,
    },
  } as SerializedEditorState;
}

async function ensureLexicalDom() {
  if (lexicalDomInitialized || typeof window !== "undefined") {
    return true;
  }

  const jsdomModule = await import("jsdom").catch(() => null);
  if (!jsdomModule) {
    return false;
  }

  const { JSDOM } = jsdomModule;
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  const globalWithDom = globalThis as Record<string, unknown>;
  const domWindow = dom.window as unknown as Record<string, unknown>;

  globalWithDom.window = dom.window;
  globalWithDom.document = dom.window.document;
  globalWithDom.navigator = dom.window.navigator;
  globalWithDom.Node = domWindow.Node;
  globalWithDom.Element = domWindow.Element;
  globalWithDom.HTMLElement = domWindow.HTMLElement;
  globalWithDom.DocumentFragment = domWindow.DocumentFragment;
  lexicalDomInitialized = true;
  return true;
}

async function loadLexicalRuntime(): Promise<LexicalRuntime> {
  if (!lexicalRuntimePromise) {
    lexicalRuntimePromise = (async () => {
      const domReady = await ensureLexicalDom();
      if (!domReady) {
        throw new Error("Lexical DOM runtime unavailable");
      }

      const [htmlMod, headlessMod, linkMod, listMod, overflowMod, richMod, tableMod] =
        await Promise.all([
          import("@lexical/html"),
          import("@lexical/headless"),
          import("@lexical/link"),
          import("@lexical/list"),
          import("@lexical/overflow"),
          import("@lexical/rich-text"),
          import("@lexical/table"),
        ]);

      return {
        $generateHtmlFromNodes: htmlMod.$generateHtmlFromNodes,
        createHeadlessEditor: headlessMod.createHeadlessEditor,
        nodes: [
          overflowMod.OverflowNode,
          richMod.HeadingNode,
          richMod.QuoteNode,
          listMod.ListNode,
          listMod.ListItemNode,
          linkMod.LinkNode,
          linkMod.AutoLinkNode,
          tableMod.TableNode,
          tableMod.TableCellNode,
          tableMod.TableRowNode,
        ],
      };
    })();
  }
  return lexicalRuntimePromise;
}

async function lexicalStateToHtml(serializedState: SerializedEditorState): Promise<string> {
  const normalizedState = normalizeSerializedStateForServerRender(serializedState);
  const runtime = await loadLexicalRuntime();

  const editor = runtime.createHeadlessEditor({
    nodes: runtime.nodes,
    onError(error: unknown) {
      throw error;
    },
  });

  editor.setEditorState(editor.parseEditorState(normalizedState));
  return editor.getEditorState().read(() => runtime.$generateHtmlFromNodes(editor, null));
}

export async function renderPostContent(contentJson: unknown): Promise<ReactNode> {
  // fallback to plain text if lexical state is not valid
  const lexicalState =
    extractLexicalSerializedState(contentJson) ??
    plainTextToLexicalSerializedState(extractPostBodyText(contentJson));

  try {
    const html = await lexicalStateToHtml(lexicalState);
    const sanitizedHtml = await sanitizeHtml(html);

    if (!sanitizedHtml.trim()) {
      return "No content provided.";
    }

    return parseContentHtml(sanitizedHtml);
  } catch {
    const fallbackHtml = await sanitizeHtml(renderStructuredFallbackHtml(lexicalState));

    if (fallbackHtml.trim()) {
      return parseContentHtml(fallbackHtml);
    }

    const fallbackText = extractPostBodyText(lexicalState).trim();
    return fallbackText || "No content provided.";
  }
}
