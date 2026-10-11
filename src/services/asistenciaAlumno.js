// src/services/asistenciaAlumno.js — el escaneo del alumno hacia Firestore.
//
// Cadena completa del QR de asistencia:
//   1. El QR se valida en el cliente (qrDinamico) y se registra AL INSTANTE en
//      local (attendanceService) → Inicio/Eventos lo muestran sin esperar.
//   2. Acá lo replicamos a `asistencias`, el registro oficial. Las reglas
//      exigen que exista una sesión QR del MISMO curso, activa, con fechaKey de
//      hoy y cubriendo el momento del escaneo según el reloj del SERVIDOR: sin
//      sesión abierta por el preceptor/docente/administración, Firestore
//      rechaza la escritura (es la prueba verificable de que el QR salió de la
//      pantalla de la entrada).
//   3. Al volver a Inicio/Eventos leemos lo de la nube (cargarAsistenciaHoy):
//      eso es lo que sobrevive a un reinicio de la app y lo que después ven el
//      preceptor y el docente.
//
// Identidad: `alumnoId` es exactamente lo que las reglas llaman miAlumnoId()
// (el uid en el registro público alumnos/{uid}, o usuarios.alumnoId en la
// cuenta legacy) y `registradoPor` es SIEMPRE el uid de la sesión.
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { estadoSegunPeriodo, fechaHoy, hidratarRegistro } from './attendanceService';
import { ATTENDANCE_METHOD, COLLECTIONS, formatTime } from './firestore/helpers';
import {
  actualizarAsistenciaPorQr,
  asistenciaDocId,
  registrarAsistencia,
} from './firestore/attendance';

/** ID de la ficha del alumno tal como lo resuelven las reglas (miAlumnoId). */
export const alumnoIdDe = (user) =>
  user?.alumnoId ?? (user?.role === 'alumno' ? user?.uid ?? null : null);

/** Curso en el formato de la BD: "3°1", "4°2"… (mismo id que cursos/{id}). */
export const cursoIdDe = (user) =>
  user?.curso && user?.division ? `${user.curso}${user.division}` : null;

const fechaDe = (valor) =>
  valor?.toDate ? valor.toDate() : valor instanceof Date ? valor : null;

/** Sesión QR del curso, activa hoy y cuya ventana [horaInicio, horaFin] contiene `ahora`. */
async function sesionActivaDeCurso(cursoId, ahora) {
  const snap = await getDocs(
    query(
      collection(db, COLLECTIONS.QR_SESSIONS),
      where('cursoId', '==', cursoId),
      where('fechaKey', '==', fechaHoy(ahora)),
      where('activo', '==', true)
    )
  );

  const dentro = snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((s) => {
      const inicio = fechaDe(s.horaInicio);
      const fin = fechaDe(s.horaFin);
      return inicio && fin && inicio <= ahora && ahora <= fin;
    })
    .sort((a, b) => fechaDe(b.horaInicio) - fechaDe(a.horaInicio));

  return dentro[0] ?? null;
}

const bloqueTexto = (periodo) => periodo?.materia || periodo?.nombre || '';

/**
 * Guarda el escaneo en Firestore (el registro oficial del día).
 *
 * Devuelve { ok: true, id } o { ok: false, motivo } con un mensaje listo para
 * mostrar en el scanner. Nunca tira la excepción: si falla (sin sesión, sin
 * conexión, reglas), el alumno ya quedó marcado en local.
 */
export async function guardarEscaneoEnLaNube({ user, periodo, ahora = new Date() }) {
  const alumnoId = alumnoIdDe(user);
  const cursoId = cursoIdDe(user);
  if (!alumnoId || !cursoId) {
    return { ok: false, motivo: 'Cargá tu curso y división en tu perfil' };
  }

  let sesion;
  try {
    sesion = await sesionActivaDeCurso(cursoId, ahora);
  } catch {
    return { ok: false, motivo: 'Sin conexión para verificar la sesión QR' };
  }
  if (!sesion) {
    return {
      ok: false,
      motivo: 'Tu curso no tiene sesión QR abierta: pedile al preceptor que la abra',
    };
  }

  const clave = fechaHoy(ahora);
  const estado = estadoSegunPeriodo(periodo, ahora);

  try {
    // ¿Ya hay registro de hoy? (la regla de reescaneo solo deja tocar
    // hora/estado/actualizadoEn, así que CREATE y UPDATE van por caminos distintos)
    const previas = await getDocs(
      query(
        collection(db, COLLECTIONS.ATTENDANCE),
        where('alumnoId', '==', alumnoId),
        where('fechaKey', '==', clave)
      )
    );

    if (previas.empty) {
      const id = await registrarAsistencia({
        alumnoId,
        cursoId,
        sesionQRId: sesion.id,
        fecha: clave,
        hora: ahora,
        estado,
        observaciones: bloqueTexto(periodo),
        registradoPor: user?.uid ?? alumnoId,
        metodoRegistro: ATTENDANCE_METHOD.QR,
        materiaId: null,
        horarioId: null,
      });
      return { ok: true, id, nuevo: true };
    }

    const existente = previas.docs[0];
    await actualizarAsistenciaPorQr(existente.id, { hora: ahora, estado });
    return { ok: true, id: existente.id, nuevo: false };
  } catch (e) {
    const codigo = e?.code ?? '';
    const motivo =
      codigo.includes('permission-denied')
        ? 'Firestore rechazó el registro (sesión QR vencida o fuera de horario)'
        : 'No se pudo guardar en el sistema (se guardó en este dispositivo)';
    return { ok: false, motivo };
  }
}

/**
 * Registro de HOY desde la nube, en el mismo formato que getToday().
 * Devuelve null si todavía no existe (o si no hay permiso/conexión): en ese
 * caso la UI conserva lo que haya en local.
 */
export async function cargarAsistenciaHoy(user) {
  const alumnoId = alumnoIdDe(user);
  if (!alumnoId) return null;

  const clave = fechaHoy();
  let snap;
  try {
    snap = await getDocs(
      query(
        collection(db, COLLECTIONS.ATTENDANCE),
        where('alumnoId', '==', alumnoId),
        where('fechaKey', '==', clave)
      )
    );
  } catch {
    return null;
  }
  if (snap.empty) return null;

  const d = snap.docs[0].data();
  const registro = {
    fecha: d.fechaKey ?? clave,
    hora: formatTime(d.hora) ?? '',
    status: d.estado === 'tarde' ? 'tarde' : 'presente',
    bloque: d.observaciones || '',
    alumno:
      [user?.nombre, user?.apellido].filter(Boolean).join(' ') || user?.email || '',
    curso: d.cursoId || cursoIdDe(user) || '',
  };

  hidratarRegistro(registro);
  return registro;
}

/** Id documental que usa attendance.js: {alumnoId}_{fechaKey}_general. */
export const idAsistenciaDe = (alumnoId, fechaKey) =>
  asistenciaDocId({ alumnoId, fecha: fechaKey });
