export function showToast(message: string, type: 'success' | 'error' | 'warning' = 'success') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('labu:toast', { detail: { message, type } }))
  }
}
