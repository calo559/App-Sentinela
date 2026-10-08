// Cursos y materias REALES de la tecnica (secundaria tecnica, turno mixto).
//
// Estructura de la institucion (año → divisiones):
//   ciclo basico (1°-3°): 5 divisiones por año   → 1°1..1°5, 2°1..2°5, 3°1..3°5
//   ciclo superior:
//     4° → 4 divisiones (4°1..4°4) · 5° → 3 (5°1..5°3)
//     6° → 2 (6°1..6°2)          · 7° → 2 (7°1..7°2)
//   = 26 cursos en total.
//
// La estructura año→divisiones vive en malla.DIVISIONES_POR_ANIO (fuente
// única, la misma que usan el Boletín y el selector de cursos); este módulo
// la convierte en la lista de cursos que consume el registro.
//
// El id de curso es "4°2" (año + ° + división): EXACTAMENTE el formato que
// ya usan horarios.js (HORARIO_DIAS_CURSOS['7°2']), malla.etiquetaCurso()
// y el QR dinámico — por eso `myCourse = curso + division` del perfil
// coincide con las claves del horario sin traducciones.
//
// El registro (alumno/docente/preceptor) usa esta lista porque:
//  · las reglas exigen que el cursoId del alumno exista en `cursos/`
//    (chequeo exists()) — un id inventado rechaza la alta;
//  · las declaraciones del docente se confirman despues contra
//    `materias/{mat_<cursoId>_<codigo>}`, que sigue esta misma convencion.
//
// Si la escuela agrega cursos o materias, hay que actualizar el seed de
// Backend-Sentinel Y esta lista (fase: pasar a leer de la nube).

import { DIVISIONES_POR_ANIO, divisionesDe } from './malla';

export { DIVISIONES_POR_ANIO, divisionesDe };

export const ANIOS_ESCOLARES = ['1', '2', '3', '4', '5', '6', '7'];

export const ANIOS_OPCIONES = ANIOS_ESCOLARES.map((anio) => ({
  id: anio,
  label: `${anio}°`,
}));

/** 26 cursos: { id: '4°2', label: '4° 2', anio: '4', division: '2', ciclo } */
export const CURSOS_ESCOLARES = ANIOS_ESCOLARES.flatMap((anio) =>
  divisionesDe(anio).map((division) => ({
    id: `${anio}°${division}`,
    label: `${anio}° ${division}`,
    anio,
    division,
    ciclo: Number(anio) <= 3 ? 'basico' : 'superior',
  }))
);

/** [{ id: '4°2', label: '4° 2' }, ...] para los chips. */
export const CURSOS_OPCIONES = CURSOS_ESCOLARES.map(({ id, label }) => ({ id, label }));

/** Divisiones de un año → chips [{ id: '1', label: '1' }, ...]. */
export const divisionesOpciones = (anio) =>
  divisionesDe(anio).map((division) => ({ id: division, label: division }));

// Materias que se dictan en TODOS los cursos (MATERIAS_BASE del seed).
// El `id` es el codigo: es lo que se guarda en la declaracion y con lo que
// el script de confirmacion arma el id real `mat_4°2_prog`.
export const MATERIAS_ESCOLARES = [
  { id: 'PROG', label: 'Programación' },
  { id: 'MATE', label: 'Matemática' },
  { id: 'LENG', label: 'Lengua y Literatura' },
  { id: 'FIS', label: 'Física' },
  { id: 'QUIM', label: 'Química' },
];

/** '4°2' → '4° 2' (y si el id no esta en la lista, devuelve el id tal cual). */
export const etiquetaCursoId = (cursoId) =>
  CURSOS_ESCOLARES.find((curso) => curso.id === cursoId)?.label ?? String(cursoId ?? '');
