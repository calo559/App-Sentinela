import { SCREENS } from './constants';

export const ROLE_INFO = {
  alumno: { key: 'alumno', label: 'Alumno', icon: '🎒' },
  docente: { key: 'docente', label: 'Docente', icon: '👨‍🏫' },
  preceptor: { key: 'preceptor', label: 'Preceptor', icon: '📋' },
};

const STUDENT_TABS = [SCREENS.HOME, SCREENS.EVENTS, SCREENS.BOLETIN, SCREENS.PROFILE];

// Secciones visibles según rol:
// - alumno:      escanea el QR → se marca presente él mismo
// - preceptor:   no escanea QR
// - docente:     NO toma asistencia (el alumno se marca al escanear);
//                su rol en el Boletín es cargar notas e informes
// Settings ya NO es una sección: vive dentro de Perfil (Stack "Settings").
const QR_FOR_ROLES = ['alumno'];

// Con QR: el botón circular queda EN EL CENTRO de la barra (estilo Mercado Pago)
const TABS_WITH_QR_CENTER = [
  SCREENS.HOME,
  SCREENS.EVENTS,
  SCREENS.QR_SCANNER,
  SCREENS.BOLETIN,
  SCREENS.PROFILE,
];

export const TABS_BY_ROLE = {
  alumno: [...TABS_WITH_QR_CENTER],
  preceptor: STUDENT_TABS,
  docente: STUDENT_TABS, // sin QR ni FAB: el alumno se marca al escanear
};

export function hasQrScanner(role) {
  return QR_FOR_ROLES.includes(role);
}

export function tabsForRole(role) {
  return TABS_BY_ROLE[role] || STUDENT_TABS; // rol desconocido: secciones mínimas
}

export function canTakeAttendance() {
  // Nadie "toma asistencia": el alumno se registra escaneando el QR de la clase.
  return false;
}
