// qr-entrada/qr-core.js — Contrato compartido entre:
//   • la PANTALLA de la entrada (qr-entrada/index.html) → GENERA el QR, y
//   • la APP (src/qr/qrDinamico.js)                     → VALIDA el QR escaneado.
//
// ⚠️ Este archivo es la ÚNICA fuente de verdad del secreto y del formato.
//    La página lo carga con <script src="./qr-core.js"> y la app lo importa con
//    import QrCore from '../../qr-entrada/qr-core' → si lo cambiás acá,
//    cambia en los DOS lados al mismo tiempo (no hay que sincronizar nada).
//
// Formato del payload:  SIA1|<fecha>|<slot>|<firma>
//   ej:  SIA1|2026-09-29|07|k3j9x2p1
//   • fecha → día de generación (el QR solo sirve ese día)
//   • slot  → hora en 2 dígitos: el QR CAMBIA CADA HORA
//   • firma → hash con secreto: un QR truchado o manipulado no pasa
//
// Nota de seguridad: el secreto vive en el código porque no hay backend.
// Con servidor, la firma debería calcularse allá (HMAC) para que ningún
// alumno pueda forjarla.
//
// UMD chico: funciona como <script> en el navegador (window.QrCore)
// y como módulo CommonJS en la app (Metro).
(function (global, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    global.QrCore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var SECRETO = 'sia-sentinel::qr::v1';
  var PREFIJO = 'SIA1';

  function relleno(n, largo) {
    return String(n).padStart(largo, '0');
  }

  /** Hash djb2 en base 36 (corto y seguro para el payload). */
  function hash36(str) {
    var h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
    return h.toString(36);
  }

  /** 'YYYY-MM-DD' (mismo formato que usa la app para la fecha de asistencia). */
  function formatearFecha(date) {
    var d = date || new Date();
    return d.getFullYear() + '-' + relleno(d.getMonth() + 1, 2) + '-' + relleno(d.getDate(), 2);
  }

  /** Slot horario: la hora actual en 2 dígitos ('00'…'23'). Cambia cada hora. */
  function slotDeFecha(date) {
    var d = date || new Date();
    return relleno(d.getHours(), 2);
  }

  /** Firma del payload: cambia si varía fecha u hora. */
  function firmar(fecha, slot) {
    return hash36(SECRETO + '|' + fecha + '|' + slot);
  }

  /** Payload completo del QR para un momento dado. */
  function generarPayload(ahora) {
    var fecha = formatearFecha(ahora);
    var slot = slotDeFecha(ahora);
    return PREFIJO + '|' + fecha + '|' + slot + '|' + firmar(fecha, slot);
  }

  return {
    SECRETO: SECRETO,
    PREFIJO: PREFIJO,
    hash36: hash36,
    formatearFecha: formatearFecha,
    slotDeFecha: slotDeFecha,
    firmar: firmar,
    generarPayload: generarPayload,
  };
});
