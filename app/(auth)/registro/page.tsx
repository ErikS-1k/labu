import { Metadata } from 'next'
import RegistroForm from '@/components/auth/RegistroForm'

export const metadata: Metadata = { title: 'Crear cuenta — Labu' }

export default function RegistroPage() {
  return (
    <>
      <h2 className="mb-6 text-lg font-semibold text-zinc-800">Creá tu cuenta</h2>
      <RegistroForm />
    </>
  )
}
