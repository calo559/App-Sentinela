// src/qr/horarios.js — Horarios de la escuela: jornada general + horarios
// especiales por curso y día (HORARIO_DIAS_CURSOS).
//
//   Ingreso ........... 07:20
//   1ª hora ........... 07:20 – 09:20
//   Recreo (20 min) ... 09:20 – 09:40
//   2ª hora ........... 09:40 – 11:40
//
// ⚠️ EDITÁ los datos de este archivo si los horarios de la escuela cambian.

export const PERIODOS = [
  { id: 'P1', nombre: 'Primera hora', inicio: '07:20', fin: '09:20' },
  { id: 'REC', nombre: 'Recreo', inicio: '09:20', fin: '09:40', recreo: true },
  { id: 'P2', nombre: 'Segunda hora', inicio: '09:40', fin: '11:40' },
];

// Tolerancia para escanear alrededor del período (llegada temprana / salida ajustada), en minutos.
export const MARGEN_INICIO_MIN = 10;
export const MARGEN_FIN_MIN = 10;

// Escaneo dentro de los N minutos del INICIO del bloque → se registra "presente";
// a partir del minuto N+1 → "llegada tarde" (se decide al escanear el QR).
export const TOLERANCIA_TARDE_MIN = 10;

// Días con clase (0 = domingo … 6 = sábado)
export const DIAS_CLASE = [1, 2, 3, 4, 5];

// ⚠️ SOLO PARA PRUEBAS: true = se omite la validación de días y horarios
// (sirve para probar el flujo completo fuera del horario escolar).
// Dejar en false en uso real: es parte de la seguridad del QR dinámico.
export const MODO_PRUEBA = false;

// Horario exacto por curso → lista de ids de PERIODOS (sin recreo).
// Los cursos que no estén en esta lista usan REGLA_POR_DEFECTO de abajo.
export const HORARIO_CURSOS = {
  // '3°1': ['P1'],          // ej.: cursa solo la primera hora (todos los días)
  // '4°2': ['P2'],          // ej.: cursa solo la segunda hora (todos los días)
  // '5°1': ['P1', 'P2'],    // ej.: cursa las dos horas
};

// ⚠️ Horarios ESPECIALES por curso y día de la semana: pisan el horario general
// SOLO para los días listados (los demás días del curso sigue el de arriba /
// la regla por defecto).
//   estructura: { 'curso': { [día]: [ {inicio, fin, materia, nombre, docente} ] } }
//   día: 0=domingo, 1=lunes, 2=martes … 6=sábado
//   La ausencia de recreo entre bloques es intencional (ej.: "de corrido").
//   Estos bloques también alimentan la malla del Boletín de ese curso.
export const HORARIO_DIAS_CURSOS = {
  // 7°2 — turno de tarde (Informática): semana completa
  '7°2': {
    // LUNES: de corrido sin recreo
    1: [
      {
        id: 'L1',
        inicio: '13:30',
        fin: '17:30',
        materia: 'PP',
        nombre: 'Prácticas Profesionalizantes',
        docente: 'Carlos Acuña',
      },
    ],
    // MARTES
    2: [
      {
        id: 'M1',
        inicio: '14:00',
        fin: '18:00',
        materia: 'Pdisc',
        nombre: 'Proyecto, Implementación de Sistemas Computacionales',
        docente: 'Pablo Pereyra',
      },
      {
        id: 'M2',
        inicio: '18:30',
        fin: '20:30',
        materia: 'PP',
        nombre: 'Prácticas Profesionalizantes',
        docente: 'Carlos Acuña',
      },
    ],
    // MIÉRCOLES
    3: [
      {
        id: 'X1',
        inicio: '15:20',
        fin: '17:20',
        materia: 'Evaluación de Proyecto',
        nombre: 'Evaluación de Proyecto',
        docente: 'Carla Angela Maciel',
      },
      {
        id: 'X2',
        inicio: '17:30',
        fin: '19:20',
        materia: 'Redes',
        nombre: 'Instalación, Mantenimiento y Reparación de Redes',
        docente: 'Jorge Izaguirre',
      },
      {
        id: 'X3',
        inicio: '19:40',
        fin: '21:30',
        materia: 'Redes',
        nombre: 'Instalación, Mantenimiento y Reparación de Redes',
        docente: 'Jorge Izaguirre',
      },
    ],
    // JUEVES
    4: [
      {
        id: 'J1',
        inicio: '13:00',
        fin: '15:00',
        materia: 'Emprendimiento Productivo',
        nombre: 'Emprendimiento Productivo',
        docente: 'Fátima Anglada',
      },
      {
        id: 'J2',
        inicio: '15:20',
        fin: '17:20',
        materia: 'Modelos y Sistemas',
        nombre: 'Modelos y Sistemas',
        docente: 'Gustavo Oller',
      },
      {
        id: 'J3',
        inicio: '18:30',
        fin: '19:20',
        materia: 'Base de Datos',
        nombre: 'Base de Datos',
        docente: 'Carlos Acuña',
      },
      {
        id: 'J4',
        inicio: '19:40',
        fin: '21:30',
        materia: 'Base de Datos',
        nombre: 'Base de Datos',
        docente: 'Carlos Acuña',
      },
    ],
    // VIERNES
    5: [
      {
        id: 'V1',
        inicio: '17:30',
        fin: '19:20',
        materia: 'IMCR',
        nombre: 'Instalación, Mantenimiento y Reparación de Sistemas Computacionales',
        docente: 'Luis Alberto Salatino',
      },
      {
        id: 'V2',
        inicio: '19:40',
        fin: '21:30',
        materia: 'IMCR',
        nombre: 'Instalación, Mantenimiento y Reparación de Sistemas Computacionales',
        docente: 'Luis Alberto Salatino',
      },
    ],
  },
};

// Regla por defecto para cursos no listados en HORARIO_CURSOS:
//   1° a 3° (ciclo común) → 1ª hora · 4° a 7° → 2ª hora
// El curso viene como etiqueta '3°1' → el año es lo que va antes de '°'.
export function reglaPorDefecto(curso) {
  const anio = Number(String(curso ?? '').split('°')[0].replace(/[^\d]/g, '')) || 0;
  if (!anio) return [];
  return anio <= 3 ? ['P1'] : ['P2'];
}

export function horarioDeCurso(curso) {
  const propio = HORARIO_CURSOS[curso];
  return Array.isArray(propio) && propio.length ? propio : reglaPorDefecto(curso);
}

/**
 * Períodos de clase (sin recreo) de un curso para un día dado, en orden.
 * Si el curso tiene horario especial para ESE día (HORARIO_DIAS_CURSOS),
 * se usan esos bloques (con su horario propio y materia); si no, el horario
 * general (PERIODOS + HORARIO_CURSOS / regla por defecto).
 */
export function periodosDeCurso(curso, date = new Date()) {
  const especial = HORARIO_DIAS_CURSOS[curso]?.[date.getDay()];
  if (Array.isArray(especial) && especial.length) return especial;
  return horarioDeCurso(curso)
    .map((id) => PERIODOS.find((p) => p.id === id))
    .filter((p) => p && !p.recreo);
}

/** '07:20' → 440 */
export function aMinutos(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/** Minutos desde medianoche de una fecha. */
export function minutosDeFecha(date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function esDiaClase(date = new Date()) {
  return DIAS_CLASE.includes(date.getDay());
}

/** Período exacto en el que está ahora (incluye recreo), o null si es fuera de horario. */
export function periodoActual(date = new Date()) {
  const m = minutosDeFecha(date);
  return PERIODOS.find((p) => m >= aMinutos(p.inicio) && m < aMinutos(p.fin)) || null;
}

/**
 * Período de clase de un curso en el que se encuentra ahora (con márgenes), o null.
 * Ej.: a las 07:12 el curso de la 1ª hora ya puede escanear (10 min de margen).
 */
export function periodoDeCursoAhora(curso, date = new Date()) {
  if (!esDiaClase(date)) return null;
  const m = minutosDeFecha(date);
  return (
    periodosDeCurso(curso, date).find(
      (p) =>
        m >= aMinutos(p.inicio) - MARGEN_INICIO_MIN &&
        m <= aMinutos(p.fin) + MARGEN_FIN_MIN
    ) || null
  );
}

export function cursoEnClaseAhora(curso, date = new Date()) {
  return !!periodoDeCursoAhora(curso, date);
}

/**
 * Próxima clase de un curso (mirando el horario de CADA día).
 * Devuelve { periodo, cuando: 'hoy' | 'manana' | 'proxima' } o null.
 * ('proxima' = queda varios días hábiles después)
 */
export function proximaClase(curso, date = new Date()) {
  if (esDiaClase(date)) {
    const m = minutosDeFecha(date);
    const hoy = periodosDeCurso(curso, date).find((p) => m < aMinutos(p.inicio));
    if (hoy) return { periodo: hoy, cuando: 'hoy', fecha: date };
  }
  // Si hoy no queda nada (o no es día de clase): buscamos en los próximos días.
  for (let i = 1; i <= 7; i++) {
    const d = new Date(date.getTime() + i * 86400000);
    if (!esDiaClase(d)) continue;
    const ps = periodosDeCurso(curso, d);
    if (ps.length) return { periodo: ps[0], cuando: i === 1 ? 'manana' : 'proxima', fecha: d };
  }
  return null;
}
