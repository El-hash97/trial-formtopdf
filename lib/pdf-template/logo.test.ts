import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { getLogoDataUri } from "./logo";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe("getLogoDataUri", () => {
  it("returns null when the file does not exist", () => {
    const result = getLogoDataUri(path.join(tmpdir(), "does-not-exist-logo.png"));
    expect(result).toBeNull();
  });

  it("returns a base64 data URI when the file exists", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "logo-test-"));
    tempDirs.push(dir);
    const filePath = path.join(dir, "logo.png");
    const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    writeFileSync(filePath, pngBytes);

    const result = getLogoDataUri(filePath);

    expect(result).toBe(`data:image/png;base64,${pngBytes.toString("base64")}`);
  });
});
