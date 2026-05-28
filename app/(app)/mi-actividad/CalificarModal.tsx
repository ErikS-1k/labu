'use client'

import { useState } from 'react'
import RatingForm from '@/components/ratings/RatingForm'

type Props = {
  postId: string
  toUserId: string
  toUserName: string
}

export default function CalificarModal({ postId, toUserId, toUserName }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
      >
        Calificar
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-surface-2 bg-surface-0 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">Calificar trabajo</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-400 transition-colors hover:text-white"
              >
                ✕
              </button>
            </div>
            <RatingForm postId={postId} toUserId={toUserId} toUserName={toUserName} />
          </div>
        </div>
      )}
    </>
  )
}
