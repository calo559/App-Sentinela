// Autenticación real con Firebase Authentication + perfil en Firestore.
// Reemplaza por completo al `authService` con localStorage del repo original.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import * as users from '../services/firestore/users';
import { courses, padres, students, subjects } from '../services/firestore';
import { ROLES } from '../services/firestore/helpers';
import { normalizarRol } from '../utils/roles';
import { setActiveUser, logout as cerrarLocal } from '../services/authService';

const AuthContext = createContext(null);

// Puente con las pantallas del repo original: muchas siguen leyendo
// getActiveUser() de `authService` (localStorage). Acá espejamos el perfil
// de Firebase en ese formato ({ role, curso, division, materias, cursos … })
// para que Home/Events/Boletín/QR funcionen con la sesión real.
// Nota: el backend guarda el rol como `profesor`; esas pantallas esperan
// `docente`, por eso se invierte el alias de normalizarRol().
function espejoLocal(uid, fbUser, perfil) {
  const rol = normalizarRol(perfil?.rol);
  const role = rol === ROLES.PROFESOR ? 'docente' : (rol || null);
  const materias = (Array.isArray(perfil?.materias) ? perfil.materias : [])
    .map((m) => (typeof m === 'string' ? m : m?.nombre))
    .filter(Boolean);
  return {
    uid,
    role,
    nombre: perfil?.nombre || '',
    apellido: perfil?.apellido || '',
    email: fbUser?.email ?? perfil?.email ?? '',
    dni: perfil?.dni ?? '',
    curso: perfil?.curso ?? null,
    division: perfil?.division ?? null,
    anio: perfil?.anio ?? null,
    titulo: perfil?.titulo ?? null,
    materias,
    cursos: Array.isArray(perfil?.cursos) && perfil.cursos.length ? perfil.cursos : [],
    // Declaracion al registrarse (docente/preceptor): queda visible como
    // "pendiente" hasta que la institucion la confirme.
    cursosDeclarados: Array.isArray(perfil?.cursosDeclarados) ? perfil.cursosDeclarados : [],
    materiasDeclaradas: Array.isArray(perfil?.materiasDeclaradas) ? perfil.materiasDeclaradas : [],
  };
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const montado = useRef(true);

  useEffect(() => () => { montado.current = false; }, []);

  const cargarPerfil = useCallback(async (uid, fbUser) => {
    if (!uid) {
      if (montado.current) setPerfil(null);
      return null;
    }

    // Resolucion compatible con los dos modelos, en este orden:
    //   1. usuarios/{uid} -> staff o cuenta legacy. SIEMPRE tiene prioridad.
    //   2. alumnos/{uid}  -> alumno nuevo (Opcion B); su `alumnoId` logico es el uid.
    //   3. padres/{uid}   -> padre/madre nuevo (Opcion B).
    // Si no existe ninguno se conserva el perfil minimo sin rol de antes.
    let base = await users.obtenerUsuario(uid);
    let alumnoPublico = null;

    if (!base) {
      alumnoPublico = await students.obtenerAlumno(uid);
      if (alumnoPublico) {
        base = { ...alumnoPublico, uid, rol: ROLES.ALUMNO, alumnoId: uid };
      }
    }

    if (!base) {
      const padre = await padres.obtenerPadre(uid);
      if (padre) {
        base = { ...padre, uid, rol: ROLES.PADRE };
      }
    }

    if (!base) {
      base = {
        uid,
        email: fbUser?.email ?? '',
        nombre: fbUser?.displayName ?? '',
        apellido: '',
        rol: null,
      };
      if (montado.current) setPerfil(base);
      setActiveUser(espejoLocal(uid, fbUser, base));
      return base;
    }

    const enriquecido = { ...base };
    const rol = normalizarRol(base.rol);

    if (rol === ROLES.ALUMNO && base.alumnoId) {
      // `alumnoPublico` ya trae la ficha cuando el perfil vive en alumnos/{uid};
      // para una cuenta legacy recien la buscamos por su `alumnoId` enlazado.
      const alumno = alumnoPublico ?? (await students.obtenerAlumno(base.alumnoId));
      if (alumno) {
        enriquecido.alumno = alumno;
        enriquecido.cursoId = alumno.cursoId;
        const curso = await courses.obtenerCurso(alumno.cursoId);
        if (curso) {
          enriquecido.cursoDoc = curso;
          enriquecido.curso = `${curso.anio}°`;
          enriquecido.division = curso.division;
          enriquecido.anio = curso.anio;
          enriquecido.cursoNombre = curso.nombre;
        }
      }
    }

    if (rol === ROLES.PROFESOR) {
      const materias = await subjects.obtenerMateriasDeDocente(uid);
      enriquecido.materias = materias.map((m) => ({ id: m.id, nombre: m.nombre, cursoId: m.cursoId }));
    }

    if (montado.current) setPerfil(enriquecido);
    setActiveUser(espejoLocal(uid, fbUser, enriquecido));
    return enriquecido;
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (montado.current) setUsuario(fbUser);
      if (!fbUser) {
        cerrarLocal(); // sin sesión de Firebase: limpiar también el espejo local
        if (montado.current) {
          setPerfil(null);
          setCargando(false);
        }
        return;
      }
      try {
        await cargarPerfil(fbUser.uid, fbUser);
      } catch (error) {
        if (montado.current) setPerfil({ uid: fbUser.uid, email: fbUser.email, rol: null, error: error.message });
      } finally {
        if (montado.current) setCargando(false);
      }
    });
    return unsub;
  }, [cargarPerfil]);

  const entrar = useCallback((email, password) => users.login(email, password), []);

  const registrar = useCallback(
    async ({ email, password, nombre, apellido, dni, telefono, rol, dniHijo, cursoId, cursosDeclarados, materiasDeclaradas }) => {
      // Alta publica separada por tipo (Opcion B):
      //   alumno -> Authentication + alumnos/{uid} (con el curso elegido)
      //   padre  -> Authentication + padres/{uid}
      //   docente/preceptor -> Authentication + usuarios/{uid}, con la
      //   declaracion de cursos/materias que la administracion confirma despues
      //   (no da permiso por si sola).
      // Ninguna rama escribe en `usuarios/` para alumno/padre: no hay documentos
      // duplicados, y el rol se deduce de la coleccion donde vive el perfil.
      const rolSolicitado = normalizarRol(rol) || ROLES.ALUMNO;

      let uid;
      if (rolSolicitado === ROLES.PADRE) {
        uid = await padres.crearPadrePublico({ email, password, nombre, apellido, dni, telefono, dniHijo });
      } else if (rolSolicitado === ROLES.ALUMNO) {
        uid = await students.crearAlumnoPublico({ email, password, nombre, apellido, dni, telefono, cursoId });
      } else {
        uid = await users.crearUsuario({
          email,
          password,
          nombre,
          apellido,
          dni,
          telefono,
          rol: rolSolicitado,
          cursosDeclarados,
          materiasDeclaradas,
        });
      }

      await cargarPerfil(uid, auth.currentUser);
      return uid;
    },
    [cargarPerfil]
  );

  const salir = useCallback(() => users.logout(), []);

  const recargarPerfil = useCallback(() => {
    const fbUser = auth.currentUser;
    if (!fbUser) return Promise.resolve(null);
    return cargarPerfil(fbUser.uid, fbUser);
  }, [cargarPerfil]);

  const actualizarPerfil = useCallback(
    async (cambios) => {
      const uid = auth.currentUser?.uid;
      if (!uid) throw new Error('No hay una sesión activa');

      // Cada perfil se guarda donde vive: usuarios (staff/legacy), alumnos/{uid}
      // (alumno nuevo) o padres/{uid} (padre nuevo). Para el alumno legacy se
      // sigue sincronizando su ficha separada enlazada por `alumnoId`, como
      // antes; el alumno nuevo ya es la propia ficha, asi que no hay segundo
      // documento que actualizar.
      const usuario = await users.obtenerUsuario(uid);
      const rol = normalizarRol(usuario?.rol ?? perfil?.rol);

      if (usuario) {
        await users.actualizarUsuario(uid, cambios);
        if (rol === ROLES.ALUMNO && usuario.alumnoId) {
          try {
            await students.actualizarAlumno(usuario.alumnoId, {
              nombre: cambios.nombre,
              apellido: cambios.apellido,
              telefono: cambios.telefono,
            });
          } catch (error) {
            console.warn('No se pudo sincronizar el legajo del alumno', error?.message);
          }
        }
      } else if (rol === ROLES.ALUMNO) {
        await students.actualizarAlumno(uid, cambios);
      } else if (rol === ROLES.PADRE) {
        await padres.actualizarPadre(uid, cambios);
      } else {
        await users.actualizarUsuario(uid, cambios);
      }

      return recargarPerfil();
    },
    [perfil, recargarPerfil]
  );

  const value = useMemo(
    () => ({
      usuario,
      perfil,
      rol: normalizarRol(perfil?.rol) || null,
      cargando,
      entrar,
      registrar,
      salir,
      recargarPerfil,
      actualizarPerfil,
    }),
    [usuario, perfil, cargando, entrar, registrar, salir, recargarPerfil, actualizarPerfil]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
}
