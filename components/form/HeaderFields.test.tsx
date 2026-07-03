import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import type { HenkatenFormDataInput } from "../../lib/form-schema";
import { HeaderFields } from "./HeaderFields";

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
      <HeaderFields />
    </FormProvider>
  );
}

describe("HeaderFields", () => {
  it("reveals a manual input when Jenis Henkaten is Lain-lain", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    expect(screen.queryByPlaceholderText("Tulis jenis henkaten")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Jenis Henkaten"), "Lain-lain");

    expect(screen.getByPlaceholderText("Tulis jenis henkaten")).toBeInTheDocument();
  });

  it("previews the combined jumlah/periode label", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.selectOptions(screen.getByLabelText("Jumlah/Periode Shift"), "2");
    await user.click(screen.getByLabelText("White"));
    await user.click(screen.getByLabelText("Red"));

    expect(screen.getByTestId("jumlah-periode-preview")).toHaveTextContent("2 Shift (White Red)");
  });
});
