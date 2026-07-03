export function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900 text-white">
      <div className="mx-auto flex h-16 max-w-3xl items-center px-4 sm:px-6">
        <div>
          <p className="text-base font-semibold leading-tight">Henkaten PDF Generator</p>
          <p className="hidden text-xs text-slate-400 sm:block">
            Generate PDF Lembar Permohonan Henkaten
          </p>
        </div>
      </div>
    </header>
  );
}
