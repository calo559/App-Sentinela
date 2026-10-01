// Helpers de cursada para el Boletín.
//
// El plan de estudios NO vive acá: los cursos vienen de Firestore
// (`cursos`: { id, nombre, anio, division, orientacion, turno }) y las
// materias reales están en la colección `materias` (una por curso).
// Por eso no hay listas de años ni de materias hardcodeadas.
//
// Constantes del proyecto anterior (cursos "1°".."7°", divisiones "1".."5",
// especialidades Informática / Electromecánica) que ya NO aplican a este
// modelo y quedaron reemplazadas por los documentos de `cursos`:
//   const CURSOS_PLAN = ['1°', '2°', '3°', '4°', '5°', '6°', '7°'];
//   const DIVISIONES_PLAN = ['1', '2', '3', '4', '5'];
//   const ESPECIALIDADES_PLAN = ['Informatica', 'Electromecanica'];

import { GRADE_TYPES } from '../services/firestore';

export const ETIQUETAS_TIPO = {
  [GRADE_TYPES.EVALUACION]: 'Evaluación',
  [GRADE_TYPES.TRABAJO_PRACTICO]: 'Trabajo práctico',
  [GRADE_TYPES.EXAMEN]: 'Examen',
  [GRADE_TYPES.PARTICIPACION]: 'Participación',
};

/** Año numérico del curso ("3°", "3", 3 → 3). 0 si no se puede leer. */
export function anioDeCurso(anio) {
  const numero = Number(String(anio ?? '').replace(/[^\d]/g, ''));
  return Number.isFinite(numero) && numero > 0 ? numero : 0;
}

/** Etiqueta legible del curso: ("3", "A") → "3° A". Acepta el doc completo. */
export function etiquetaCurso(curso, division) {
  if (curso && typeof curso === 'object') return etiquetaCurso(curso.anio, curso.division);

  const anio = anioDeCurso(curso);
  const div = String(division ?? '').trim();

  if (!anio) return div || '—';
  return `${anio}°${div ? ` ${div}` : ''}`;
}

/** Orientación del curso tal como está en Firestore, o '' si no tiene. */
export function especialidadDe({ orientacion } = {}) {
  return String(orientacion ?? '').trim();
}

/** "Pérez, Juan" → "Juan Pérez". */
export function nombreCompleto(alumno) {
  if (!alumno) return 'Alumno';
  const nombre = String(alumno.nombre ?? '').trim();
  const apellido = String(alumno.apellido ?? '').trim();
  return [nombre, apellido].filter(Boolean).join(' ') || alumno.legajo || 'Alumno';
}

export function etiquetaTipoNota(tipo) {
  return ETIQUETAS_TIPO[tipo] ?? String(tipo ?? '');
}

/** Nota suelta con coma decimal, o "—" si no hay nota. */
export function notaTexto(nota) {
  if (nota === null || nota === undefined || nota === '') return '—';
  const numero = Number(nota);
  if (!Number.isFinite(numero)) return '—';
  return String(numero).replace('.', ',');
}

/** Promedio con un decimal y coma, o "—". */
export function promedioTexto(promedio) {
  if (promedio === null || promedio === undefined) return '—';
  const numero = Number(promedio);
  if (!Number.isFinite(numero)) return '—';
  return numero.toFixed(1).replace('.', ',');
}

/** Promedio simple de una lista de notas (ignora las que no tienen nota). */
export function promedioDe(notas = []) {
  const conNota = (notas ?? []).filter((item) => Number.isFinite(Number(item?.nota)));
  if (!conNota.length) return null;
  const suma = conNota.reduce((acc, item) => acc + Number(item.nota), 0);
  return suma / conNota.length;
}

/** Color de la nota según la escala 1-10. */
export function colorNota(nota, colors) {
  if (nota === null || nota === undefined || !Number.isFinite(Number(nota))) return colors.textSecondary;
  if (Number(nota) >= 7) return colors.success;
  if (Number(nota) >= 4) return colors.warning;
  return colors.error;
}