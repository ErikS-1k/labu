'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { actualizarPerfil, eliminarFoto } from '@/app/actions/perfil'
import { useProgress } from '@/lib/useProgress'
import { showToast } from '@/lib/toast'
import { avatarBg } from '@/lib/avatar'

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Props = {
  userId:     string
  first_name: string | null
  last_name:  string | null
  username:   string | null
  headline:   string | null
  bio:        string | null
  location:   string | null
  phone:      string | null
  email:      string | null
  avatar_url: string | null
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const inputDark =
  'w-full rounded-xl border border-[#2a2a2a] bg-[#111] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-500'

// ─── Íconos de sección ────────────────────────────────────────────────────────

function IconPerson() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
function IconDoc() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
}
function IconPhone() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 8a16 16 0 0 0 7.91 7.91l.81-.81a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
}

// ─── Card de sección ──────────────────────────────────────────────────────────

function SectionCard({
  icon, iconCls, title, children,
}: {
  icon: React.ReactNode
  iconCls: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[#2a2a2a] bg-[#171717] p-5">
      <div className="flex items-center gap-2.5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconCls}`}>
          {icon}
        </div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

const init = { error: null as string | null, toast: null as string | null }

export default function EditarPerfilForm({
  userId, first_name, last_name, username, headline, bio, location, phone, email, avatar_url,
}: Props) {
  const [state, action, pending] = useActionState(actualizarPerfil, init)
  useProgress(pending)
  const [saved, setSaved]             = useState(false)
  const [preview, setPreview]         = useState<string | null>(avatar_url)
  const [dbAvatarUrl, setDbAvatarUrl] = useState<string | null>(avatar_url)
  const [isNewFile, setIsNewFile]     = useState(false)
  const [confirmar, setConfirmar]     = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [deletePending, startDelete]  = useTransition()
  const avatarRef = useRef<HTMLInputElement>(null)

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  const MAX_BYTES = 10 * 1024 * 1024

  useEffect(() => {
    if (state.toast === 'perfil_actualizado' && !state.error) {
      showToast('Perfil guardado correctamente.')
      setSaved(true)
    }
  }, [state])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarError(null)

    if (file.size > MAX_BYTES) {
      setAvatarError('La foto es muy pesada. El máximo es 10MB.')
      e.target.value = ''
      return
    }

    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' ||
                   /\.(heic|heif)$/i.test(file.name)
    const isValid = ALLOWED_TYPES.includes(file.type) || isHeic

    if (!isValid) {
      setAvatarError('El formato no está soportado. Usá JPG, PNG, HEIC o WEBP.')
      e.target.value = ''
      return
    }

    let finalFile = file

    if (isHeic) {
      setIsConverting(true)
      try {
        const { default: heic2any } = await import('heic2any')
        const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })
        const blob = Array.isArray(result) ? result[0] : result
        finalFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg' })
        // Reemplazar el archivo en el input para que FormData envíe el JPEG
        const dt = new DataTransfer()
        dt.items.add(finalFile)
        if (avatarRef.current) avatarRef.current.files = dt.files
      } catch {
        setAvatarError('No se pudo convertir la foto. Guardala como JPG desde tu galería e intentá de nuevo.')
        e.target.value = ''
        setIsConverting(false)
        return
      }
      setIsConverting(false)
    }

    setPreview(URL.createObjectURL(finalFile))
    setIsNewFile(true)
    setConfirmar(false)
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
    <form action={action} onChange={() => setSaved(false)} className="flex flex-col gap-5">

      {/* ── Foto de perfil ── */}
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-[#2a2a2a] bg-[#171717] p-6">
        <button
          type="button"
          onClick={() => avatarRef.current?.click()}
          className={`relative h-24 w-24 overflow-hidden rounded-full transition-opacity hover:opacity-80 ${!preview ? avatarBg(username, first_name, userId) : ''}`}
        >
          {preview
            ? preview.startsWith('blob:')
              ? <img src={preview} alt="Avatar" className="h-full w-full object-cover" />
              : <Image src={preview} width={96} height={96} sizes="96px" className="object-cover" alt="Avatar" />
            : <span className="flex h-full w-full items-center justify-center text-4xl font-bold text-white">{inicial}</span>
          }
        </button>

        {isConverting && (
          <p className="text-xs text-blue-400">Convirtiendo foto...</p>
        )}

        {avatarError && (
          <p className="text-xs text-red-400">{avatarError}</p>
        )}

        {confirmar ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-zinc-300">¿Eliminás tu foto de perfil?</p>
            {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleEliminarConfirmado}
                disabled={deletePending}
                className="rounded-xl bg-red-500/15 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/25 disabled:opacity-50"
              >
                {deletePending ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
              <button
                type="button"
                onClick={() => { setConfirmar(false); setDeleteError(null) }}
                disabled={deletePending}
                className="rounded-xl border border-[#2a2a2a] px-4 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-600 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <button
              type="button"
              onClick={() => avatarRef.current?.click()}
              disabled={isConverting}
              className="rounded-xl bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-400 transition-colors hover:bg-blue-500/25 disabled:opacity-50"
            >
              Cambiar foto
            </button>
            <p className="text-xs text-zinc-600">JPG, PNG, HEIC o WEBP · máx. 10MB</p>
            {dbAvatarUrl && !isNewFile && (
              <button
                type="button"
                onClick={() => setConfirmar(true)}
                className="text-xs text-red-400 transition-colors hover:text-red-300"
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
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      {/* ── Información personal ── */}
      <SectionCard icon={<IconPerson />} iconCls="bg-blue-500/15 text-blue-400" title="Información personal">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">
              Nombre <span className="text-red-400">*</span>
            </label>
            <input
              name="first_name"
              defaultValue={first_name ?? ''}
              placeholder="Juan"
              required
              className={inputDark}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Apellido</label>
            <input
              name="last_name"
              defaultValue={last_name ?? ''}
              placeholder="Pérez"
              className={inputDark}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400">Username</label>
          <div className="flex items-center rounded-xl border border-[#2a2a2a] bg-[#111] px-4 py-2.5 transition-colors focus-within:border-zinc-500">
            <span className="mr-1 select-none text-sm text-zinc-600">@</span>
            <input
              name="username"
              defaultValue={username ?? ''}
              placeholder="tu_username"
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder-zinc-600"
            />
          </div>
          <p className="text-xs text-zinc-600">Solo letras minúsculas, números y _ · 3 a 30 caracteres</p>
        </div>
      </SectionCard>

      {/* ── Sobre vos ── */}
      <SectionCard icon={<IconDoc />} iconCls="bg-violet-500/15 text-violet-400" title="Sobre vos">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400">Titular profesional</label>
          <input
            name="headline"
            defaultValue={headline ?? ''}
            placeholder="Ej: Electricista matriculado · Freelance"
            className={inputDark}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400">Bio</label>
          <textarea
            name="bio"
            defaultValue={bio ?? ''}
            rows={4}
            placeholder="Contá quién sos, qué hacés, qué ofrecés..."
            className={`${inputDark} resize-none`}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400">Zona</label>
          <input
            name="location"
            defaultValue={location ?? ''}
            placeholder="Ej: Palermo, CABA"
            className={inputDark}
          />
        </div>
      </SectionCard>

      {/* ── Contacto ── */}
      <SectionCard icon={<IconPhone />} iconCls="bg-green-500/15 text-green-400" title="Contacto">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400">Teléfono</label>
          <input
            name="phone"
            defaultValue={phone ?? ''}
            placeholder="Ej: +54 11 1234-5678"
            className={inputDark}
          />
          <p className="text-xs text-zinc-600">Solo visible para vos. No se muestra públicamente.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400">Email de contacto</label>
          <input
            name="email"
            type="email"
            defaultValue={email ?? ''}
            placeholder="Ej: juan@ejemplo.com"
            className={inputDark}
          />
          <p className="text-xs text-zinc-600">Solo visible para vos. No se muestra públicamente.</p>
        </div>
      </SectionCard>

      {/* ── Error global ── */}
      {state.error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </p>
      )}

      {/* ── CTA ── */}
      <div className="rounded-2xl bg-gradient-to-b from-blue-600 to-blue-700 p-6 text-center md:p-8">
        <h2 className="text-xl font-bold text-white">¿Todo listo?</h2>
        <p className="mt-1 text-sm text-blue-100">Guardá los cambios para que sean visibles en tu perfil.</p>
        <button
          type="submit"
          disabled={saved || pending}
          className={`mt-5 w-full max-w-xs rounded-xl px-6 py-3 text-base font-bold transition-colors ${
            saved
              ? 'cursor-default bg-white/60 text-blue-600/60'
              : 'bg-white text-blue-600 hover:bg-blue-50 disabled:opacity-50'
          }`}
        >
          {pending ? 'Guardando...' : saved ? 'Guardado ✓' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
