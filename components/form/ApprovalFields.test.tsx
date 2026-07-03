import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import type { HenkatenFormDataInput } from "../../lib/form-schema";
import { ApprovalFields } from "./ApprovalFields";

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
      <ApprovalFields />
      <span data-testid="pemohon-value">{methods.watch("approval.pemohon")}</span>
    </FormProvider>
  );
}

describe("ApprovalFields", () => {
  it("renders all six labelled name inputs", () => {
    render(<Harness />);
    [
      "Production - DpH.Prod",
      "Production - Sec.Head",
      "Engineering - DpH.Eng",
      "Engineering - Sec.Head 1",
      "Engineering - Sec.Head 2",
      "Pemohon",
    ].forEach((label) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });
  });

  it("updates form state when typing a name", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByLabelText("Pemohon"), "Hakim");

    expect(screen.getByTestId("pemohon-value")).toHaveTextContent("Hakim");
  });
});
