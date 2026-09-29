// src/qr/qrDinamico.js — Validación del QR dinámico de asistencia.
//
// El QR lo GENERA la pantalla de la entrada (../qr-entrada/index.html, carpeta
// hermana a centinela-system); esta app solo LO VALIDA cuando el alumno escanea.
// El contrato (secreto y formato) vive en ../qr-entrada/qr-core.js, que la
// página carga con <script> y esta app importa → siempre sincronizados.
//
// Capas de validación:
//   1. Firma    → el payload lleva una firma con secreto: QRs truchos no pasan.
//   2. Fecha    → solo sirve el día en que se generó.
//   3. Slot     → el contenido cambia CADA HORA: una captura de una hora
//                 anterior deja de servir (con 5 min de gracia para el cambio).
//   4. Horario  → el QR es único para toda la escuela, así que el control por
//                 curso lo hace la app: solo marca asistencia si el curso DEL
//                 ALUMNO tiene clase ahora (1ª / 2ª hora según horarios.js).
//
// Formato del payload:  SIA1|<fecha>|<slot>|<firma>
//   ej: SIA1|2026-09-29|07|k3j9x2p1

import QrCore from '../../../qr-entrada/qr-core';
import { etiquetaCurso } from '../utils/malla';
import { esDiaClase, periodoDeCursoAhora, proximaClase, MODO_PRUEBA } from './horarios';

// Minutos de gracia después de cambiar la hora para aceptar el slot anterior
// (evita rechazos justo en el cambio de hora por desfases de reloj).
const GRACIA_RENOVACION_MIN = 5;

/** Payload del QR vigente (idéntico al que muestra la pantalla de la entrada). */
export function generarQr(ahora = new Date()) {
  return QrCore.generarPayload(ahora);
}

/** ¿El slot del QR sigue vigente (hora actual o anterior dentro de la gracia)? */
function slotVigente(slot, ahora) {
  if (slot === QrCore.slotDeFecha(ahora)) return true;
  if (ahora.getMinutes() < GRACIA_RENOVACION_MIN) {
    const anterior = String((ahora.getHours() + 23) % 24).padStart(2, '0');
    if (slot === anterior) return true;
  }
  return false;
}

/**
 * Valida un QR escaneado contra el alumno y el momento actual.
 * Devuelve { ok: true, periodo } o { ok: false, motivo } (motivo listo para mostrar).
 * `periodo` = bloque de clase en el que marcó (incluye materia: 'Pdisc', 'PP', …).
 */
export function validarQr(texto, alumno, ahora = new Date()) {
  const partes = String(texto ?? '').split('|').map((p) => p.trim());
  const [prefijo, fecha, slot, firma] = partes;

  if (partes.length !== 4 || prefijo !== QrCore.PREFIJO || !fecha || !slot || !firma) {
    return { ok: false, motivo: 'Este código no es un QR de asistencia' };
  }

  if (firma !== QrCore.firmar(fecha, slot)) {
    return { ok: false, motivo: 'QR inválido o manipulado' };
  }

  if (fecha !== QrCore.formatearFecha(ahora)) {
    return { ok: false, motivo: 'Este QR es de otro día' };
  }

  if (!slotVigente(slot, ahora)) {
    return { ok: false, motivo: 'El QR venció: cambió la hora. Pedí que lo actualicen.' };
  }

  // Solo para pruebas: omite días y horarios (ver horarios.js).
  if (MODO_PRUEBA) return { ok: true };

  const cursoAlumno = alumno?.curso ? etiquetaCurso(alumno.curso, alumno.division) : '';
  if (!cursoAlumno) {
    return { ok: false, motivo: 'Tu perfil no tiene un curso asignado' };
  }

  if (!esDiaClase(ahora)) {
    return { ok: false, motivo: 'Hoy no hay clases' };
  }

  const periodo = periodoDeCursoAhora(cursoAlumno, ahora);
  if (!periodo) {
    const p = proximaClase(cursoAlumno, ahora);
    const cuando =
      p?.cuando === 'hoy' ? 'hoy' : p?.cuando === 'manana' ? 'mañana' : 'el próximo día hábil';
    // Si el próximo bloque tiene materia asignada (ej.: PP, Pdisc), la mostramos.
    const materia = p?.periodo?.materia ? `de ${p.periodo.materia} ` : '';
    return {
      ok: false,
      motivo: p
        ? `Tu curso (${cursoAlumno}) no tiene clase ahora · próxima clase ${materia}${cuando} a las ${p.periodo.inicio}`
        : `Tu curso (${cursoAlumno}) no tiene clase ahora`,
    };
  }

  // ok → devolvemos el período actual (para que la app muestre la materia)
  return { ok: true, periodo };
}
