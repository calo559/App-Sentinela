// src/services/misAlumnos.js — los alumnos REALES del preceptor y del docente.
//
// En Eventos, quien es staff no debería ver la lista de ejemplo con la que
// arrancó la pantalla: tiene que buscar a SUS alumnos. Ese "sus" está en la
// BD: `cursos/{id}.preceptorIds` (preceptor) o `cursos/{id}.docenteIds`
// (docente). Las reglas de Firestore ya lo permiten y lo limitan: `alumnos`
// se lista curso por curso solo para el preceptor/docente DE ese curso
// (esPreceptorDelCurso / esDocenteDelCurso), así que cada consulta va de a un
// curso — el que figura en sus arrays — y nada más.
//
// El orden es alfabético por APELLIDO y después por nombre (el mismo criterio
// que usa el listado de Eventos para agrupar por letra).
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS, formatTime } from './firestore/helpers';

/** Cursos a cargo del staff: [] si el rol no maneja cursos o no tiene asignados. */
export async function cursosDelStaff(user) {
  const uid = user?.uid;
  const rol = user?.role; // 'preceptor' | 'docente' (AuthContext normaliza profesor → docente)
  if (!uid || (rol !== 'preceptor' && rol !== 'docente')) return [];
  const campo = rol === 'preceptor' ? 'preceptorIds' : 'docenteIds';
  try {
    const snap = await getDocs(
      query(collection(db, COLLECTIONS.COURSES), where(campo, 'array-contains', uid))
    );
    return snap.docs.map((d) => d.id);
  } catch {
    return [];
  }
}

/** Alumnos activos de los cursos a cargo, ordenados por apellido y nombre. */
export async function alumnosDeMisCursos(user) {
  const cursosIds = await cursosDelStaff(user);
  if (!cursosIds.length) return { cursosIds: [], alumnos: [] };

  const grupos = await Promise.all(
    cursosIds.map(async (cursoId) => {
      try {
        // Sin orderBy: dos filtros de igualdad no necesitan índice compuesto,
        // y el orden se hace acá con localeCompare('es'), que ubica bien los
        // acentos (Álvarez va con la A, no después de la Z).
        const snap = await getDocs(
          query(
            collection(db, COLLECTIONS.STUDENTS),
            where('cursoId', '==', cursoId),
            where('activo', '==', true)
          )
        );
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch {
        return [];
      }
    })
  );

  const alumnos = grupos
    .flat()
    .map((a) => ({
      id: a.id,
      nombre: a.nombre || '',
      apellido: a.apellido || '',
      cursoId: a.cursoId || '',
    }))
    .sort(
      (a, b) =>
        a.apellido.localeCompare(b.apellido, 'es') || a.nombre.localeCompare(b.nombre, 'es')
    );

  return { cursosIds, alumnos };
}

/** Asistencias de una fecha (fechaKey) en los cursos dados: { alumnoId: registro }. */
export async function asistenciasDeFecha(cursosIds, fechaKey) {
  const porAlumno = {};
  if (!cursosIds?.length || !fechaKey) return porAlumno;

  const grupos = await Promise.all(
    cursosIds.map(async (cursoId) => {
      try {
        const snap = await getDocs(
          query(
            collection(db, COLLECTIONS.ATTENDANCE),
            where('cursoId', '==', cursoId),
            where('fechaKey', '==', fechaKey)
          )
        );
        return snap.docs.map((d) => d.data());
      } catch {
        return [];
      }
    })
  );

  grupos.flat().forEach((registro) => {
    if (registro?.alumnoId) porAlumno[registro.alumnoId] = registro;
  });
  return porAlumno;
}

/**
 * Estado para la lista: 'presente' / 'tarde' / 'ausente' según el registro
 * guardado, o 'sin-registro' mientras el alumno no escanee. (El escaneo del
 * alumno solo puede dar presente o tarde; el 'ausente' lo pone el staff.)
 */
export const estadoDeAsistencia = (registro) => {
  if (!registro) return 'sin-registro';
  if (registro.estado === 'tarde') return 'tarde';
  if (registro.estado === 'ausente') return 'ausente';
  return 'presente';
};

/** Hora del registro en "HH:MM" (o '-' si todavía no escaneó). */
export const horaDeAsistencia = (registro) =>
  registro ? formatTime(registro.hora) || '-' : '-';
