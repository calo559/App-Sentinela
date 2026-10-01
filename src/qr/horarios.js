// Grilla horaria de la jornada escolar (turno mañana).
// Solo horarios: las materias de cada curso viven en Firestore (colección
// `horarios`), nunca acá.
//
//   P1 ······ 07:20 – 10:05   primera hora (bloques 07:20-08:40 y 08:45-10:05)
//   REC ····· 10:05 – 10:10   recreo
//   P2 ······ 10:10 – 11:30   segunda hora (bloque 10:10-11:30)
//
// El índice del período dentro de PERIODOS es el "slot" que viaja en el token
// del QR: 0 = P1, 1 = REC, 2 = P2.

export const JORNADA = {
  nombre: 'Turno mañana',
  horaInicio: '07:20',
  horaFin: '11:30',
  diasClase: [1, 2, 3, 4, 5],
};

export const PERIODOS = [
  { id: 'P1', nombre: 'Primera hora', inicio: '07:20', fin: '10:05' },
  { id: 'REC', nombre: 'Recreo', inicio: '10:05', fin: '10:10', recreo: true },
  { id: 'P2', nombre: 'Segunda hora', inicio: '10:10', fin: '11:30' },
];

// Minutos desde el inicio del período a partir de los cuales se registra
// "tarde" en lugar de "presente".
export const TOLERANCIA_TARDE_MIN = 10;

/** '07:20' → 440. NaN si no parece una hora. */
export function aMinutos(hhmm) {
  if (typeof hhmm === 'number') return Number.isFinite(hhmm) ? hhmm : Number.NaN;
  const partes = String(hhmm ?? '').split(':');
  if (partes.length < 2) return Number.NaN;
  const horas = Number(partes[0]);
  const minutos = Number(partes[1]);
  if (!Number.isFinite(horas) || !Number.isFinite(minutos)) return Number.NaN;
  return horas * 60 + minutos;
}

/** Minutos desde medianoche de una fecha. */
export function minutosDeFecha(date = new Date()) {
  const momento = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(momento.getTime())) return Number.NaN;
  return momento.getHours() * 60 + momento.getMinutes();
}

/** ¿Es día de clases? (0 = domingo … 6 = sábado) */
export function esDiaClase(date = new Date()) {
  const momento = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(momento.getTime())) return false;
  return JORNADA.diasClase.includes(momento.getDay());
}

/** Período a partir de su slot. null si el slot no existe. */
export function periodoDeSlot(slot) {
  if (slot === null || slot === undefined || slot === '') return null;
  const indice = Number.parseInt(String(slot).trim(), 10);
  if (!Number.isInteger(indice) || indice < 0 || indice >= PERIODOS.length) return null;
  return { ...PERIODOS[indice], slot: indice };
}

/** Slot del período en curso. null si está fuera de la jornada. */
export function slotActual(ahora = new Date()) {
  const minutos = minutosDeFecha(ahora);
  if (!Number.isFinite(minutos)) return null;
  const indice = PERIODOS.findIndex(
    (periodo) => minutos >= aMinutos(periodo.inicio) && minutos < aMinutos(periodo.fin)
  );
  return indice >= 0 ? indice : null;
}

/** Período en curso (incluye el recreo). null fuera de horario. */
export function periodoActual(ahora = new Date()) {
  return periodoDeSlot(slotActual(ahora));
}

/** ¿Estamos dentro de la jornada escolar? */
export function estaEnJornada(ahora = new Date()) {
  const minutos = minutosDeFecha(ahora);
  if (!Number.isFinite(minutos)) return false;
  return esDiaClase(ahora) && minutos >= aMinutos(JORNADA.horaInicio) && minutos < aMinutos(JORNADA.horaFin);
}

/** Siguiente slot de la jornada (da la vuelta al terminar). */
export function siguienteSlot(slot) {
  const periodo = periodoDeSlot(slot);
  const indice = periodo ? periodo.slot : -1;
  return (indice + 1) % PERIODOS.length;
}

/** ¿Supera la hora el inicio del período + tolerancia? */
export function llegoTarde(ahora = new Date(), slot = null) {
  const periodo = periodoDeSlot(slot);
  if (!periodo || periodo.recreo) return false;
  const minutos = minutosDeFecha(ahora);
  const inicio = aMinutos(periodo.inicio);
  if (!Number.isFinite(minutos) || !Number.isFinite(inicio)) return false;
  return minutos - inicio > TOLERANCIA_TARDE_MIN;
}

/**
 * Busca el horario de Firestore que cae dentro de un período de la jornada.
 * Recibe los docs de `schedules.obtenerHorarios` ({ horaInicio, horaFin }).
 */
export function horarioDePeriodo(horarios, periodo) {
  const lista = Array.isArray(horarios) ? horarios : [];
  if (!periodo) return null;
  const desde = aMinutos(periodo.inicio);
  const hasta = aMinutos(periodo.fin);
  return (
    lista.find((horario) => {
      const inicio = aMinutos(horario?.horaInicio);
      return Number.isFinite(inicio) && inicio >= desde && inicio < hasta;
    }) || null
  );
}
