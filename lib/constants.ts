
export const TIPOS_ACTIVIDAD = [
  'nueva_postulacion',
  'postulacion_aceptada',
  'postulacion_rechazada',
  'trabajo_completado',
  'recordatorio_calificacion',
] as const

export const MODALIDADES = [
  { value: 'inmediato', label: 'Inmediato' },
  { value: 'temporal',     label: 'Temporal' },
  { value: 'por_proyecto', label: 'Por proyecto' },
  { value: 'permanente',   label: 'Permanente' },
] as const

export const PRICE_TYPES = [
  { value: 'hora',    label: 'por hora' },
  { value: 'dia',     label: 'por día' },
  { value: 'semana',  label: 'por semana' },
  { value: 'mes',     label: 'por mes' },
  { value: 'trabajo', label: 'por proyecto' },
] as const
