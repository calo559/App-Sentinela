// Asistencia propia del alumno: se registra al escanear el QR de la clase.
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

export function horaAhora() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Registra al alumno como presente hoy (si ya estaba, devuelve el registro). */
export function markPresentToday(user) {
  if (!mem) mem = read();
  const fecha = fechaHoy();
  if (mem[fecha]) return { ...mem[fecha], ya: true };
  const registro = {
    fecha,
    hora: horaAhora(),
    status: 'presente',
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
