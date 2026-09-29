// Auth simulado con almacenamiento local.
// Demo (password 123456):
//   alumno@escuela.edu | docente@escuela.edu | preceptor@escuela.edu

const USERS_KEY = 'sia_users';
const ACTIVE_KEY = 'sia_active_user';

const DEMO_USERS = [
  {
    role: 'alumno', nombre: 'Ana', apellido: 'Alumna', dni: '11111111',
    email: 'alumno@escuela.edu', password: '123456', curso: '3°', division: '1',
  },
  {
    role: 'docente', nombre: 'Carlos', apellido: 'Docente', dni: '22222222',
    email: 'docente@escuela.edu', password: '123456',
    titulo: 'Prof. de Matemática', anio: '4',
    materias: ['Matemática', 'Física', 'Programación I'],
  },
  {
    role: 'preceptor', nombre: 'María', apellido: 'Preceptora', dni: '33333333',
    email: 'preceptor@escuela.edu', password: '123456', curso: '3°', division: '1',
  },
];

let memUsers = null;
let memActive = null;

const hasStorage = () => typeof window !== 'undefined' && !!window.localStorage;

function read(key) {
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, value) {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // sin storage (ej: Expo nativo) seguimos con memoria
  }
}

function loadUsers() {
  if (memUsers) return memUsers;
  const stored = read(USERS_KEY);
  memUsers = Array.isArray(stored) && stored.length ? stored : DEMO_USERS.slice();
  return memUsers;
}

export function register(data) {
  const users = loadUsers();
  const email = String(data.email || '').trim().toLowerCase();
  if (!email) throw new Error('Ingresá un correo válido');
  if (users.some((u) => String(u.email || '').toLowerCase() === email)) {
    throw new Error('Ya existe una cuenta con ese correo');
  }
  const user = { ...data, email };
  users.push(user);
  memUsers = users;
  write(USERS_KEY, users);
  setActiveUser(user); // registro = crea la cuenta e inicia sesión
  return user;
}

export function login(email, password) {
  const users = loadUsers();
  const user = users.find(
    (u) =>
      String(u.email || '').toLowerCase() === String(email || '').trim().toLowerCase() &&
      u.password === password
  );
  if (!user) throw new Error('Correo o contraseña incorrectos');
  setActiveUser(user);
  return user;
}

export function setActiveUser(user) {
  memActive = user;
  write(ACTIVE_KEY, user);
}

export function getActiveUser() {
  if (memActive) return memActive;
  memActive = read(ACTIVE_KEY);
  return memActive;
}

export function logout() {
  memActive = null;
  write(ACTIVE_KEY, null);
}

/**
 * Actualiza el perfil del usuario activo (y su cuenta).
 * patch: nombre, apellido, dni, email, password?, curso?, division?, anio?, materias?, titulo?
 */
export function updateProfile(patch) {
  const users = loadUsers();
  const activo = memActive || read(ACTIVE_KEY);
  if (!activo?.email) throw new Error('No hay una sesión activa');

  const email = String(patch.email ?? activo.email).trim().toLowerCase();
  const emailOriginal = String(activo.email || '').toLowerCase();
  if (
    email !== emailOriginal &&
    users.some((u) => String(u.email || '').toLowerCase() === email)
  ) {
    throw new Error('Ya existe una cuenta con ese correo');
  }

  const idx = users.findIndex(
    (u) => String(u.email || '').toLowerCase() === emailOriginal
  );
  if (idx < 0) throw new Error('No se encontró la cuenta');

  const { password, ...resto } = patch || {};
  const actualizado = { ...users[idx], ...resto, email };
  if (password) actualizado.password = password;
  if (resto.materias) delete actualizado.materia; // legacy: materia única

  users[idx] = actualizado;
  memUsers = users;
  write(USERS_KEY, users);
  setActiveUser(actualizado);
  return actualizado;
}
