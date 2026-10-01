import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import typography from '../theme/typography';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const STATUS_ORDER = ['presente', 'tarde', 'ausente'];
const STATUS_DOT_COLOR = { presente: 'success', tarde: 'warning', ausente: 'error' };

const pad = (n) => String(n).padStart(2, '0');
export const dateKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
export const todayKey = () => {
  const t = new Date();
  return dateKey(t.getFullYear(), t.getMonth(), t.getDate());
};

/**
 * Calendario mensual con puntos de estado por día.
 * - Verde: presentes · Amarillo: tarde · Rojo: ausentes
 * - Tocás un día para filtrar la lista de ese día
 * - Buscador de fecha exacta (dd/mm/aaaa o aaaa-mm-dd)
 */
export default function Calendar({ records = [], selectedDate, onSelect, showLegend = true }) {
  const { colors } = useTheme();
  const [view, setView] = useState(() => {
    const [y, m] = String(selectedDate || todayKey()).split('-').map(Number);
    return { year: y, month: (m || 1) - 1 };
  });
  const [query, setQuery] = useState('');
  const [queryError, setQueryError] = useState('');

  const statusByDate = useMemo(() => {
    const map = {};
    records.forEach((r) => {
      if (!map[r.date]) map[r.date] = new Set();
      map[r.date].add(r.status);
    });
    return map;
  }, [records]);

  const cells = useMemo(() => {
    const offset = (new Date(view.year, view.month, 1).getDay() + 6) % 7; // lunes primero
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const list = [];
    for (let i = 0; i < offset; i++) list.push(null);
    for (let d = 1; d <= daysInMonth; d++) list.push(d);
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [view]);

  const today = todayKey();

  const changeMonth = (delta) =>
    setView((v) => {
      let month = v.month + delta;
      let year = v.year;
      if (month < 0) { month = 11; year -= 1; }
      if (month > 11) { month = 0; year += 1; }
      return { year, month };
    });

  const goToExactDate = () => {
    const t = query.trim();
    let y, m, d;
    let match = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (match) {
      y = Number(match[1]); m = Number(match[2]); d = Number(match[3]);
    } else {
      match = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
      if (match) { d = Number(match[1]); m = Number(match[2]); y = Number(match[3]); }
    }
    const probe = match ? new Date(y, m - 1, d) : null;
    if (!probe || probe.getFullYear() !== y || probe.getMonth() !== m - 1 || probe.getDate() !== d) {
      setQueryError('Fecha inválida (ej: 15/01/2024)');
      return;
    }
    setQueryError('');
    setQuery('');
    setView({ year: y, month: m - 1 });
    onSelect(dateKey(y, m - 1, d));
  };

  const s = {
    container: {
      marginHorizontal: 16,
      marginTop: 8,
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    navButton: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navButtonText: { color: colors.text, fontSize: 18, fontWeight: '700' },
    monthLabel: { ...typography.h3, color: colors.text },
    weekdayRow: { flexDirection: 'row', marginBottom: 4 },
    weekdayText: {
      flexBasis: `${100 / 7}%`,
      textAlign: 'center',
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '700',
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
    cellToday: { borderWidth: 1.5, borderColor: colors.primary },
    dayText: { ...typography.caption, fontSize: 13, color: colors.text },
    dayTextSelected: { color: colors.onPrimary || colors.white, fontWeight: '800' },
    dotsRow: { flexDirection: 'row', marginTop: 2, height: 5 },
    dot: { width: 5, height: 5, borderRadius: 3, marginHorizontal: 1 },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
    searchInput: {
      flex: 1,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      ...typography.body,
      fontSize: 14,
      color: colors.text,
    },
    searchButton: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 9,
    },
    searchButtonText: {
      color: colors.onPrimary || colors.white,
      ...typography.button,
      fontSize: 14,
    },
    errorText: {
      ...typography.caption,
      color: colors.error,
      marginTop: 4,
    },
    legend: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { ...typography.caption, color: colors.textSecondary },
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity style={s.navButton} onPress={() => changeMonth(-1)}>
          <Text style={s.navButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.monthLabel}>{MONTHS[view.month]} {view.year}</Text>
        <TouchableOpacity style={s.navButton} onPress={() => changeMonth(1)}>
          <Text style={s.navButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={s.weekdayRow}>
        {WEEKDAYS.map((wd, i) => (
          <Text key={`${wd}-${i}`} style={s.weekdayText}>{wd}</Text>
        ))}
      </View>

      <View style={s.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`empty-${i}`} style={s.cell} />;
          const key = dateKey(view.year, view.month, day);
          const isSelected = key === selectedDate;
          const isToday = key === today;
          const statuses = statusByDate[key];
          return (
            <TouchableOpacity
              key={key}
              style={[s.cell, isSelected && s.cellSelected, isToday && !isSelected && s.cellToday]}
              onPress={() => onSelect(key)}
            >
              <Text style={[s.dayText, isSelected && s.dayTextSelected]}>{day}</Text>
              <View style={s.dotsRow}>
                {STATUS_ORDER.filter((st) => statuses?.has(st)).map((st) => (
                  <View
                    key={st}
                    style={[s.dot, { backgroundColor: colors[STATUS_DOT_COLOR[st]] }]}
                  />
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={s.searchRow}>
        <TextInput
          style={s.searchInput}
          placeholder="Ir a fecha: 15/01/2024"
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={(t) => { setQuery(t); setQueryError(''); }}
          onSubmitEditing={goToExactDate}
          returnKeyType="done"
        />
        <TouchableOpacity style={s.searchButton} onPress={goToExactDate}>
          <Text style={s.searchButtonText}>Ir</Text>
        </TouchableOpacity>
      </View>
      {queryError ? <Text style={s.errorText}>{queryError}</Text> : null}

      {showLegend && (
      <View style={s.legend}>
        {STATUS_ORDER.map((st) => (
          <View key={st} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: colors[STATUS_DOT_COLOR[st]] }]} />
            <Text style={s.legendText}>
              {st === 'presente' ? 'Presente' : st === 'tarde' ? 'Tarde' : 'Ausente'}
            </Text>
          </View>
        ))}
      </View>
      )}
    </View>
  );
}
