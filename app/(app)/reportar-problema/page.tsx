import { Metadata } from 'next'
import PageHeader from '@/components/ui/PageHeader'
import ReporteForm from '@/components/reportes/ReporteForm'

export const metadata: Metadata = { title: 'Reportar un problema — Labu' }

// Protegida en proxy.ts (el reporte queda asociado al usuario)
export default function ReportarProblemaPage() {
  return (
    <main className="mx-auto max-w-[640px] px-4 py-8 sm:px-6">
      <PageHeader title="Reportar un problema" subtitle="Contanos qué pasó y lo revisamos." />
      <ReporteForm />
    </main>
  )
}
