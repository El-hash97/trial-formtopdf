import { HenkatenForm } from "../components/form/HenkatenForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <h1 className="p-6 text-xl font-bold">Form Henkaten</h1>
      <HenkatenForm />
    </main>
  );
}
