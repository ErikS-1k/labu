export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-0 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-surface-1 p-8 shadow-sm ring-1 ring-white/10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">Labu</h1>
          <p className="mt-1 text-sm text-zinc-500">Marketplace de trabajo</p>
        </div>
        {children}
      </div>
    </div>
  )
}
