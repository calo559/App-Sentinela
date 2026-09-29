// Notas e informes de avance cargados por los docentes (almacenamiento local).
//
//   Notas:     `${curso}|${materia}|c${cuatri}|${alumnoId}`  ->  4..10 | null
//   Informes:  `${curso}|c${cuatri}|${alumnoId}`             ->  { clasif, desc, autor, materia, fecha }
//
// alumnoId = correo del alumno (ej: alumno@escuela.edu).

import { getActiveUser } from './authService';

const NOTAS_KEY = 'sia_notas';
const INFORMES_KEY = 'sia_informes';

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
  return memNotas;
}

function loadInformes() {
  if (memInformes) return memInformes;
  const stored = read(INFORMES_KEY);
  memInformes = stored && typeof stored === 'object' ? stored : {};
  return memInformes;
}

const notaKey = (cursoDiv, materia, cuatri, alumnoId) =>
  `${cursoDiv}|${materia}|c${cuatri}|${alumnoId}`;

const informeKey = (cursoDiv, cuatri, alumnoId) => `${cursoDiv}|c${cuatri}|${alumnoId}`;

/* ------------------------------------------------------------------ NOTAS */

/** valor: número 4..10 o null (sin nota). */
export function setNota({ cursoDiv, materia, cuatri, alumnoId }, valor) {
  const notas = loadNotas();
  notas[notaKey(cursoDiv, materia, cuatri, alumnoId)] = valor;
  memNotas = notas;
  write(NOTAS_KEY, notas);
}

export function getNota({ cursoDiv, materia, cuatri, alumnoId }) {
  const notas = loadNotas();
  const k = notaKey(cursoDiv, materia, cuatri, alumnoId);
  return k in notas ? notas[k] : undefined; // undefined = nunca cargada
}

/** { [alumnoId]: nota } de una materia en un curso */
export function getNotasMateria({ cursoDiv, materia, cuatri }) {
  const notas = loadNotas();
  const prefijo = `${cursoDiv}|${materia}|c${cuatri}|`;
  const out = {};
  Object.keys(notas).forEach((k) => {
    if (k.startsWith(prefijo)) out[k.slice(prefijo.length)] = notas[k];
  });
  return out;
}

/** { [materia]: nota } de un alumno en un curso */
export function getNotasAlumno({ cursoDiv, cuatri, alumnoId }) {
  const notas = loadNotas();
  const sufijo = `|c${cuatri}|${alumnoId}`;
  const out = {};
  Object.keys(notas).forEach((k) => {
    if (k.startsWith(`${cursoDiv}|`) && k.endsWith(sufijo)) {
      const materia = k.slice(cursoDiv.length + 1, k.length - sufijo.length);
      out[materia] = notas[k];
    }
  });
  return out;
}

/* -------------------------------------------------------------- INFORMES */

/** data: { clasif: 'TED'|'TEP'|'TEA', desc, autor, materia, fecha } */
export function setInforme({ cursoDiv, cuatri, alumnoId }, data) {
  const informes = loadInformes();
  informes[informeKey(cursoDiv, cuatri, alumnoId)] = data;
  memInformes = informes;
  write(INFORMES_KEY, informes);
}

export function getInforme({ cursoDiv, cuatri, alumnoId }) {
  return loadInformes()[informeKey(cursoDiv, cuatri, alumnoId)] || null;
}

/** { [alumnoId]: informe } de todo un curso */
export function getInformesCurso({ cursoDiv, cuatri }) {
  const informes = loadInformes();
  const prefijo = `${cursoDiv}|c${cuatri}|`;
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
