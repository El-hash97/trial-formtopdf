import { describe, it, expect } from "vitest";
import { escapeHtml, sanitizeRichText } from "./html-safety";

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml(`<b>"Bold" & 'quoted'</b>`)).toBe(
      "&lt;b&gt;&quot;Bold&quot; &amp; &#39;quoted&#39;&lt;/b&gt;"
    );
  });
});

describe("sanitizeRichText", () => {
  it("keeps allowed formatting tags", () => {
    expect(sanitizeRichText("<p>Hello <b>world</b></p>")).toBe("<p>Hello <b>world</b></p>");
  });

  it("strips script tags", () => {
    expect(sanitizeRichText('<p>Hi</p><script>alert(1)</script>')).toBe("<p>Hi</p>");
  });

  it("strips event handler attributes", () => {
    expect(sanitizeRichText('<p onclick="alert(1)">Hi</p>')).toBe("<p>Hi</p>");
  });

  it("keeps data: image sources but strips http(s) image sources", () => {
    const input =
      '<img src="data:image/png;base64,AAAA" /><img src="https://evil.example/track.png" />';
    const result = sanitizeRichText(input);
    expect(result).toContain('src="data:image/png;base64,AAAA"');
    expect(result).not.toContain("evil.example");
  });
});
