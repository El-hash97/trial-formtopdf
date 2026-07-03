import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import type { HenkatenFormDataInput } from "../../lib/form-schema";
import { LineSectionList } from "./LineSectionList";

vi.mock("./RichTextEditor", () => ({
  RichTextEditor: ({ value, onChange }: { value: string; onChange: (html: string) => void }) => (
    <textarea aria-label="Deskripsi" value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}));

function Harness() {
  const methods = useForm<HenkatenFormDataInput>({
    defaultValues: {
      judul: "",
      jenisHenkaten: "Material",
      jenisHenkatenManual: "",
      tujuan: "",
      waktuMulai: "",
      waktuSelesai: "",
      shiftCount: 1,
      warnaShift: [],
      bendaKerja: "",
      lineHeader: "",
      proses: "",
      approval: {
        productionDphProd: "",
        productionSecHead: "",
        engineeringDphEng: "",
        engineeringSecHead1: "",
        engineeringSecHead2: "",
        pemohon: "",
      },
      background: { descriptionHtml: "" },
      lineSections: [],
    },
  });
  return (
    <FormProvider {...methods}>
      <LineSectionList />
    </FormProvider>
  );
}

describe("LineSectionList", () => {
  it("starts with no sections and adds one per click", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.queryAllByLabelText("Deskripsi")).toHaveLength(0);

    await user.click(screen.getByText("+ Tambah Section Line"));
    expect(screen.getAllByLabelText("Deskripsi")).toHaveLength(1);

    await user.click(screen.getByText("+ Tambah Section Line"));
    expect(screen.getAllByLabelText("Deskripsi")).toHaveLength(2);
  });

  it("removes only the targeted section", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByText("+ Tambah Section Line"));
    await user.click(screen.getByText("+ Tambah Section Line"));
    expect(screen.getAllByLabelText("Deskripsi")).toHaveLength(2);

    await user.click(screen.getByLabelText("Hapus section 1"));
    expect(screen.getAllByLabelText("Deskripsi")).toHaveLength(1);
  });
});
