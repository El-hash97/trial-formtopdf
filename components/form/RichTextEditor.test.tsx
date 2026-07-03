import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { setImageMock, runMock, chainMock } = vi.hoisted(() => ({
  setImageMock: vi.fn(),
  runMock: vi.fn(() => ({})),
  chainMock: vi.fn(),
}));

vi.mock("@tiptap/react", () => ({
  useEditor: () =>
    ({
      getHTML: () => "<p>mock</p>",
      chain: chainMock,
    }) as any,
  EditorContent: () => <div data-testid="editor-content" />,
}));

vi.mock("@tiptap/starter-kit", () => ({ default: {} }));
vi.mock("tiptap-extension-resize-image", () => ({
  default: { configure: () => ({}) },
}));

vi.mock("../../lib/image-compress", () => ({
  compressImageToDataUrl: vi.fn().mockResolvedValue("data:image/png;base64,AAAA"),
}));

import { RichTextEditor } from "./RichTextEditor";

beforeEach(() => {
  chainMock.mockReturnValue({
    focus: () => ({ setImage: setImageMock.mockReturnValue({ run: runMock }) }),
  });
  setImageMock.mockClear();
  runMock.mockClear();
});

describe("RichTextEditor", () => {
  it("renders the upload button and the editor content area", () => {
    render(<RichTextEditor value="" onChange={vi.fn()} />);

    expect(screen.getByText("Upload Foto")).toBeInTheDocument();
    expect(screen.getByTestId("editor-content")).toBeInTheDocument();
  });

  it("compresses and inserts an uploaded image into the editor", async () => {
    const user = userEvent.setup();
    render(<RichTextEditor value="" onChange={vi.fn()} />);

    const file = new File(["fake-bytes"], "photo.png", { type: "image/png" });
    const input = screen.getByText("Upload Foto").querySelector("input") as HTMLInputElement;

    await user.upload(input, file);

    expect(setImageMock).toHaveBeenCalledWith({ src: "data:image/png;base64,AAAA" });
    expect(runMock).toHaveBeenCalled();
  });
});
