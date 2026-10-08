// Malla curricular del Boletín Virtual.
//
// Regla de especialidades (según año y división con la que se registra el alumno):
//   1° a 3° .... ciclo común (todas las divisiones dan las mismas materias)
//   4° ......... 4°2 = Informática · 4°1 y 4°3 = Electromecánica
//   5° ........ los de Informática se juntan y quedan en 5°2;
//               los de Electromecánica conservan su división (5°1 y 5°3)
//   6° ........ los de Electromecánica se juntan en 6°1; Informática sigue en 6°2
//   7° ........ conservan la misma división (7°1 Electromecánica · 7°2 Informática)

import { HORARIO_DIAS_CURSOS } from '../qr/horarios';

// Días cortos para mostrar horarios en el boletín (0=Dom … 6=Sáb)
const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Bloques con horario especial del curso (vacío si el curso no tiene). */
function bloquesEspeciales(curso, division) {
  const porDia = HORARIO_DIAS_CURSOS[etiquetaCurso(curso, division)];
  if (!porDia) return [];
  return Object.entries(porDia).flatMap(([dia, bloques]) =>
    bloques.map((b) => ({ dia: Number(dia), ...b }))
  );
}

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

/**
 * Materias que se cursan en ese curso/división.
 * Si el curso tiene horario especial (ej.: 7°2, turno de tarde), la malla es
 * la que surge de sus bloques de HORARIO_DIAS_CURSOS (fuente única de datos).
 */
export function materiasDe(curso, division) {
  const especiales = bloquesEspeciales(curso, division);
  if (especiales.length) {
    const vistas = new Set();
    const lista = [];
    for (const b of especiales) {
      if (!vistas.has(b.materia)) {
        vistas.add(b.materia);
        lista.push(b.materia);
      }
    }
    return lista;
  }
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

/**
 * Detalle de una materia para el boletín: docente y horario.
 * Solo tiene datos en cursos con horario especial (ej.: 7°2); si no, null.
 * Ej.: { docente: 'Carlos Acuña', horario: 'Lun 13:30–17:30 · Mar 18:30–20:30' }
 */
export function detalleMateria(curso, division, materia) {
  const bloques = bloquesEspeciales(curso, division).filter(
    (b) => b.materia === materia
  );
  if (!bloques.length) return null;
  const docentes = [...new Set(bloques.map((b) => b.docente).filter(Boolean))];
  return {
    docente: docentes.join(' / '),
    horario: bloques
      .map((b) => `${DIAS_CORTOS[b.dia]} ${b.inicio}–${b.fin}`)
      .join(' · '),
  };
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
  const set = new Set();
  divisionesDe(base).forEach((d) => materiasDe(curso, d).forEach((m) => set.add(m)));
  return [...set];
}

/**
 * Divisiones que EXISTEN en cada año. Lo que no existe no se puede elegir:
 * 7° solo tiene 7°1 (Electromecánica) y 7°2 (Informática).
 * 1° a 3°: ciclo común, todas las divisiones dan lo mismo.
 */
export const DIVISIONES_POR_ANIO = {
  '1°': ['1', '2', '3', '4', '5'],
  '2°': ['1', '2', '3', '4', '5'],
  '3°': ['1', '2', '3', '4', '5'],
  '4°': ['1', '2', '3', '4'],
  '5°': ['1', '2', '3'],
  '6°': ['1', '2'],
  '7°': ['1', '2'],
};

/** Divisiones de un año ("7°" o "7" → ['1','2']); sin año, las estándar. */
export function divisionesDe(anio) {
  const base = String(anio ?? '').replace(/[^\d]/g, '');
  const clave = base ? `${base}°` : '';
  return DIVISIONES_POR_ANIO[clave] || ['1', '2', '3', '4', '5'];
}

// Informe de avance: tres opciones que el docente selecciona por alumno.
// `rango` es SOLO para el docente (cargar con criterio): el alumno nunca lo ve,
// en su pantalla aparece la sigla y el desc, jamás la nota equivalente.
export const INFORME_OPCIONES = [
  { key: 'TED', label: 'TED', desc: 'En desarrollo', rango: '1 a 4', color: '#FBBF24' },
  { key: 'TEP', label: 'TEP', desc: 'En proceso', rango: '4 a 6', color: '#38BDF8' },
  { key: 'TEA', label: 'TEA', desc: 'Excelente avance', rango: '7 a 10', color: '#A78BFA' },
];

export const CUATRIMESTRES = [
  { key: 1, label: '1er Cuatrimestre', periodo: 'Marzo – Julio' },
  { key: 2, label: '2do Cuatrimestre', periodo: 'Agosto – Diciembre' },
];

// Cada materia se carga en tres tipos de evaluación (el boletín los muestra por separado)
export const TIPOS_NOTA = [
  { key: 'tp', label: 'Trabajos prácticos', corto: 'TP' },
  { key: 'ev', label: 'Evaluaciones', corto: 'Eval' },
  { key: 'ex', label: 'Exposiciones', corto: 'Exp' },
];

/** Promedio (1 decimal) de los tipos cargados; null si no hay ninguno. */
export function promedioDe(componentes) {
  const vals = TIPOS_NOTA.map((t) => componentes?.[t.key]).filter((v) => v != null);
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

// Notas determinísticas (mismo alumno + materia + cuatrimestre = siempre igual)
function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h;
}

// Escala ponderada: la mayoría aprueba, algunas materias quedan bajas
const POOL = [6, 7, 7, 8, 8, 8, 9, 9, 10, 7, 6, 8, 5, 9, 4, 7, 8, 6];

/**
 * Notas de cada materia para un cuatrimestre (datos demo, determinísticos).
 * Devuelve [{ materia, nota (promedio 1 decimal | null), estado, componentes: {tp, ev, ex} | null }]
 * Las que cargan los docentes reemplazan a estas (ver gradesService).
 */
export function notasDe(semilla, materias, cuatrimestre) {
  return materias.map((materia) => {
    const base = `${semilla}|${materia}|c${cuatrimestre}`;
    const pendiente = cuatrimestre === 2 && hash(base) % 13 === 0;
    const componentes = pendiente
      ? null
      : {
          tp: POOL[hash(`${base}|tp`) % POOL.length],
          ev: POOL[hash(`${base}|ev`) % POOL.length],
          ex: POOL[hash(`${base}|ex`) % POOL.length],
        };
    const nota = componentes ? promedioDe(componentes) : null;
    const estado = nota == null ? 'pendiente' : nota >= 6 ? 'aprobada' : 'libre';
    return { materia, nota, estado, componentes };
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
