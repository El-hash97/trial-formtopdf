import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateRangeToggle } from "./DateRangeToggle";

describe("DateRangeToggle", () => {
  it("shows a single date input in single mode", () => {
    render(
      <DateRangeToggle
        mode="single"
        start="2025-09-13"
        end=""
        onModeChange={vi.fn()}
        onStartChange={vi.fn()}
        onEndChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Tanggal")).toBeInTheDocument();
    expect(screen.queryByLabelText("Tanggal mulai")).not.toBeInTheDocument();
  });

  it("shows two date inputs in range mode", () => {
    render(
      <DateRangeToggle
        mode="range"
        start="2025-09-13"
        end="2025-09-30"
        onModeChange={vi.fn()}
        onStartChange={vi.fn()}
        onEndChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Tanggal mulai")).toBeInTheDocument();
    expect(screen.getByLabelText("Tanggal selesai")).toBeInTheDocument();
  });

  it("calls onModeChange when the checkbox is toggled", async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    render(
      <DateRangeToggle
        mode="single"
        start=""
        end=""
        onModeChange={onModeChange}
        onStartChange={vi.fn()}
        onEndChange={vi.fn()}
      />
    );

    await user.click(screen.getByLabelText("Rentang tanggal"));

    expect(onModeChange).toHaveBeenCalledWith("range");
  });
});
