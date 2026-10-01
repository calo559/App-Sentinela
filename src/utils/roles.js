import { SCREENS } from './constants';
import { ROLES } from '../services/firestore/helpers';

// El backend/seed usa el rol `profesor`; la UI lo muestra como "Docente".
export const ROLE_INFO = {
  [ROLES.ADMIN]: { key: ROLES.ADMIN, label: 'Administrador', icon: 'shield-account-outline' },
  [ROLES.DIRECTIVO]: { key: ROLES.DIRECTIVO, label: 'Directivo', icon: 'account-tie-outline' },
  [ROLES.PRECEPTOR]: { key: ROLES.PRECEPTOR, label: 'Preceptor', icon: 'clipboard-text-outline' },
  [ROLES.PROFESOR]: { key: ROLES.PROFESOR, label: 'Docente', icon: 'human-male-board' },
  [ROLES.ALUMNO]: { key: ROLES.ALUMNO, label: 'Alumno', icon: 'school-outline' },
  [ROLES.PADRE]: { key: ROLES.PADRE, label: 'Padre/Madre', icon: 'account-supervisor-outline' },
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

// Con QR: el botón circular queda en el CENTRO de la barra (estilo Mercado Pago).
const STUDENT_TABS_WITH_QR = [
  SCREENS.HOME,
  SCREENS.EVENTS,
  SCREENS.QR_SCANNER,
  SCREENS.BOLETIN,
  SCREENS.PROFILE,
];

const STAFF_TABS = [SCREENS.HOME, SCREENS.EVENTS, SCREENS.BOLETIN, SCREENS.PROFILE];

// El padre todavia no tiene pantallas propias de seguimiento del hijo. Por ahora
// solo ve su perfil (estructura minima y segura). La entrada es EXPLICITA para
// que `padre` NO herede las pestanas del alumno por el fallback de
// `tabsForRole`. Falta implementar: vista de asistencia/notas del hijo y
// notificaciones.
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
  return TABS_BY_ROLE[normalizarRol(rol)] || STUDENT_TABS;
}
