// Modo claro/oscuro. La preferencia vive en localStorage ("labu-theme") y se aplica como
// clase "light" en <html>; los estilos (app/tema-claro.css) solo afectan a la app logueada.
export type Tema = 'light' | 'dark'
export const CLAVE_TEMA = 'labu-theme'

export function temaActual(): Tema {
  return document.documentElement.classList.contains('light') ? 'light' : 'dark'
}

export function aplicarTema(tema: Tema) {
  document.documentElement.classList.toggle('light', tema === 'light')
  try { localStorage.setItem(CLAVE_TEMA, tema) } catch { /* modo privado: solo dura la sesión */ }
}

// Corre en <head> antes de pintar la página: evita el parpadeo oscuro → claro al cargar
export const SCRIPT_TEMA = `try{if(localStorage.getItem('${CLAVE_TEMA}')==='light')document.documentElement.classList.add('light')}catch(e){}`
