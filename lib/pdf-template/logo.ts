import { readFileSync } from "fs";
import path from "path";

export function getLogoDataUri(
  logoPath: string = path.join(process.cwd(), "public", "logo.png")
): string | null {
  try {
    const bytes = readFileSync(logoPath);
    return `data:image/png;base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}
