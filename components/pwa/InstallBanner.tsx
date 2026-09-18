'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'install-banner-dismissed'
const DISMISS_DAYS = 14

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    if (!raw) return false
    const ts = parseInt(raw, 10)
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000
  } catch {
    return false
  }
}

export default function InstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // No mostrar si ya está instalada como PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if (isDismissed()) return

    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setPrompt(null))

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  if (!prompt) return null

  function dismiss() {
    try { localStorage.setItem(DISMISSED_KEY, String(Date.now())) } catch {}
    setPrompt(null)
  }

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setPrompt(null)
    else dismiss()
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 px-4 md:bottom-6">
      <div className="mx-auto max-w-sm rounded-2xl border border-[#2a2a2a] bg-[#171717] p-4 shadow-xl">
        <p className="mb-3 text-sm text-zinc-300">
          Instalá Labu en tu celular para acceder más rápido y recibir notificaciones.
        </p>
        <div className="flex gap-2">
          <button
            onClick={install}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Instalar
          </button>
          <button
            onClick={dismiss}
            className="flex-1 rounded-xl border border-[#2a2a2a] px-4 py-2 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  )
}
