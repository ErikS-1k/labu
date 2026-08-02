import { Metadata } from 'next'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = { title: 'Iniciar sesión — Labu' }

export default function LoginPage() {
  return (
    <>
      <h2 className="mb-6 text-lg font-semibold text-white">Iniciá sesión</h2>
      <LoginForm />
    </>
  )
}
