import { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import typography from '../theme/typography';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const ESTADO_COLOR = { presente: 'success', tarde: 'warning', ausente: 'error', justificado: 'info' };
const MAX_DOTS = 3;

const pad = (n) => String(n).padStart(2, '0');

export const dateKey = (anio, mes, dia) => `${anio}-${pad(mes + 1)}-${pad(dia)}`;

export const todayKey = () => {
  const hoy = new Date();
  return dateKey(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
};

const esFecha = (valor) => valor instanceof Date || typeof valor?.toDate === 'function';

const keyDesde = (valor) => {
  if (!valor) return null;
  if (esFecha(valor)) {
    const fecha = valor instanceof Date ? valor : valor.toDate();
    if (fecha instanceof Date && !Number.isNaN(fecha.getTime())) {
      return dateKey(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    }
    return null;
  }
  if (typeof valor === 'string') {
    const limpio = valor.trim().slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(limpio) ? limpio : null;
  }
  return null;
};

const mesIndexDesde = (mes) => {
  const numero = Number(mes);
  if (!Number.isFinite(numero)) return null;
  return numero >= 1 && numero <= 12 ? numero - 1 : numero;
};

const vistaDesde = ({ mes, anio, selectedDate }) => {
  const anioNumero = Number(anio);
  const mesNumero = mesIndexDesde(mes);
  if (Number.isFinite(anioNumero) && mesNumero !== null) {
    return { year: anioNumero, month: Math.min(Math.max(mesNumero, 0), 11) };
  }
  const clave = keyDesde(selectedDate) ?? todayKey();
  const [year, month] = clave.split('-').map(Number);
  return { year, month: month - 1 };
};

/**
 * Calendario mensual reutilizable (sin dependencias externas).
 * - `marcados`: array de fechas ('YYYY-MM-DD', Date, Timestamp) u objetos { fecha, estado }
 * - `eventos`: mismo formato que `marcados` (se normalizan juntos)
 * - `onSelect(fechaKey)`: se dispara al tocar un día
 * - `selectedDate`: día resaltado (controlado desde la pantalla)
 * - `mes` / `anio`: mes y año iniciales (mes 1..12 o índice 0..11)
 * - `color`: clave del tema ('primary') o color literal para el punto de día marcado
 */
export default function Calendar({
  marcados = [],
  eventos = [],
  onSelect,
  selectedDate,
  mes,
  anio,
  color,
}) {
  const { colors } = useTheme();
  const acento = color ? colors[color] || color : colors.primary;

  const [view, setView] = useState(() => vistaDesde({ mes, anio, selectedDate }));

  useEffect(() => {
    const clave = keyDesde(selectedDate);
    if (!clave) return;
    const [year, month] = clave.split('-').map(Number);
    setView((actual) => (actual.year === year && actual.month === month - 1 ? actual : { year, month: month - 1 }));
  }, [selectedDate]);

  const marcasPorDia = useMemo(() => {
    const mapa = new Map();
    const agregar = (item) => {
      if (!item) return;
      if (typeof item === 'string' || esFecha(item)) {
        const clave = keyDesde(item);
        if (clave && !mapa.has(clave)) mapa.set(clave, { estados: [] });
        return;
      }
      const clave = keyDesde(item.fecha ?? item.date ?? item.fechaKey);
      if (!clave) return;
      const estados = Array.isArray(item.estados)
        ? item.estados
        : [item.estado ?? item.status].filter(Boolean);
      const previa = mapa.get(clave);
      if (!previa) {
        mapa.set(clave, { estados: [...estados] });
        return;
      }
      estados.forEach((estado) => {
        if (!previa.estados.includes(estado)) previa.estados.push(estado);
      });
    };
    marcados.forEach(agregar);
    eventos.forEach(agregar);
    return mapa;
  }, [marcados, eventos]);

  const celdas = useMemo(() => {
    const offset = (new Date(view.year, view.month, 1).getDay() + 6) % 7;
    const diasDelMes = new Date(view.year, view.month + 1, 0).getDate();
    const lista = [];
    for (let i = 0; i < offset; i += 1) lista.push(null);
    for (let dia = 1; dia <= diasDelMes; dia += 1) lista.push(dia);
    while (lista.length % 7 !== 0) lista.push(null);
    return lista;
  }, [view]);

  const hoy = todayKey();
  const claveSeleccionada = keyDesde(selectedDate);

  const enMes = useMemo(() => {
    let total = 0;
    marcasPorDia.forEach((_, clave) => {
      const [year, month] = clave.split('-').map(Number);
      if (year === view.year && month - 1 === view.month) total += 1;
    });
    return total;
  }, [marcasPorDia, view]);

  const cambiarMes = (delta) =>
    setView((actual) => {
      let month = actual.month + delta;
      let year = actual.year;
      if (month < 0) {
        month = 11;
        year -= 1;
      }
      if (month > 11) {
        month = 0;
        year += 1;
      }
      return { year, month };
    });

  const irAHoy = () => {
    const clave = todayKey();
    const [year, month] = clave.split('-').map(Number);
    setView({ year, month: month - 1 });
    onSelect?.(clave);
  };

  const seleccionar = (clave) => {
    if (onSelect) onSelect(clave);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 12,
          marginHorizontal: 16,
          marginTop: 8,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        },
        navButton: {
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: colors.surfaceVariant,
          alignItems: 'center',
          justifyContent: 'center',
        },
        monthRow: { flexDirection: 'row', alignItems: 'center' },
        monthLabel: { ...typography.h3, color: colors.text, marginHorizontal: 12 },
        weekdayRow: { flexDirection: 'row', marginBottom: 4 },
        weekdayText: {
          flexBasis: `${100 / 7}%`,
          textAlign: 'center',
          ...typography.caption,
          fontSize: 12,
          fontWeight: '700',
          color: colors.textSecondary,
        },
        grid: { flexDirection: 'row', flexWrap: 'wrap' },
        cell: {
          flexBasis: `${100 / 7}%`,
          height: 42,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 10,
          marginVertical: 1,
        },
        cellSelected: { backgroundColor: colors.primary },
        dayText: { ...typography.caption, fontSize: 13, color: colors.text },
        dayTextSelected: { color: colors.onPrimary || colors.white, fontWeight: '800' },
        dotsRow: { flexDirection: 'row', marginTop: 2, height: 6, alignItems: 'center' },
        dot: { width: 5, height: 5, borderRadius: 3, marginHorizontal: 1 },
        footer: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 10,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
        footerDot: { width: 8, height: 8, borderRadius: 4 },
        footerText: { ...typography.caption, fontSize: 12, color: colors.textSecondary },
        todayButton: {
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
        },
        todayButtonText: { ...typography.caption, fontSize: 12, fontWeight: '600', color: colors.primary },
      }),
    [colors]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => cambiarMes(-1)}
          accessibilityLabel="Mes anterior"
        >
          <MaterialCommunityIcons name="chevron-left" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.monthRow}>
          <MaterialCommunityIcons name="calendar-month-outline" size={18} color={acento} />
          <Text style={styles.monthLabel}>
            {MONTHS[view.month]} {view.year}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => cambiarMes(1)}
          accessibilityLabel="Mes siguiente"
        >
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((dia, index) => (
          <Text key={`${dia}-${index}`} style={styles.weekdayText}>
            {dia}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {celdas.map((dia, index) => {
          if (!dia) return <View key={`vacio-${index}`} style={styles.cell} />;
          const clave = dateKey(view.year, view.month, dia);
          const marcado = marcasPorDia.get(clave);
          const seleccionado = clave === claveSeleccionada;
          const esHoy = clave === hoy;
          return (
            <TouchableOpacity
              key={clave}
              style={[
                styles.cell,
                esHoy && !seleccionado && { borderWidth: 1.5, borderColor: acento },
                seleccionado && styles.cellSelected,
              ]}
              onPress={() => seleccionar(clave)}
              accessibilityLabel={`Día ${dia} de ${MONTHS[view.month]} de ${view.year}`}
            >
              <Text style={[styles.dayText, seleccionado && styles.dayTextSelected]}>{dia}</Text>
              <View style={styles.dotsRow}>
                {(marcado?.estados || []).slice(0, MAX_DOTS).map((estado) => (
                  <View
                    key={estado}
                    style={[
                      styles.dot,
                      { backgroundColor: colors[ESTADO_COLOR[estado]] || acento },
                    ]}
                  />
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <View style={[styles.footerDot, { backgroundColor: acento }]} />
          <Text style={styles.footerText}>
            {enMes === 1 ? '1 día con novedades' : `${enMes} días con novedades`}
          </Text>
        </View>
        <TouchableOpacity style={styles.todayButton} onPress={irAHoy}>
          <MaterialCommunityIcons name="target" size={14} color={colors.primary} />
          <Text style={styles.todayButtonText}>Hoy</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
