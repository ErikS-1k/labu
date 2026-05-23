'use client'

import { useActionState } from 'react'
import { registro } from '@/app/actions/auth'
import Link from 'next/link'

export default function RegistroForm() {
  const [state, action, pending] = useActionState(registro, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="first_name" className="text-sm font-medium text-zinc-700">
          Nombre
        </label>
        <input
          id="first_name"
          name="first_name"
          type="text"
          required
          placeholder="Juan"
          className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="last_name" className="text-sm font-medium text-zinc-700">
          Apellido
        </label>
        <input
          id="last_name"
          name="last_name"
          type="text"
          required
          placeholder="Pérez"
          className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium text-zinc-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="juan@ejemplo.com"
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-zinc-700">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          placeholder="Mínimo 6 caracteres"
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 disabled:opacity-50"
      >
        {pending ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>

      <p className="text-center text-sm text-zinc-500">
        ¿Ya tenés cuenta?{' '}
        <Link href="/login" className="font-medium text-white hover:underline">
          Iniciá sesión
        </Link>
      </p>
    </form>
  )
}
