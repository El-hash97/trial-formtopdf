import { describe, it, expect } from "vitest";
import {
  formatDateID,
  formatDateRangeLabel,
  formatJumlahPeriode,
  slugify,
  buildFileName,
} from "./format-helpers";

describe("formatDateID", () => {
  it("formats an ISO date into Indonesian long form", () => {
    expect(formatDateID("2025-09-13")).toBe("13 September 2025");
  });
});

describe("formatDateRangeLabel", () => {
  it("formats a start and end date as a range", () => {
    expect(formatDateRangeLabel("2025-09-13", "2025-09-30")).toBe(
      "13 September 2025 - 30 September 2025"
    );
  });

  it("returns a single date label when start and end are equal", () => {
    expect(formatDateRangeLabel("2025-09-13", "2025-09-13")).toBe("13 September 2025");
  });
});

describe("formatJumlahPeriode", () => {
  it("combines shift count and multiple colors", () => {
    expect(formatJumlahPeriode(2, ["White", "Red"])).toBe("2 Shift (White Red)");
  });

  it("combines shift count and a single color", () => {
    expect(formatJumlahPeriode(1, ["Red"])).toBe("1 Shift (Red)");
  });

  it("omits parentheses when no color is selected", () => {
    expect(formatJumlahPeriode(1, [])).toBe("1 Shift");
  });
});

describe("slugify", () => {
  it("lowercases and dashes a title", () => {
    expect(slugify("Trial Konfirmasi Carbon Nitrogen!")).toBe("trial-konfirmasi-carbon-nitrogen");
  });

  it("collapses repeated separators", () => {
    expect(slugify("  Multi   Space -- Title  ")).toBe("multi-space-title");
  });
});

describe("buildFileName", () => {
  it("builds a pdf file name from title and date", () => {
    expect(buildFileName("Trial Carbon", "2025-09-13")).toBe("Henkaten_trial-carbon_2025-09-13.pdf");
  });
});
