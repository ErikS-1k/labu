const AVATAR_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-400',
  'bg-lime-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-blue-600',
  'bg-violet-500',
  'bg-fuchsia-500',
  'bg-pink-500',
]

export function avatarBg(...seeds: (string | null | undefined)[]): string {
  const seed = seeds.find(s => s != null && s.trim() !== '')
  if (!seed) return 'bg-zinc-500'
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}
