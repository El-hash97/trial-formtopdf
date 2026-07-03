import sanitizeHtml from "sanitize-html";

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "b", "strong", "i", "em", "u", "ul", "ol", "li", "span", "img"],
    allowedAttributes: {
      img: ["src", "width", "height", "style"],
      span: ["style"],
      p: ["style"],
    },
    allowedSchemesByTag: {
      img: ["data"],
    },
    allowedSchemes: [],
  });
}
