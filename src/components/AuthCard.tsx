export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-50 via-white to-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-brand-600 text-xl font-bold text-white shadow">
            R
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Resolve Aí</h1>
          <p className="text-sm text-slate-500">Plataforma de gestão de ocorrências</p>
        </div>
        <div className="card p-6 sm:p-8">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mb-5 text-sm text-slate-500">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
