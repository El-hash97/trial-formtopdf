import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PicInput } from "./PicInput";

describe("PicInput", () => {
  it("adds a name when Enter is pressed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PicInput value={[]} onChange={onChange} />);

    await user.type(screen.getByPlaceholderText("Ketik nama, Enter untuk tambah"), "Budi{Enter}");

    expect(onChange).toHaveBeenCalledWith(["Budi"]);
  });

  it("renders existing names as removable chips", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PicInput value={["Budi", "Sarmili"]} onChange={onChange} />);

    expect(screen.getByText("Budi")).toBeInTheDocument();
    expect(screen.getByText("Sarmili")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Hapus Budi"));

    expect(onChange).toHaveBeenCalledWith(["Sarmili"]);
  });
});
