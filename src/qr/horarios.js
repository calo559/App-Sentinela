// src/qr/horarios.js — Jornada escolar (mañana) y reglas de horario por curso.
//
//   Ingreso ........... 07:20
//   1ª hora ........... 07:20 – 09:20
//   Recreo (20 min) ... 09:20 – 09:40
//   2ª hora ........... 09:40 – 11:40
//
// ⚠️ EDITÁ los datos de este archivo si los horarios de la escuela cambian.

export const PERIODOS = [
  { id: 'P1', nombre: 'Primera hora', inicio: '07:20', fin: '09:20' },
  { id: 'REC', nombre: 'Recreo', inicio: '09:20', fin: '09:40', recreo: true },
  { id: 'P2', nombre: 'Segunda hora', inicio: '09:40', fin: '11:40' },
];

// Tolerancia para escanear alrededor del período (llegada temprana / salida ajustada), en minutos.
export const MARGEN_INICIO_MIN = 10;
export const MARGEN_FIN_MIN = 10;

// Días con clase (0 = domingo … 6 = sábado)
export const DIAS_CLASE = [1, 2, 3, 4, 5];

// ⚠️ SOLO PARA PRUEBAS: true = se omite la validación de días y horarios
// (sirve para probar el flujo completo fuera del horario escolar).
// Dejar en false en uso real: es parte de la seguridad del QR dinámico.
export const MODO_PRUEBA = false;

// Horario exacto por curso → lista de ids de PERIODOS (sin recreo).
// Los cursos que no estén en esta lista usan REGLA_POR_DEFECTO de abajo.
export const HORARIO_CURSOS = {
  // '3°1': ['P1'],          // ej.: cursa solo la primera hora
  // '4°2': ['P2'],          // ej.: cursa solo la segunda hora
  // '5°1': ['P1', 'P2'],    // ej.: cursa las dos horas
};

// Regla por defecto para cursos no listados en HORARIO_CURSOS:
//   1° a 3° (ciclo común) → 1ª hora · 4° a 7° → 2ª hora
// El curso viene como etiqueta '3°1' → el año es lo que va antes de '°'.
export function reglaPorDefecto(curso) {
  const anio = Number(String(curso ?? '').split('°')[0].replace(/[^\d]/g, '')) || 0;
  if (!anio) return [];
  return anio <= 3 ? ['P1'] : ['P2'];
}

export function horarioDeCurso(curso) {
  const propio = HORARIO_CURSOS[curso];
  return Array.isArray(propio) && propio.length ? propio : reglaPorDefecto(curso);
}

/** Períodos de clase (sin recreo) de un curso, en orden. */
export function periodosDeCurso(curso) {
  return horarioDeCurso(curso)
    .map((id) => PERIODOS.find((p) => p.id === id))
    .filter((p) => p && !p.recreo);
}

/** '07:20' → 440 */
export function aMinutos(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Minutos desde medianoche de una fecha. */
export function minutosDeFecha(date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function esDiaClase(date = new Date()) {
  return DIAS_CLASE.includes(date.getDay());
}

/** Período exacto en el que está ahora (incluye recreo), o null si es fuera de horario. */
export function periodoActual(date = new Date()) {
  const m = minutosDeFecha(date);
  return PERIODOS.find((p) => m >= aMinutos(p.inicio) && m < aMinutos(p.fin)) || null;
}

/**
 * Período de clase de un curso en el que se encuentra ahora (con márgenes), o null.
 * Ej.: a las 07:12 el curso de la 1ª hora ya puede escanear (10 min de margen).
 */
export function periodoDeCursoAhora(curso, date = new Date()) {
  if (!esDiaClase(date)) return null;
  const m = minutosDeFecha(date);
  return (
    periodosDeCurso(curso).find(
      (p) =>
        m >= aMinutos(p.inicio) - MARGEN_INICIO_MIN &&
        m <= aMinutos(p.fin) + MARGEN_FIN_MIN
    ) || null
  );
}

export function cursoEnClaseAhora(curso, date = new Date()) {
  return !!periodoDeCursoAhora(curso, date);
}

/**
 * Próxima clase de un curso.
 * Devuelve { periodo, cuando: 'hoy' | 'manana' | 'proxima' } o null.
 * ('proxima' = hoy no es día de clase)
 */
export function proximaClase(curso, date = new Date()) {
  const ps = periodosDeCurso(curso);
  if (!ps.length) return null;
  if (!esDiaClase(date)) return { periodo: ps[0], cuando: 'proxima' };
  const m = minutosDeFecha(date);
  const hoy = ps.find((p) => m < aMinutos(p.inicio));
  if (hoy) return { periodo: hoy, cuando: 'hoy' };
  return { periodo: ps[0], cuando: 'manana' };
}
