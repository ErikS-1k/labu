'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { actualizarPerfil, eliminarFoto } from '@/app/actions/perfil'
import { useProgress } from '@/lib/useProgress'
import { showToast } from '@/lib/toast'
import { avatarBg } from '@/lib/avatar'

type Props = {
  userId:      string
  first_name:  string | null
  last_name:   string | null
  username:    string | null
  headline:    string | null
  bio:         string | null
  location:    string | null
  phone:       string | null
  email:       string | null
  avatar_url:  string | null
}

const init = { error: null as string | null, toast: null as string | null }

export default function EditarPerfilForm({ userId, first_name, last_name, username, headline, bio, location, phone, email, avatar_url }: Props) {
  const [state, action, pending] = useActionState(actualizarPerfil, init)
  useProgress(pending)
  const [saved, setSaved] = useState(false)
  const [preview, setPreview] = useState<string | null>(avatar_url)
  // dbAvatarUrl rastrea el estado real en la BD (se actualiza después de eliminar)
  const [dbAvatarUrl, setDbAvatarUrl] = useState<string | null>(avatar_url)
  const [isNewFile, setIsNewFile] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletePending, startDelete] = useTransition()

  useEffect(() => {
    if (state.toast === 'perfil_actualizado' && !state.error) {
      showToast('Perfil guardado correctamente.')
      setSaved(true)
    }
  }, [state])
  const avatarRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPreview(URL.createObjectURL(file))
      setIsNewFile(true)
      setConfirmar(false)
    }
  }

  function handleEliminarConfirmado() {
    startDelete(async () => {
      const result = await eliminarFoto()
      if (result.error) {
        setDeleteError(result.error)
      } else {
        setPreview(null)
        setDbAvatarUrl(null)
        setIsNewFile(false)
        setConfirmar(false)
        setDeleteError(null)
      }
    })
  }

  const inicial = (first_name ?? username ?? 'U')[0].toUpperCase()

  return (
    <form action={action} onChange={() => setSaved(false)} className="flex flex-col gap-4">
      {/* Foto de perfil */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => avatarRef.current?.click()}
          className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-full hover:opacity-80 transition-opacity ${!preview ? avatarBg(username, first_name, userId) : ''}`}
        >
          {preview
            ? preview.startsWith('blob:')
              ? <img src={preview} alt="Avatar" className="h-full w-full object-cover" />
              : <Image src={preview} width={64} height={64} sizes="64px" className="object-cover" alt="Avatar" />
            : <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">{inicial}</span>
          }
        </button>

        {confirmar ? (
          /* Confirmación de eliminación */
          <div className="flex flex-col gap-2">
            <p className="text-sm text-white">¿Eliminar tu foto de perfil?</p>
            {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleEliminarConfirmado}
                disabled={deletePending}
                className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
              >
                {deletePending ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
              <button
                type="button"
                onClick={() => { setConfirmar(false); setDeleteError(null) }}
                disabled={deletePending}
                className="rounded-lg border border-surface-2 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-surface-2 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => avatarRef.current?.click()}
              className="text-sm text-zinc-400 underline hover:text-white"
            >
              Cambiar foto
            </button>
            <p className="mt-0.5 text-xs text-zinc-400">JPG o PNG · máx. 5MB</p>
            {dbAvatarUrl && !isNewFile && (
              <button
                type="button"
                onClick={() => setConfirmar(true)}
                className="mt-1 text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Eliminar foto
              </button>
            )}
          </div>
        )}

        <input
          ref={avatarRef}
          type="file"
          name="avatar"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

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
        <p className="mt-1 text-xs text-zinc-400">Solo visible para vos. No se muestra públicamente.</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Email de contacto</label>
        <input
          name="email"
          type="email"
          defaultValue={email ?? ''}
          placeholder="Ej: juan@ejemplo.com"
          className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
        />
        <p className="mt-1 text-xs text-zinc-400">Solo visible para vos. No se muestra públicamente.</p>
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
        disabled={saved || pending}
        className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
          saved
            ? 'cursor-default bg-zinc-700 text-zinc-400'
            : 'bg-white text-zinc-900 hover:bg-zinc-200 disabled:opacity-40'
        }`}
      >
        {pending ? 'Guardando...' : saved ? 'Guardado ✓' : 'Guardar cambios'}
      </button>
    </form>
  )
}
