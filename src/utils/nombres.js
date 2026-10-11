// src/utils/nombres.js — cómo se muestran los alumnos en las listas.
//
// El listado de Eventos está ordenado por APELLIDO (y agrupado por su
// inicial), así que cada alumno se muestra "Apellido, Nombre": se lee de
// corrido con el orden de la lista y con el filtro de letras.
//
// Los datos REALES (Firestore) traen nombre y apellido por separado; la lista
// de ejemplo de EventsScreen guarda el nombre completo en `student`
// ("Juan Pérez" → "Pérez, Juan"). Módulo puro (sin React Native) para poder
// probarlo directo con Node.
export const nombreParaMostrar = (item) => {
  if (item?.apellido) return [item.apellido, item.nombre].filter(Boolean).join(', ');
  const partes = String(item?.student ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (partes.length < 2) return partes[0] || '—';
  return `${partes[partes.length - 1]}, ${partes.slice(0, -1).join(' ')}`;
};
