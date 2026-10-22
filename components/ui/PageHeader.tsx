export default function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6 hidden md:block">
      <h1 className="font-serif text-2xl font-medium text-white">{title}</h1>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
    </div>
  )
}
