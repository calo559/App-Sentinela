// Autenticación real con Firebase Authentication + perfil en Firestore.
// Reemplaza por completo al `authService` con localStorage del repo original.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import * as users from '../services/firestore/users';
import { courses, students, subjects } from '../services/firestore';
import { ROLES } from '../services/firestore/helpers';
import { normalizarRol } from '../utils/roles';

const AuthContext = createContext(null);

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

    let base = await users.obtenerUsuario(uid);
    if (!base) {
      base = {
        uid,
        email: fbUser?.email ?? '',
        nombre: fbUser?.displayName ?? '',
        apellido: '',
        rol: null,
      };
      if (montado.current) setPerfil(base);
      return base;
    }

    const enriquecido = { ...base };
    const rol = normalizarRol(base.rol);

    if (rol === ROLES.ALUMNO && base.alumnoId) {
      const alumno = await students.obtenerAlumno(base.alumnoId);
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
    return enriquecido;
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (montado.current) setUsuario(fbUser);
      if (!fbUser) {
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
    async ({ email, password, nombre, apellido, dni, telefono }) => {
      // Alta publica: SOLO crea el documento de usuarios con rol alumno y sin
      // vinculacion. No se escribe nada en alumnos/: la ficha y su curso los
      // asigna la institucion despues, con `users.vincularAlumnoCuenta` (solo
      // administrador). El alumno no puede elegir un curso ni reclamar la ficha
      // de otro.
      const uid = await users.crearUsuario({
        email,
        password,
        nombre,
        apellido,
        dni,
        telefono,
        rol: ROLES.ALUMNO,
      });

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
      await users.actualizarUsuario(uid, cambios);
      return recargarPerfil();
    },
    [recargarPerfil]
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
