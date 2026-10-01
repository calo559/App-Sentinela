import { SCREENS } from './constants';
import { ROLES } from '../services/firestore/helpers';

// Info de rol para la UI. Cubre los 6 roles del backend (Firestore) y la
// clave plana 'docente' del repo original (el backend usa 'profesor';
// normalizarRol() resuelve ese alias en el resto del código).
export const ROLE_INFO = {
  [ROLES.ADMIN]: { key: ROLES.ADMIN, label: 'Administrador', icon: 'shield-account-outline' },
  [ROLES.DIRECTIVO]: { key: ROLES.DIRECTIVO, label: 'Directivo', icon: 'account-tie-outline' },
  [ROLES.PRECEPTOR]: { key: ROLES.PRECEPTOR, label: 'Preceptor', icon: 'clipboard-text-outline' },
  [ROLES.PROFESOR]: { key: ROLES.PROFESOR, label: 'Docente', icon: 'human-male-board' },
  [ROLES.ALUMNO]: { key: ROLES.ALUMNO, label: 'Alumno', icon: 'school-outline' },
  [ROLES.PADRE]: { key: ROLES.PADRE, label: 'Padre/Madre', icon: 'account-supervisor-outline' },
  // Compatibilidad con el repo original (localStorage usaba 'docente').
  docente: { key: 'docente', label: 'Docente', icon: 'human-male-board' },
};

// Compatibilidad con el repo original, que usaba `docente`.
const ALIASES = { docente: ROLES.PROFESOR };

export function normalizarRol(rol) {
  const clave = String(rol ?? '').toLowerCase();
  return ALIASES[clave] ?? clave;
}

export function infoRol(rol) {
  const normalizado = normalizarRol(rol);
  return ROLE_INFO[normalizado] ?? { key: normalizado, label: 'Usuario', icon: 'account-outline' };
}

const STUDENT_TABS = [SCREENS.HOME, SCREENS.EVENTS, SCREENS.PROFILE];

// Con QR: el botón circular queda EN EL CENTRO de la barra (estilo Mercado Pago).
const STUDENT_TABS_WITH_QR = [
  SCREENS.HOME,
  SCREENS.EVENTS,
  SCREENS.QR_SCANNER,
  SCREENS.BOLETIN,
  SCREENS.PROFILE,
];

// Docente/preceptor/directivo/admin: no escanean ni generan QR
// (el QR vive en la pantalla de la entrada).
const STAFF_TABS = [SCREENS.HOME, SCREENS.EVENTS, SCREENS.BOLETIN, SCREENS.PROFILE];

// El padre todavía no tiene pantallas propias de seguimiento del hijo.
const PARENT_TABS = [SCREENS.PROFILE];

export const TABS_BY_ROLE = {
  [ROLES.ALUMNO]: STUDENT_TABS_WITH_QR,
  [ROLES.PROFESOR]: STAFF_TABS,
  [ROLES.PRECEPTOR]: STAFF_TABS,
  [ROLES.DIRECTIVO]: STAFF_TABS,
  [ROLES.ADMIN]: STAFF_TABS,
  [ROLES.PADRE]: PARENT_TABS,
};

export function hasQrScanner(rol) {
  return normalizarRol(rol) === ROLES.ALUMNO;
}

export function tabsForRole(rol) {
  return TABS_BY_ROLE[normalizarRol(rol)] || STUDENT_TABS; // rol desconocido: secciones mínimas
}

export function canTakeAttendance() {
  // Nadie "toma asistencia": el alumno se registra escaneando el QR de la entrada.
  return false;
}
