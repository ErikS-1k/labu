// Tipos y estados de reportes (los usan el formulario, la server action y el panel admin)
export const TIPOS_REPORTE = [
  { value: 'bug',        label: 'Bug' },
  { value: 'sugerencia', label: 'Sugerencia' },
  { value: 'otro',       label: 'Otro' },
] as const

export const ESTADOS_REPORTE = [
  { value: 'nuevo',       label: 'Nuevo' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'resuelto',    label: 'Resuelto' },
] as const

export const DESCRIPCION_MIN = 20
export const DESCRIPCION_MAX = 2000
