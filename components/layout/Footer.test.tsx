import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";

describe("Footer", () => {
  it("shows the copyright line", () => {
    render(<Footer />);
    expect(screen.getByText("© 2026 Henkaten PDF Generator")).toBeInTheDocument();
  });
});
