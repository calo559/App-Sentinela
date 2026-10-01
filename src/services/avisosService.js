// Avisos y eventos que publican docentes y preceptores (almacenamiento local).
// Los alumnos solo leen: aparecen como notificaciones en la sección Events.
//
//   Docente .... Evaluación · Exposición · Trabajo Práctico (con nota)
//   Preceptor .. Evento/Acto · Paro de docentes · Feriado · Ausencia de docente

import { getActiveUser } from './authService';
import { fechaHoy } from './attendanceService';

const KEY = 'sia_avisos';

const hasStorage = () => typeof window !== 'undefined' && !!window.localStorage;

function read() {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(data) {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // sin storage seguimos en memoria
  }
}

let mem = null;

function load() {
  if (Array.isArray(mem)) return mem;
  const stored = read();
  mem = Array.isArray(stored) ? stored : [];
  return mem;
}

/** Tipos de aviso disponibles, con quién puede publicarlos. */
export const TIPOS_AVISO = {
  evaluacion: {
    label: 'Evaluación',
    icon: '📝',
    color: 'warning',
    roles: ['docente'],
    fechaLabel: 'Fecha de la evaluación',
    hint: 'Ej: Parcial de Matemática',
  },
  exposicion: {
    label: 'Exposición',
    icon: '🎤',
    color: 'info',
    roles: ['docente'],
    fechaLabel: 'Fecha de la exposición',
    hint: 'Ej: Exposición del Proyecto Final',
  },
  tp: {
    label: 'Trabajo Práctico',
    icon: '📚',
    color: 'violet',
    roles: ['docente'],
    fechaLabel: 'Fecha de entrega',
    hint: 'Ej: TP Integrador de Redes',
    conNota: true,
  },
  evento: {
    label: 'Evento / Acto',
    icon: '🎉',
    color: 'primary',
    roles: ['preceptor'],
    fechaLabel: 'Fecha del evento',
    hint: 'Ej: Acto del 20 de junio',
  },
  paro: {
    label: 'Paro de docentes',
    icon: '✊',
    color: 'error',
    roles: ['preceptor'],
    fechaLabel: 'Fecha del paro',
    hint: 'Ej: Paro de docentes — no hay clases',
  },
  feriado: {
    label: 'Feriado',
    icon: '🏖️',
    color: 'success',
    roles: ['preceptor'],
    fechaLabel: 'Fecha del feriado',
    hint: 'Ej: Feriado — sin clases',
  },
  ausencia: {
    label: 'Ausencia de docente',
    icon: '🚫',
    color: 'warning',
    roles: ['preceptor'],
    fechaLabel: 'Fecha de la ausencia',
    hint: 'Ej: Ausencia de Carlos Acuña',
  },
};

/** Tipos que un rol puede publicar: [{ key, label, icon, color, ... }] */
export function tiposPara(rol) {
  return Object.entries(TIPOS_AVISO)
    .filter(([, cfg]) => cfg.roles.includes(rol))
    .map(([key, cfg]) => ({ key, ...cfg }));
}

/** '2026-10-15' → true (fecha real del calendario) */
function fechaValida(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha || ''))) return false;
  const [y, m, d] = fecha.split('-').map(Number);
  const probe = new Date(y, m - 1, d);
  return probe.getFullYear() === y && probe.getMonth() === m - 1 && probe.getDate() === d;
}

/**
 * Publica un aviso. Solo docentes y preceptores, y cada uno con sus tipos.
 * Devuelve { ok: true, aviso } o { ok: false, error }.
 */
export function crearAviso({ tipo, titulo, fecha, nota, detalle }, autor = getActiveUser()) {
  const rol = autor?.role;
  if (rol !== 'docente' && rol !== 'preceptor') {
    return { ok: false, error: 'Solo docentes y preceptores pueden publicar avisos' };
  }
  const cfg = TIPOS_AVISO[tipo];
  if (!cfg || !cfg.roles.includes(rol)) {
    return { ok: false, error: 'Ese tipo de aviso no te corresponde' };
  }
  const tit = String(titulo || '').trim();
  if (!tit) return { ok: false, error: 'Poné un título para el aviso' };
  if (!fechaValida(fecha)) return { ok: false, error: 'Fecha inválida (ej: 15/10/2026)' };

  const aviso = {
    id: `aviso_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    tipo,
    titulo: tit,
    fecha,
    nota: cfg.conNota ? String(nota || '').trim() : '',
    detalle: String(detalle || '').trim(),
    autor: [autor?.nombre, autor?.apellido].filter(Boolean).join(' ') || autor?.email || '',
    rol,
    creado: new Date().toISOString(),
  };
  const lista = load();
  lista.push(aviso);
  mem = lista;
  write(lista);
  return { ok: true, aviso };
}

/**
 * Todos los avisos, ordenados para el tablero:
 * próximos primero (fecha ascendente) y los pasados al final (descendente).
 */
export function listarAvisos() {
  const hoy = fechaHoy();
  const lista = load().slice();
  const proximos = lista
    .filter((a) => a.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const pasados = lista
    .filter((a) => a.fecha < hoy)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  return [...proximos, ...pasados];
}

/** Elimina un aviso. Solo docentes y preceptores (staff). */
export function borrarAviso(id, usuario = getActiveUser()) {
  const rol = usuario?.role;
  if (rol !== 'docente' && rol !== 'preceptor') return false;
  const lista = load();
  const idx = lista.findIndex((a) => a.id === id);
  if (idx < 0) return false;
  lista.splice(idx, 1);
  mem = lista;
  write(lista);
  return true;
}
