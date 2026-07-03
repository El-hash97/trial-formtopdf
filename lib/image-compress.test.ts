import { describe, it, expect, vi } from "vitest";

const { imageCompressionMock, getDataUrlFromFileMock } = vi.hoisted(() => ({
  imageCompressionMock: vi.fn(),
  getDataUrlFromFileMock: vi.fn(),
}));

vi.mock("browser-image-compression", () => ({
  default: Object.assign(imageCompressionMock, { getDataUrlFromFile: getDataUrlFromFileMock }),
}));

import { compressImageToDataUrl } from "./image-compress";

describe("compressImageToDataUrl", () => {
  it("compresses the file with the expected options and returns a data URL", async () => {
    const inputFile = new File(["fake-bytes"], "photo.png", { type: "image/png" });
    const compressedFile = new File(["compressed-bytes"], "photo.png", { type: "image/png" });
    imageCompressionMock.mockResolvedValue(compressedFile);
    getDataUrlFromFileMock.mockResolvedValue("data:image/png;base64,AAAA");

    const result = await compressImageToDataUrl(inputFile);

    expect(imageCompressionMock).toHaveBeenCalledWith(inputFile, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
    });
    expect(getDataUrlFromFileMock).toHaveBeenCalledWith(compressedFile);
    expect(result).toBe("data:image/png;base64,AAAA");
  });
});
