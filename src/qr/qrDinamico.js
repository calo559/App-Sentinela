// QR dinámico de la entrada: arma el token vigente, lo dibuja y decide si un
// escaneo es válido. Toda la lógica de firma vive en ./qrCore y la grilla
// horaria en ./horarios (este módulo solo las orquesta).

import qrcode from 'qrcode-generator';
import { construirToken, formatearFecha, validarToken, PREFIJO_TOKEN, SIA_QR_SECRET } from './qrCore';
import {
  estaEnJornada,
  esDiaClase,
  llegoTarde,
  periodoDeSlot,
  slotActual,
  TOLERANCIA_TARDE_MIN,
} from './horarios';

export { SIA_QR_SECRET, TOLERANCIA_TARDE_MIN };

const MOTIVOS = {
  texto_vacio: 'No se leyó ningún código. Probá de nuevo.',
  formato_invalido: 'Este código no es un QR de asistencia de la escuela.',
  prefijo_invalido: 'Este código no es un QR de asistencia de la escuela.',
  fecha_invalida: 'El código tiene una fecha inválida.',
  slot_invalido: 'El código no indica un horario válido.',
  firma_invalida: 'QR inválido o manipulado. Pedí uno nuevo en la entrada.',
  qr_vencido: 'Este QR es de otro día. Escaneá el código de hoy.',
  qr_futuro: 'Este QR todavía no es válido.',
  dia_sin_clases: 'Hoy no es día de clases.',
  fuera_de_jornada: 'Ahora no hay clases: el QR se escanea durante la jornada escolar.',
  recreo: 'Es el recreo: la asistencia se registra al inicio del período.',
  qr_desactualizado: 'El QR ya no corresponde a este período. Escaneá el código actualizado.',
};

/** ¿El texto empieza a parecer un token de la entrada? */
export function esTokenSia(texto) {
  return String(texto ?? '').trim().startsWith(`${PREFIJO_TOKEN}|`);
}

/** Token que debería estar mostrando la pantalla de la entrada ahora mismo. */
export function tokenVigente(ahora = new Date()) {
  const slot = slotActual(ahora);
  if (slot === null) return null;
  return construirToken(formatearFecha(ahora), String(slot));
}

/**
 * Matriz del QR (array 2D de 0/1) para dibujar el token.
 * null si el texto está vacío o el generador no está disponible.
 */
export function matrizQr(texto, { nivelCorreccion = 'M' } = {}) {
  const contenido = String(texto ?? '').trim();
  if (!contenido) return null;
  try {
    const qr = qrcode(0, nivelCorreccion);
    qr.addData(contenido);
    qr.make();
    const lado = qr.getModuleCount();
    return Array.from({ length: lado }, (_, fila) =>
      Array.from({ length: lado }, (_, columna) => (qr.isDark(fila, columna) ? 1 : 0))
    );
  } catch (error) {
    return null;
  }
}

/**
 * Valida un escaneo de la entrada contra el momento actual.
 * → { valida, esToken, razon, mensaje, fecha, slot, periodo, tarde }
 */
export function validarEscaneo(texto, { ahora = new Date() } = {}) {
  const token = validarToken(texto, { ahora });
  const esToken = esTokenSia(texto);

  const rechazar = (razon, mensaje) => ({
    valida: false,
    esToken,
    razon,
    mensaje: mensaje || MOTIVOS[razon] || 'Ese código no es válido.',
    fecha: token.fecha,
    slot: token.slot,
  });

  if (!token.valida) return rechazar(token.razon);
  if (!esDiaClase(ahora)) return rechazar('dia_sin_clases');
  if (!estaEnJornada(ahora)) return rechazar('fuera_de_jornada');

  const periodoDelToken = periodoDeSlot(token.slot);
  if (!periodoDelToken) return rechazar('slot_invalido');

  const slot = slotActual(ahora);
  const periodo = periodoDeSlot(slot);
  if (periodo?.recreo) return rechazar('recreo');

  if (Number.parseInt(token.slot, 10) !== slot) {
    return rechazar('qr_desactualizado', `El QR cambió de período (${periodo?.nombre ?? '—'}). Escaneá el código actualizado.`);
  }

  return {
    valida: true,
    esToken: true,
    razon: null,
    mensaje: null,
    fecha: token.fecha,
    slot: token.slot,
    periodo,
    tarde: llegoTarde(ahora, slot),
  };
}
