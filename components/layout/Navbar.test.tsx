import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Navbar } from "./Navbar";

describe("Navbar", () => {
  it("shows the app title", () => {
    render(<Navbar />);
    expect(screen.getByText("Henkaten PDF Generator")).toBeInTheDocument();
  });
});
