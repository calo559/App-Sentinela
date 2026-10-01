// Núcleo del QR dinámico: token firmado y stateless.
// Reemplaza al módulo externo `qr-entrada/qr-core` del repo de referencia,
// que estaba fuera de este proyecto y rompía el bundle.
//
// Formato del token:  SIA1|<fecha YYYY-MM-DD>|<slot>|<firma>
//   ej.: SIA1|2026-09-30|0|3f9a1c47
//
// La firma es un FNV-1a de 32 bits con mezcla final (avalanche), en hex de 8
// caracteres, sobre `${fecha}|${slot}|${SIA_QR_SECRET}`. Es determinístico: el
// mismo (fecha, slot) produce siempre la misma firma, y sin el secreto no se
// puede fabricar un token que pase la validación.

export const SIA_QR_SECRET = 'SIA-ET3-PADRON-2026-QR';
export const PREFIJO_TOKEN = 'SIA1';
export const LONGITUD_FIRMA = 8;
export const TOLERANCIA_FECHA_DIAS = 0;

const MS_POR_DIA = 86400000;
const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const PATRON_FIRMA = /^[0-9a-f]+$/;

function mezclar(hash) {
  let h = hash >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

function fnv1a(texto) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < texto.length; i += 1) {
    hash ^= texto.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return mezclar(hash);
}

/** Date (o 'YYYY-MM-DD' o timestamp) → 'YYYY-MM-DD' en hora local. '' si no se puede. */
export function formatearFecha(fecha = new Date()) {
  if (typeof fecha === 'string' && PATRON_FECHA.test(fecha)) {
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const probe = new Date(anio, mes - 1, dia);
    return Number.isNaN(probe.getTime()) || probe.getMonth() !== mes - 1 || probe.getDate() !== dia
      ? ''
      : fecha;
  }
  const date = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(date.getTime())) return '';
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/** '7', 7, '07' → '7'. null si no es un índice horario válido. */
export function normalizarSlot(slot) {
  if (slot === null || slot === undefined || slot === '') return null;
  const indice = Number.parseInt(String(slot).trim(), 10);
  if (!Number.isInteger(indice) || indice < 0) return null;
  return String(indice);
}

/** Firma determinística (hex 8) de un par fecha + slot. '' si los datos no sirven. */
export function firmar(fecha, slot) {
  const fechaKey = formatearFecha(fecha);
  const slotKey = normalizarSlot(slot);
  if (!fechaKey || slotKey === null) return '';
  return fnv1a(`${fechaKey}|${slotKey}|${SIA_QR_SECRET}`).toString(16).padStart(LONGITUD_FIRMA, '0');
}

/** Arma el token completo. null si fecha o slot no son válidos. */
export function construirToken(fecha, slot) {
  const fechaKey = formatearFecha(fecha);
  const slotKey = normalizarSlot(slot);
  if (!fechaKey || slotKey === null) return null;
  return `${PREFIJO_TOKEN}|${fechaKey}|${slotKey}|${firmar(fechaKey, slotKey)}`;
}

/**
 * Rompe el texto en sus partes sin verificar nada.
 * → { ok, razon } o { ok: true, prefijo, fecha, slot, firma }
 */
export function parsearToken(texto) {
  const bruto = String(texto ?? '').trim();
  if (!bruto) return { ok: false, razon: 'texto_vacio' };

  const partes = bruto.split('|').map((parte) => parte.trim());
  if (partes.length !== 4) return { ok: false, razon: 'formato_invalido' };

  const [prefijo, fecha, slot, firma] = partes;
  if (prefijo !== PREFIJO_TOKEN) return { ok: false, razon: 'prefijo_invalido' };
  if (!formatearFecha(fecha)) return { ok: false, razon: 'fecha_invalida' };

  const slotKey = normalizarSlot(slot);
  if (slotKey === null) return { ok: false, razon: 'slot_invalido' };
  if (firma.length !== LONGITUD_FIRMA || !PATRON_FIRMA.test(firma)) return { ok: false, razon: 'firma_invalida' };

  return { ok: true, prefijo, fecha, slot: slotKey, firma: firma.toLowerCase() };
}

function medianoche(fechaKey) {
  const [anio, mes, dia] = String(fechaKey).split('-').map(Number);
  return new Date(anio, mes - 1, dia).getTime();
}

/** Días entre dos 'YYYY-MM-DD'. null si alguna fecha no existe. */
function diferenciaEnDias(desde, hasta) {
  const a = medianoche(desde);
  const b = medianoche(hasta);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((a - b) / MS_POR_DIA);
}

/**
 * Valida un token: formato, firma y fecha (hoy, o dentro de la tolerancia).
 * → { valida, razon, fecha, slot }
 * La vigencia del slot dentro de la jornada se resuelve aparte, en qrDinamico.
 */
export function validarToken(texto, { ahora = new Date(), toleranciaDias = TOLERANCIA_FECHA_DIAS } = {}) {
  const parseo = parsearToken(texto);
  if (!parseo.ok) return { valida: false, razon: parseo.razon, fecha: null, slot: null };

  const { fecha, slot, firma } = parseo;

  if (firma !== firmar(fecha, slot)) {
    return { valida: false, razon: 'firma_invalida', fecha, slot };
  }

  const dias = diferenciaEnDias(fecha, formatearFecha(ahora));
  if (dias === null || Math.abs(dias) > toleranciaDias) {
    return { valida: false, razon: dias !== null && dias < 0 ? 'qr_vencido' : 'qr_futuro', fecha, slot };
  }

  return { valida: true, razon: null, fecha, slot };
}
