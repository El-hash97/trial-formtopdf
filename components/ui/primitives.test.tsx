import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { Checkbox } from "./checkbox";
import { Card, CardHeader, CardTitle, CardContent } from "./card";
import { Badge } from "./badge";
import { Alert, AlertDescription } from "./alert";

describe("ui primitives", () => {
  it("renders a Button as a native button element", () => {
    render(<Button>Simpan</Button>);
    expect(screen.getByRole("button", { name: "Simpan" })).toBeInTheDocument();
  });

  it("associates Label with Input via htmlFor", () => {
    render(
      <>
        <Label htmlFor="nama">Nama</Label>
        <Input id="nama" />
      </>
    );
    expect(screen.getByLabelText("Nama")).toBeInTheDocument();
  });

  it("renders a Textarea", () => {
    render(<Textarea aria-label="Catatan" />);
    expect(screen.getByLabelText("Catatan")).toBeInTheDocument();
  });

  it("renders a native checkbox input", () => {
    render(<Checkbox aria-label="Setuju" />);
    expect(screen.getByLabelText("Setuju")).toHaveAttribute("type", "checkbox");
  });

  it("renders Card sections", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Judul Kartu</CardTitle>
        </CardHeader>
        <CardContent>Isi kartu</CardContent>
      </Card>
    );
    expect(screen.getByText("Judul Kartu")).toBeInTheDocument();
    expect(screen.getByText("Isi kartu")).toBeInTheDocument();
  });

  it("renders a Badge", () => {
    render(<Badge>Budi</Badge>);
    expect(screen.getByText("Budi")).toBeInTheDocument();
  });

  it("renders an Alert with the given role", () => {
    render(
      <Alert variant="destructive" role="alert">
        <AlertDescription>Terjadi kesalahan</AlertDescription>
      </Alert>
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Terjadi kesalahan");
  });
});
