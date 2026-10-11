// Asistencia propia del alumno: se registra al escanear el QR de la clase.
import { TOLERANCIA_TARDE_MIN } from '../qr/horarios';

const KEY = 'sia_asistencia_propia';

const hasStorage = () => typeof window !== 'undefined' && !!window.localStorage;

function read() {
  if (!hasStorage()) return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : null;
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

function write(data) {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // sin storage: quedamos en memoria del módulo
  }
}

let mem = null;

export function fechaHoy(base = new Date()) {
  const d = base;
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function horaAhora(base = new Date()) {
  const d = base;
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** '07:20' → 440 */
function minutos(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * 'presente' o 'tarde' según el inicio del bloque y la tolerancia de 10 min.
 * Es la MISMA regla que aplica la nube al guardar el escaneo: un escaneo más de
 * 10 minutos después del inicio de la clase es llegada tarde.
 */
export function estadoSegunPeriodo(periodo, ahora = new Date()) {
  const tarde =
    !!periodo?.inicio &&
    minutos(horaAhora(ahora)) > minutos(periodo.inicio) + TOLERANCIA_TARDE_MIN;
  return tarde ? 'tarde' : 'presente';
}

/**
 * Registra al alumno como presente hoy (si ya estaba, devuelve el registro).
 *
 * `periodo` = bloque de clase en el que escaneó (con `inicio` y `materia`):
 *   · escaneo hasta TOLERANCIA_TARDE_MIN después del inicio → status 'presente'
 *   · escaneo pasado ese tiempo → status 'tarde' (llegada tarde)
 * Sin periodo (MODO_PRUEBA) → 'presente'.
 */
export function markPresentToday(user, periodo, ahora = new Date()) {
  if (!mem) mem = read();
  const fecha = fechaHoy(ahora);
  if (mem[fecha]) return { ...mem[fecha], ya: true };
  const hora = horaAhora(ahora);
  const registro = {
    fecha,
    hora,
    status: estadoSegunPeriodo(periodo, ahora),
    bloque: periodo?.materia || periodo?.nombre || '',
    alumno: [user?.nombre, user?.apellido].filter(Boolean).join(' ') || user?.email || '',
    curso: user?.curso && user?.division ? `${user.curso}${user.division}` : '',
  };
  mem[fecha] = registro;
  write(mem);
  return registro;
}

/** Registro de asistencia del día de hoy (o null si aún no escaneó). */
export function getToday() {
  if (!mem) mem = read();
  return mem[fechaHoy()] || null;
}

/**
 * Carga en local un registro que viene de la nube (misma forma que el local).
 * React Native no tiene localStorage: lo que quedó en Firestore es la única
 * copia que sobrevive a un reinicio de la app, así que al volver a Inicio se
 * trae de vuelta a memoria para que las pantallas lo muestren igual.
 */
export function hidratarRegistro(registro) {
  if (!registro?.fecha) return null;
  if (!mem) mem = read();
  mem[registro.fecha] = { ...registro };
  write(mem);
  return mem[registro.fecha];
}
