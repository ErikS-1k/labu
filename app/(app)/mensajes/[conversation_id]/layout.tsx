// Overlay fullscreen: tapa sidebar, BottomNav y botón flotante (z-50) pero deja pasar los toasts (z-[100])
export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[90] flex flex-col overflow-hidden bg-[#0a0a0a]">
      {children}
    </div>
  )
}
