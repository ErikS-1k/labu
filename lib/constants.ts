
export const TIPOS_ACTIVIDAD = [
  'nueva_postulacion',
  'postulacion_aceptada',
  'postulacion_rechazada',
  'trabajo_completado',
  'recordatorio_calificacion',
] as const

export const MODALIDADES = [
  { value: 'inmediato',    label: 'Inmediato',    desc: 'Puede comenzar de inmediato.' },
  { value: 'temporal',     label: 'Temporal',     desc: 'Tiene una duración acotada en el tiempo (días o semanas).' },
  { value: 'por_proyecto', label: 'Por proyecto', desc: 'Dura hasta completar un proyecto específico.' },
  { value: 'permanente',   label: 'Permanente',   desc: 'Es continuo, sin fecha de fin.' },
] as const

export const PRICE_TYPES = [
  { value: 'hora',    label: 'por hora' },
  { value: 'dia',     label: 'por día' },
  { value: 'semana',  label: 'por semana' },
  { value: 'mes',     label: 'por mes' },
  { value: 'trabajo', label: 'por proyecto' },
] as const
