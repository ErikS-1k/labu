'use client'

import { useState } from 'react'
import LoginPromptModal from '@/components/auth/LoginPromptModal'

export default function GuestPublishButtons() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="mb-8 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-2 rounded-xl border border-blue-800/40 bg-blue-500/10 px-4 py-5 text-center transition-colors hover:bg-blue-500/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          <span className="text-sm font-semibold text-blue-300">Publicar mi servicio</span>
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex flex-col items-center gap-2 rounded-xl border border-blue-800/40 bg-blue-500/10 px-4 py-5 text-center transition-colors hover:bg-blue-500/20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span className="text-sm font-semibold text-blue-300">Publicar una búsqueda</span>
        </button>
      </div>
      <LoginPromptModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
