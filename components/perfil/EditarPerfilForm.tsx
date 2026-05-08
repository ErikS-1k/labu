'use client'

import { useActionState } from 'react'
import { actualizarPerfil } from '@/app/actions/perfil'

type Props = {
  first_name: string | null
  last_name:  string | null
  username:   string | null
  headline:   string | null
  bio:        string | null
  location:   string | null
  phone:      string | null
}

const init = { error: null as string | null }

export default function EditarPerfilForm({ first_name, last_name, username, headline, bio, location, phone }: Props) {
  const [state, action, pending] = useActionState(actualizarPerfil, init)

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Nombre</label>
          <input
            name="first_name"
            defaultValue={first_name ?? ''}
            placeholder="Juan"
            required
            className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700">Apellido</label>
          <input
            name="last_name"
            defaultValue={last_name ?? ''}
            placeholder="Pérez"
            className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Titular profesional</label>
        <input
          name="headline"
          defaultValue={headline ?? ''}
          placeholder="Ej: Electricista matriculado · Freelance"
          className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Username</label>
        <div className="flex items-center rounded-lg border border-zinc-300 px-4 py-2.5 focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-200">
          <span className="mr-1 select-none text-sm text-zinc-400">@</span>
          <input
            name="username"
            defaultValue={username ?? ''}
            placeholder="tu_username"
            className="flex-1 text-sm outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-zinc-400">Solo letras minúsculas, números y _ · 3 a 30 caracteres</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Teléfono</label>
        <input
          name="phone"
          defaultValue={phone ?? ''}
          placeholder="Ej: +54 11 1234-5678"
          className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
        <p className="mt-1 text-xs text-zinc-400">Solo visible para quienes acepten tu postulación</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Zona</label>
        <input
          name="location"
          defaultValue={location ?? ''}
          placeholder="Ej: Palermo, CABA"
          className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Bio</label>
        <textarea
          name="bio"
          defaultValue={bio ?? ''}
          rows={4}
          placeholder="Contá quién sos, qué hacés, qué ofrecés..."
          className="w-full resize-none rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
      </div>

      {state.error && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-40"
      >
        {pending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}
