'use client'

export default function StickyContactCta({ label }: { label: string }) {
  function handleClick() {
    document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div
      className="fixed left-4 right-4 z-40 lg:hidden"
      style={{ bottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)' }}
    >
      <button
        type="button"
        onClick={handleClick}
        className="w-full rounded-xl bg-blue-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/40 transition-colors hover:bg-blue-600"
      >
        {label}
      </button>
    </div>
  )
}
