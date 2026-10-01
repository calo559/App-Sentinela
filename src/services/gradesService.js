// Notas e informes de avance cargados por los docentes (almacenamiento local).
//
//   Notas:     `${curso}|${materia}|c${cuatri}|${tipo}|${alumnoId}`  ->  1..10 | null
//              tipo: 'tp' (trabajos prácticos) | 'ev' (evaluaciones) | 'ex' (exposiciones)
//   Informes:  `${curso}|c${cuatri}|${materia}|${alumnoId}`          ->  { clasif, desc, autor, materia, fecha }
//
// alumnoId = correo del alumno (ej: alumno@escuela.edu).
// Los formatos viejos (notas sin tipo, informes sin materia) se migran al cargar,
// así lo que ya se cargó sigue visible.

import { getActiveUser } from './authService';

const NOTAS_KEY = 'sia_notas';
const INFORMES_KEY = 'sia_informes';

const TIPOS = ['tp', 'ev', 'ex'];

const hasStorage = () => typeof window !== 'undefined' && !!window.localStorage;

function read(key) {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, value) {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sin storage seguimos en memoria
  }
}

let memNotas = null;
let memInformes = null;

function loadNotas() {
  if (memNotas) return memNotas;
  const stored = read(NOTAS_KEY);
  memNotas = stored && typeof stored === 'object' ? stored : {};
  // Migración: claves viejas sin tipo `${curso}|${materia}|c${cuatri}|${alumno}`
  // pasan a Evaluaciones (así lo cargado antes no se pierde).
  let migro = false;
  Object.keys(memNotas).forEach((k) => {
    const p = k.split('|');
    if (p.length === 4) {
      const nueva = `${p[0]}|${p[1]}|${p[2]}|ev|${p[3]}`;
      if (!(nueva in memNotas)) memNotas[nueva] = memNotas[k];
      delete memNotas[k];
      migro = true;
    }
  });
  if (migro) write(NOTAS_KEY, memNotas);
  return memNotas;
}

function loadInformes() {
  if (memInformes) return memInformes;
  const stored = read(INFORMES_KEY);
  memInformes = stored && typeof stored === 'object' ? stored : {};
  // Migración: claves viejas sin materia `${curso}|c${cuatri}|${alumno}`
  // se rearmán con la materia que tenía guardada el informe.
  let migro = false;
  Object.keys(memInformes).forEach((k) => {
    const p = k.split('|');
    if (p.length === 3) {
      const data = memInformes[k] || {};
      const materia = data.materia || 'General';
      const nueva = `${p[0]}|${p[1]}|${materia}|${p[2]}`;
      if (!(nueva in memInformes)) memInformes[nueva] = data;
      delete memInformes[k];
      migro = true;
    }
  });
  if (migro) write(INFORMES_KEY, memInformes);
  return memInformes;
}

const notaKey = (cursoDiv, materia, cuatri, tipo, alumnoId) =>
  `${cursoDiv}|${materia}|c${cuatri}|${tipo}|${alumnoId}`;

const informeKey = (cursoDiv, cuatri, materia, alumnoId) =>
  `${cursoDiv}|c${cuatri}|${materia}|${alumnoId}`;

/* ------------------------------------------------------------------ NOTAS */

/** valor: número 1..10 o null (sin nota). tipo: 'tp' | 'ev' | 'ex'. */
export function setNota({ cursoDiv, materia, cuatri, alumnoId, tipo }, valor) {
  const notas = loadNotas();
  notas[notaKey(cursoDiv, materia, cuatri, tipo, alumnoId)] = valor;
  memNotas = notas;
  write(NOTAS_KEY, notas);
}

export function getNota({ cursoDiv, materia, cuatri, tipo, alumnoId }) {
  const notas = loadNotas();
  const k = notaKey(cursoDiv, materia, cuatri, tipo, alumnoId);
  return k in notas ? notas[k] : undefined; // undefined = nunca cargada
}

/** { [alumnoId]: { tp, ev, ex } } de una materia en un curso */
export function getNotasMateria({ cursoDiv, materia, cuatri }) {
  const notas = loadNotas();
  const prefijo = `${cursoDiv}|${materia}|c${cuatri}|`;
  const out = {};
  Object.keys(notas).forEach((k) => {
    if (!k.startsWith(prefijo)) return;
    const [tipo, alumnoId] = k.slice(prefijo.length).split('|');
    if (!TIPOS.includes(tipo) || !alumnoId) return;
    out[alumnoId] = { ...(out[alumnoId] || {}), [tipo]: notas[k] };
  });
  return out;
}

/** { [materia]: { tp, ev, ex } } de un alumno en un curso */
export function getNotasAlumno({ cursoDiv, cuatri, alumnoId }) {
  const notas = loadNotas();
  const out = {};
  Object.keys(notas).forEach((k) => {
    if (!k.startsWith(`${cursoDiv}|`)) return;
    // [materia, c#, tipo, alumno]
    const partes = k.slice(cursoDiv.length + 1).split('|');
    if (partes.length !== 4) return;
    const [materia, cu, tipo, id] = partes;
    if (cu !== `c${cuatri}` || id !== alumnoId || !TIPOS.includes(tipo)) return;
    out[materia] = { ...(out[materia] || {}), [tipo]: notas[k] };
  });
  return out;
}

/* -------------------------------------------------------------- INFORMES */

/** data: { clasif: 'TED'|'TEP'|'TEA', desc, autor, materia, fecha } */
export function setInforme({ cursoDiv, cuatri, materia, alumnoId }, data) {
  const informes = loadInformes();
  informes[informeKey(cursoDiv, cuatri, materia, alumnoId)] = data;
  memInformes = informes;
  write(INFORMES_KEY, informes);
}

export function getInforme({ cursoDiv, cuatri, materia, alumnoId }) {
  return loadInformes()[informeKey(cursoDiv, cuatri, materia, alumnoId)] || null;
}

/** { [materia]: informe } de un alumno en un curso (lo ve el alumno) */
export function getInformesAlumno({ cursoDiv, cuatri, alumnoId }) {
  const informes = loadInformes();
  const out = {};
  Object.keys(informes).forEach((k) => {
    const partes = k.split('|'); // [curso, c#, materia, alumno]
    if (partes.length !== 4) return;
    const [cur, cu, materia, id] = partes;
    if (cur !== cursoDiv || cu !== `c${cuatri}` || id !== alumnoId) return;
    out[materia] = informes[k];
  });
  return out;
}

/** { [alumnoId]: informe } de UNA materia de todo el curso (lo ve el docente) */
export function getInformesMateria({ cursoDiv, cuatri, materia }) {
  const informes = loadInformes();
  const prefijo = `${cursoDiv}|c${cuatri}|${materia}|`;
  const out = {};
  Object.keys(informes).forEach((k) => {
    if (k.startsWith(prefijo)) out[k.slice(prefijo.length)] = informes[k];
  });
  return out;
}

/* --------------------------------------------------------------- ALUMNOS */

const CURSO_ALUMNOS = {
  '3°1': [
    { id: 'alumno@escuela.edu', nombre: 'Ana Alumna' },
    { id: '40111222', nombre: 'Juan Pérez' },
    { id: '40111333', nombre: 'María López' },
    { id: '40111444', nombre: 'Carlos Gómez' },
    { id: '40111555', nombre: 'Ana Martínez' },
  ],
  '4°2': [
    { id: '40222111', nombre: 'Pedro Gómez' },
    { id: '40222222', nombre: 'Rocío Mena' },
    { id: '40222333', nombre: 'Bruno Díaz' },
    { id: '40222444', nombre: 'Camila Reyes' },
  ],
  '5°3': [
    { id: '40333111', nombre: 'Rocío Mena' },
    { id: '40333222', nombre: 'Iván Castillo' },
    { id: '40333333', nombre: 'Paula Ortega' },
  ],
};

const POOL = [
  'Lucía Fernández', 'Martín Suárez', 'Sofía Ríos', 'Benjamín Lara',
  'Valentina Paz', 'Thiago Roca', 'Emilia Vera', 'Joaquín Núñez',
];

/** Alumnos de un curso (demo). El usuario activo siempre aparece primero. */
export function alumnosDeCurso(cursoDiv) {
  const base = CURSO_ALUMNOS[cursoDiv]
    ? CURSO_ALUMNOS[cursoDiv].slice()
    : POOL.slice(0, 5).map((nombre, i) => ({ id: `${cursoDiv}-${i}`, nombre }));

  const activo = getActiveUser();
  const cursoActivo =
    activo?.curso && activo?.division ? `${activo.curso}${activo.division}` : null;

  if (activo?.email && cursoActivo === cursoDiv && !base.some((a) => a.id === activo.email)) {
    base.unshift({
      id: activo.email,
      nombre: [activo.nombre, activo.apellido].filter(Boolean).join(' ') || 'Tú',
      propio: true,
    });
  }
  return base;
}
