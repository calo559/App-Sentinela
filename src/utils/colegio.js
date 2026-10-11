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

import { DIVISIONES_POR_ANIO, divisionesDe, materiasDe } from './malla';

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

// ── Materias REALES de cada curso ───────────────────────────────────────────
// El registro del docente no ofrece las mismas 5 materias para los 26 cursos:
// muestra las materias que ese curso cursa según la malla (malla.materiasDe:
// ciclo común de 1° a 3°, Informática, Electromecánica y las de horario
// especial como 7°2). El docente de 4°2 declara "Programación I / Bases de
// Datos / Redes de Computadoras…", no "Programación" a secas.
//
// El `id` del chip es el CODIGO que viaja en la declaracion. Los cinco que ya
// existen en la base conservan su codigo —quien declara "Programación I" en
// 4°2 sigue apuntando a `materias/mat_4°2_prog`, que existe— y los demás se
// crearían con la misma convención (`materias/mat_4°2_bdatos`) cuando la
// institución confirme la asignación.
const CODIGOS_POR_MATERIA = {
  // Base (existen en la BD para los 26 cursos)
  'Programación I': 'PROG',
  'Programación II': 'PROG',
  'Matemática': 'MATE',
  'Matemática Superior': 'MATE',
  'Lengua y Literatura': 'LENG',
  'Física': 'FIS',
  'Química': 'QUIM',
  // Ciclo común (1° a 3°)
  'Historia': 'HIST',
  'Geografía': 'GEOG',
  'Ciencias Naturales': 'CNAT',
  'Inglés': 'INGLES',
  'Educación Física': 'EDFIS',
  'Artes': 'ARTES',
  // Informática
  'Bases de Datos': 'BDATOS',
  'Base de Datos': 'BDATOS',
  'Sistemas Operativos': 'SISOPS',
  'Redes de Computadoras': 'REDESC',
  'Redes y Seguridad': 'REDSEG',
  'Redes': 'REDES',
  'Ingeniería de Software': 'INGSOF',
  'Administración de BD': 'ADMIBD',
  'Emprendimiento Productivo': 'EMPREN',
  'Modelos y Sistemas': 'MODSIS',
  // Electromecánica
  'Mecánica General': 'MECGEN',
  'Dibujo Técnico': 'DIBTEC',
  'Electricidad y Electrónica': 'ELECTR',
  'Máquinas Eléctricas': 'MAQEL',
  'Termodinámica': 'TERMOD',
  'Electrónica Aplicada': 'ELECAPP',
  'Procesos de Manufactura': 'PROCMAN',
  'IMCR': 'IMCR',
  // Proyecto / prácticas (7° y horarios especiales)
  'Proyecto Final': 'PROYFIN',
  'PP': 'PP',
  'Pdisc': 'PDISC',
  'Evaluación de Proyecto': 'EVALPROY',
};

/** Nombre de la materia de la malla → codigo de la declaracion. */
export const codigoDeMateria = (nombre) => {
  const clave = String(nombre ?? '').trim();
  if (CODIGOS_POR_MATERIA[clave]) return CODIGOS_POR_MATERIA[clave];
  // Futuras materias: codigo determinístico y legible ("Bases II" → 'BASESII').
  return (
    clave
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase()
      .slice(0, 8) || 'MAT'
  );
};

/** Codigo → nombre para mostrar (PROG → "Programación", BDATOS → "Bases de Datos"). */
export const nombreDeMateria = (codigo) => {
  const base = MATERIAS_ESCOLARES.find((m) => m.id === codigo);
  if (base) return base.label;
  const entrada = Object.entries(CODIGOS_POR_MATERIA).find(([, cod]) => cod === codigo);
  return entrada ? entrada[0] : codigo;
};

/**
 * Chips de las materias que cursa UN curso, con sus nombres reales:
 * materiasOpcionesDe('4°2') → [{ id: 'PROG', label: 'Programación I' }, …].
 */
export const materiasOpcionesDe = (cursoId) => {
  const curso = CURSOS_ESCOLARES.find((c) => c.id === cursoId);
  if (!curso) return [];
  const vistos = new Set();
  const opciones = [];
  // malla.materiasDe recibe el AÑO ("4°") y la división ("2"), no el id "4°2".
  materiasDe(`${curso.anio}°`, curso.division).forEach((nombre) => {
    const id = codigoDeMateria(nombre);
    if (vistos.has(id)) return;
    vistos.add(id);
    opciones.push({ id, label: nombre });
  });
  return opciones;
};

/** '4°2' → '4° 2' (y si el id no esta en la lista, devuelve el id tal cual). */
export const etiquetaCursoId = (cursoId) =>
  CURSOS_ESCOLARES.find((curso) => curso.id === cursoId)?.label ?? String(cursoId ?? '');
