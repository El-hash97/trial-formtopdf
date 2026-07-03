import imageCompression from "browser-image-compression";

const MAX_SIZE_MB = 1;
const MAX_WIDTH_OR_HEIGHT = 1600;

export async function compressImageToDataUrl(file: File): Promise<string> {
  const compressed = await imageCompression(file, {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT,
    useWebWorker: true,
  });
  return imageCompression.getDataUrlFromFile(compressed);
}
