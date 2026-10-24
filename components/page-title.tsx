// Page heading in the template's style ("Welcome back, Thando! 👋" / subtitle).
export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

// White card used for every panel, as in the template.
export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <section className={`rounded-xl border border-gray-100 bg-white p-6 shadow-sm ${className}`}>{children}</section>;
}
