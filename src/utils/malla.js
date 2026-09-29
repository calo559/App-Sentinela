// Malla curricular del Boletín Virtual.
//
// Regla de especialidades (según año y división con la que se registra el alumno):
//   1° a 3° .... ciclo común (todas las divisiones dan las mismas materias)
//   4° ......... 4°2 = Informática · 4°1 y 4°3 = Electromecánica
//   5° ........ los de Informática se juntan y quedan en 5°2;
//               los de Electromecánica conservan su división (5°1 y 5°3)
//   6° ........ los de Electromecánica se juntan en 6°1; Informática sigue en 6°2
//   7° ........ conservan la misma división (7°1 Electromecánica · 7°2 Informática)

const COMUN = [
  'Lengua y Literatura',
  'Matemática',
  'Historia',
  'Geografía',
  'Ciencias Naturales',
  'Inglés',
  'Educación Física',
  'Artes',
];

const INFO_4 = [
  'Programación I',
  'Bases de Datos',
  'Sistemas Operativos',
  'Redes de Computadoras',
  'Matemática',
  'Física',
  'Inglés',
  'Educación Física',
];

const INFO_5_A_7 = [
  'Programación II',
  'Ingeniería de Software',
  'Redes y Seguridad',
  'Administración de BD',
  'Matemática Superior',
  'Física',
  'Inglés',
  'Educación Física',
];

const ELEC_4 = [
  'Mecánica General',
  'Dibujo Técnico',
  'Electricidad y Electrónica',
  'Química',
  'Matemática',
  'Física',
  'Inglés',
  'Educación Física',
];

const ELEC_5_A_7 = [
  'Máquinas Eléctricas',
  'Termodinámica',
  'Electrónica Aplicada',
  'Procesos de Manufactura',
  'Matemática Superior',
  'Física',
  'Inglés',
  'Educación Física',
];

export const ESPECIALIDADES = {
  informatica: { key: 'informatica', label: 'Informática', icon: 'monitor-dashboard' },
  electromecanica: { key: 'electromecanica', label: 'Electromecánica', icon: 'cog-outline' },
};

const yearOf = (curso) => Number(String(curso ?? '').replace(/[^\d]/g, '')) || 0;

/** Especialidad del curso ("4°2" → informática). null = ciclo común. */
export function especialidadDe(curso, division) {
  const anio = yearOf(curso);
  const div = String(division ?? '');
  if (anio >= 1 && anio <= 3) return null;
  if (anio === 4) return div === '2' ? 'informatica' : 'electromecanica';
  // 5°, 6° y 7°: la división 2 es Informática, el resto es Electromecánica
  if (anio >= 5 && anio <= 7) return div === '2' ? 'informatica' : 'electromecanica';
  return null;
}

/** Materias que se cursan en ese curso/división. */
export function materiasDe(curso, division) {
  const anio = yearOf(curso);
  const esp = especialidadDe(curso, division);
  let lista;
  if (anio >= 1 && anio <= 3) lista = COMUN;
  else if (esp === 'informatica') lista = anio === 4 ? INFO_4 : INFO_5_A_7;
  else if (esp === 'electromecanica') lista = anio === 4 ? ELEC_4 : ELEC_5_A_7;
  else lista = COMUN;

  // En 7° se agrega el Proyecto Final
  if (anio === 7) lista = [...lista, 'Proyecto Final'];
  return lista;
}

/** "3°1" */
export function etiquetaCurso(curso, division) {
  if (!curso) return '—';
  return `${curso}${division ?? ''}`;
}

/**
 * Materias que se dictan en un año (unión de todas sus divisiones).
 * Se usa en el registro de docentes: elige el año y después sus materias.
 */
export function materiasDelAnio(anio) {
  const base = String(anio ?? '').replace(/[^\d]/g, '');
  if (!base) return [];
  const curso = `${base}°`;
  const divisiones = Number(base) >= 4 ? ['1', '2', '3'] : ['1'];
  const set = new Set();
  divisiones.forEach((d) => materiasDe(curso, d).forEach((m) => set.add(m)));
  return [...set];
}

// Informe de avance: tres opciones que el docente selecciona por alumno
export const INFORME_OPCIONES = [
  { key: 'TED', label: 'TED', color: '#FBBF24' },
  { key: 'TEP', label: 'TEP', color: '#38BDF8' },
  { key: 'TEA', label: 'TEA', color: '#A78BFA' },
];

export const CUATRIMESTRES = [
  { key: 1, label: '1er Cuatrimestre', periodo: 'Marzo – Julio' },
  { key: 2, label: '2do Cuatrimestre', periodo: 'Agosto – Diciembre' },
];

// Notas determinísticas (mismo alumno + materia + cuatrimestre = siempre igual)
function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}

// Escala ponderada: la mayoría aprueba, algunas materias quedan bajas
const POOL = [6, 7, 7, 8, 8, 8, 9, 9, 10, 7, 6, 8, 5, 9, 4, 7, 8, 6];

/**
 * Notas de cada materia para un cuatrimestre.
 * Devuelve [{ materia, nota (4..10 | null), estado: 'aprobada'|'libre'|'pendiente' }]
 */
export function notasDe(semilla, materias, cuatrimestre) {
  return materias.map((materia) => {
    const h = hash(`${semilla}|${materia}|c${cuatrimestre}`);
    const pendiente = cuatrimestre === 2 && h % 13 === 0;
    const nota = pendiente ? null : POOL[h % POOL.length]; // 4 a 10
    const estado = pendiente ? 'pendiente' : nota >= 6 ? 'aprobada' : 'libre';
    return { materia, nota, estado };
  });
}

/** Resumen / informe de avance de un cuatrimestre. */
export function informeDe(rows) {
  const conNota = rows.filter((r) => r.nota != null);
  const promedio = conNota.length
    ? conNota.reduce((acc, r) => acc + r.nota, 0) / conNota.length
    : 0;
  const aprobadas = rows.filter((r) => r.estado === 'aprobada').length;
  const pendientes = rows.filter((r) => r.estado === 'pendiente').length;
  const libres = rows.filter((r) => r.estado === 'libre').length;
  const destacada = conNota.reduce(
    (best, r) => (best == null || r.nota > best.nota ? r : best),
    null
  );

  let texto;
  if (promedio >= 8.5) {
    texto =
      'Excelente desempeño. Se destaca la constancia y el dominio de los contenidos en todas las áreas. Se recomienda mantener el ritmo de estudio y participar de los proyectos extracurriculares.';
  } else if (promedio >= 6.5) {
    texto =
      'Buen rendimiento general durante el período. El estudiante avanza de forma estable; se sugiere reforzar las materias con nota inferior a 7 para sostener el promedio.';
  } else if (promedio >= 5) {
    texto =
      'Rendimiento regular. Es necesario profundizar el estudio en las materias libres y aprovechar las clases de apoyo. Con mayor dedicación se puede recuperar el nivel en el próximo período.';
  } else {
    texto =
      'Período crítico. Se recomienda reunión con la familia y seguimiento semanal de las materias pendientes para regularizar la situación académica.';
  }

  return {
    promedio: Math.round(promedio * 10) / 10,
    aprobadas,
    total: rows.length,
    pendientes,
    libres,
    destacada: destacada ? destacada.materia : null,
    texto,
  };
}

/** Color de la nota (paleta de la app). */
export function colorNota(nota) {
  if (nota == null) return '#8494AB';
  if (nota >= 8) return '#00C9DB';
  if (nota >= 6) return '#FBBF24';
  return '#F472B6';
}
