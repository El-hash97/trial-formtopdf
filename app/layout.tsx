import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Generate PDF Henkaten",
  description: "Form untuk mengisi dan generate PDF Lembar Permohonan Henkaten",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
