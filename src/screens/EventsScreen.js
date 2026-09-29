import { View, Text, FlatList, TouchableOpacity, TextInput, Share } from 'react-native';
import { notify } from '../utils/notify';
import { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import typography from '../theme/typography';
import Card from '../components/Card';
import Header from '../components/Header';
import Calendar from '../components/Calendar';
import { getActiveUser } from '../services/authService';

// Fechas relativas a hoy para que siempre se vean en el año/mes actual
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const DAY0 = daysAgo(0);
const DAY1 = daysAgo(1);
const DAY2 = daysAgo(2);

// course usa el mismo formato que el registro: curso + división (ej: "3°1")
const attendanceHistory = [
  {
    id: '1',
    student: 'Juan Pérez',
    course: '3°1',
    date: DAY0,
    time: '08:15',
    status: 'presente',
    observations: 'Llegó temprano'
  },
  {
    id: '2',
    student: 'María López',
    course: '3°1',
    date: DAY0,
    time: '08:45',
    status: 'tarde',
    observations: 'Justificó llegada tarde'
  },
  {
    id: '3',
    student: 'Carlos Gómez',
    course: '3°1',
    date: DAY0,
    time: '-',
    status: 'ausente',
    observations: 'Sin aviso'
  },
  {
    id: '4',
    student: 'Ana Martínez',
    course: '3°1',
    date: DAY0,
    time: '08:10',
    status: 'presente',
    observations: '-'
  },
  {
    id: '5',
    student: 'Bruno Díaz',
    course: '3°1',
    date: DAY0,
    time: '08:12',
    status: 'presente',
    observations: '-'
  },
  {
    id: '6',
    student: 'Camila Ruiz',
    course: '3°1',
    date: DAY0,
    time: '08:52',
    status: 'tarde',
    observations: 'Problemas de transporte'
  },
  {
    id: '7',
    student: 'Diego Sosa',
    course: '3°1',
    date: DAY0,
    time: '-',
    status: 'ausente',
    observations: 'Presentó justificación médica'
  },
  {
    id: '8',
    student: 'Emilia Vega',
    course: '3°1',
    date: DAY0,
    time: '08:08',
    status: 'presente',
    observations: '-'
  },
  {
    id: '9',
    student: 'Lucas Rodríguez',
    course: '3°1',
    date: DAY1,
    time: '08:20',
    status: 'presente',
    observations: '-'
  },
  {
    id: '10',
    student: 'María López',
    course: '3°1',
    date: DAY1,
    time: '08:14',
    status: 'presente',
    observations: '-'
  },
  {
    id: '11',
    student: 'Sofía Fernández',
    course: '3°1',
    date: DAY1,
    time: '08:50',
    status: 'tarde',
    observations: 'Problemas de transporte'
  },
  {
    id: '12',
    student: 'Tomás Díaz',
    course: '3°1',
    date: DAY2,
    time: '-',
    status: 'ausente',
    observations: 'Presentó justificación médica'
  },
  {
    id: '13',
    student: 'Ana Martínez',
    course: '3°1',
    date: DAY2,
    time: '08:10',
    status: 'presente',
    observations: '-'
  },
  // Otros cursos: NO se muestran al alumno de 3°1
  {
    id: '14',
    student: 'Pedro Gómez',
    course: '4°2',
    date: DAY0,
    time: '08:15',
    status: 'presente',
    observations: '-'
  },
  {
    id: '15',
    student: 'Rocío Mena',
    course: '5°3',
    date: DAY0,
    time: '-',
    status: 'ausente',
    observations: 'Sin aviso'
  },
];

export default function EventsScreen({ navigation }) {
  const { colors } = useTheme();
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [letterFilter, setLetterFilter] = useState('Todas');
  const [selectedDate, setSelectedDate] = useState(() => {
    // arranca en el día con registros más recientes (si no, hoy)
    const dates = attendanceHistory.map((i) => i.date).sort();
    return dates[dates.length - 1] || new Date().toISOString().split('T')[0];
  });

  const statusConfig = {
    presente: {
      label: 'Presente',
      color: colors.success,
      icon: '✓',
      bgOpacity: '20'
    },
    tarde: {
      label: 'Llegó tarde',
      color: colors.warning,
      icon: '⏰',
      bgOpacity: '20'
    },
    ausente: {
      label: 'Ausente',
      color: colors.error,
      icon: '✗',
      bgOpacity: '20'
    }
  };

  const activeUser = getActiveUser();
  // El alumno/preceptor ve solo SU curso; el docente (sin curso asignado) ve todos
  const myCourse =
    activeUser?.curso && activeUser?.division ? `${activeUser.curso}${activeUser.division}` : null;
  const courseRecords = myCourse
    ? attendanceHistory.filter((item) => item.course === myCourse)
    : attendanceHistory;

  // Inicial seguro aunque el nombre venga vacío
  const initial = (name) => {
    const first = String(name ?? '').trim().charAt(0);
    return first ? first.toUpperCase() : '?';
  };

  const filteredHistory = courseRecords.filter(item => {
    const matchesSearch = item.student.toLowerCase().includes(searchText.toLowerCase()) ||
      item.course.toLowerCase().includes(searchText.toLowerCase());
    // "Presentes" incluye a los que llegaron tarde (asistieron igual)
    const matchesStatus =
      filterStatus === 'todos' ||
      (filterStatus === 'presentes'
        ? item.status === 'presente' || item.status === 'tarde'
        : item.status === filterStatus);
    const matchesDate = item.date === selectedDate;
    const matchesLetter = letterFilter === 'Todas' || initial(item.student) === letterFilter;

    return matchesSearch && matchesStatus && matchesDate && matchesLetter;
  });

  // Agrupado alfabéticamente por inicial del alumno
  const grouped = (() => {
    const sorted = [...filteredHistory].sort((a, b) => a.student.localeCompare(b.student, 'es'));
    const out = [];
    let lastLetter = null;
    sorted.forEach((item) => {
      const letter = initial(item.student);
      if (letter !== lastLetter) {
        out.push({ type: 'header', letter, id: `header-${letter}` });
        lastLetter = letter;
      }
      out.push({ type: 'item', id: item.id, item });
    });
    return out;
  })();

  // Letras disponibles para el filtro (de los registros del curso, del día)
  const availableLetters = [...new Set(
    courseRecords
      .filter((i) => i.date === selectedDate)
      .map((i) => initial(i.student))
  )].sort();

  const getStatusConfig = (status) =>
    statusConfig[status] || {
      label: status ? String(status) : '—',
      color: colors.textSecondary,
      icon: '•',
      bgOpacity: '20',
    };

  const getStatusStyle = (status) => {
    const config = getStatusConfig(status);
    return {
      backgroundColor: config.color + config.bgOpacity,
      borderLeftColor: config.color,
    };
  };

  const formatDate = (dateString) => {
    // Parseo manual: "YYYY-MM-DD" con new Date() se interpreta en UTC y puede mostrar un día menos
    const [y, m, d] = String(dateString).split('-').map(Number);
    if (!y || !m || !d) return dateString;
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(y, m - 1, d).toLocaleDateString('es-AR', options);
  };

  const getStatsForDate = (date) => {
    const dayRecords = courseRecords.filter(item => item.date === date);
    const presentes = dayRecords.filter(item => item.status === 'presente').length;
    const tarde = dayRecords.filter(item => item.status === 'tarde').length;
    const ausentes = dayRecords.filter(item => item.status === 'ausente').length;
    return { presentes, tarde, ausentes, total: dayRecords.length };
  };

  const stats = getStatsForDate(selectedDate);

  const s = useMemo(() => ({
    container: { flex: 1, backgroundColor: colors.background },
    dateSelector: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    dateLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    dateButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    dateButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.border,
      marginRight: 8,
    },
    dateButtonActive: {
      backgroundColor: colors.primary,
    },
    dateButtonText: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    dateButtonTextActive: {
      color: colors.onPrimary || colors.white,
      fontWeight: '600',
    },
    summaryCard: {
      marginHorizontal: 16,
      marginVertical: 8,
      padding: 16,
    },
    summaryTitle: {
      ...typography.body,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statNumber: {
      ...typography.h2,
      fontSize: 24,
      fontWeight: 'bold',
    },
    statLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 4,
    },
    statDivider: {
      width: 1,
      height: 30,
      backgroundColor: colors.border,
    },
    filtersContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
    },
    searchBox: {
      marginBottom: 12,
    },
    searchInput: {
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      ...typography.body,
      color: colors.text,
    },
    statusFilters: {
      flexDirection: 'row',
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
    },
    filterChipText: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    filterChipTextActive: {
      color: colors.onPrimary || colors.white,
      fontWeight: '600',
    },
    letterFilters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 10,
    },
    letterChip: {
      minWidth: 30,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 8,
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.border,
    },
    letterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    letterChipText: {
      ...typography.caption,
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    letterChipTextActive: {
      color: colors.onPrimary || colors.white,
    },
    groupHeader: {
      paddingHorizontal: 20,
      paddingTop: 14,
      paddingBottom: 4,
    },
    groupHeaderText: {
      ...typography.h3,
      fontSize: 16,
      color: colors.primary,
      fontWeight: '800',
    },
    list: {
      paddingHorizontal: 16,
      paddingBottom: 80,
    },
    eventCard: {
      marginBottom: 8,
      borderLeftWidth: 4,
    },
    eventRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    eventInfo: {
      flex: 1,
    },
    studentName: {
      ...typography.body,
      fontWeight: '600',
      color: colors.text,
    },
    studentCourse: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    observations: {
      ...typography.caption,
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 4,
      fontStyle: 'italic',
    },
    rightInfo: {
      alignItems: 'flex-end',
    },
    statusBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 4,
    },
    statusText: {
      ...typography.caption,
      fontSize: 12,
      fontWeight: '600',
    },
    timeText: {
      ...typography.caption,
      fontSize: 11,
      color: colors.textSecondary,
    },
    emptyContainer: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyIcon: {
      fontSize: 48,
      marginBottom: 16,
    },
    emptyText: {
      ...typography.body,
      color: colors.textSecondary,
    },
    emptySubtext: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 4,
    },
    reportButton: {
      position: 'absolute',
      bottom: 20,
      right: 20,
      left: 20,
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    reportButtonText: {
      ...typography.button,
      color: colors.onPrimary || colors.white,
      fontWeight: 'bold',
    },
  }), [colors]);

  const renderListHeader = () => (
    <>
      <Calendar
        records={courseRecords}
        selectedDate={selectedDate}
        onSelect={(date) => {
          setSelectedDate(date);
          // Si la nueva fecha no tiene registros de la letra elegida, limpiamos el filtro
          setLetterFilter('Todas');
        }}
      />

      <Card style={s.summaryCard}>
        <Text style={s.summaryTitle}>Resumen del {formatDate(selectedDate)}</Text>
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={[s.statNumber, { color: colors.success }]}>{stats.presentes}</Text>
            <Text style={s.statLabel}>Presentes</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={[s.statNumber, { color: colors.warning }]}>{stats.tarde}</Text>
            <Text style={s.statLabel}>Llegadas tarde</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={[s.statNumber, { color: colors.error }]}>{stats.ausentes}</Text>
            <Text style={s.statLabel}>Ausentes</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={[s.statNumber, { color: colors.primary }]}>{stats.total}</Text>
            <Text style={s.statLabel}>Total</Text>
          </View>
        </View>
      </Card>

      <View style={s.filtersContainer}>
        <View style={s.searchBox}>
          <TextInput
            style={s.searchInput}
            placeholder="Buscar por alumno o curso..."
            placeholderTextColor={colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View style={s.statusFilters}>
          <TouchableOpacity
            style={[s.filterChip, filterStatus === 'todos' && s.filterChipActive]}
            onPress={() => setFilterStatus('todos')}
          >
            <Text style={[s.filterChipText, filterStatus === 'todos' && s.filterChipTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.filterChip, filterStatus === 'presentes' && s.filterChipActive]}
            onPress={() => setFilterStatus('presentes')}
          >
            <Text style={[s.filterChipText, filterStatus === 'presentes' && s.filterChipTextActive]}>
              ✓ Presentes (con tarde)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.filterChip, filterStatus === 'tarde' && s.filterChipActive]}
            onPress={() => setFilterStatus('tarde')}
          >
            <Text style={[s.filterChipText, filterStatus === 'tarde' && s.filterChipTextActive]}>
              ⏰ Tarde
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.filterChip, filterStatus === 'ausente' && s.filterChipActive]}
            onPress={() => setFilterStatus('ausente')}
          >
            <Text style={[s.filterChipText, filterStatus === 'ausente' && s.filterChipTextActive]}>
              ✗ Ausentes
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filtro alfabético por inicial */}
        <View style={s.letterFilters}>
          <TouchableOpacity
            style={[s.letterChip, letterFilter === 'Todas' && s.letterChipActive]}
            onPress={() => setLetterFilter('Todas')}
          >
            <Text style={[s.letterChipText, letterFilter === 'Todas' && s.letterChipTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>
          {availableLetters.map((letter) => (
            <TouchableOpacity
              key={letter}
              style={[s.letterChip, letterFilter === letter && s.letterChipActive]}
              onPress={() => setLetterFilter(letter === letterFilter ? 'Todas' : letter)}
            >
              <Text style={[s.letterChipText, letterFilter === letter && s.letterChipTextActive]}>
                {letter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  );

  return (
    <View style={s.container}>
      <Header
        title="Historial de Asistencia"
        subtitle="Registro completo de asistencia por día"
      />

      <FlatList
        data={grouped}
        keyExtractor={(row) => row.id}
        contentContainerStyle={s.list}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={
          <View style={s.emptyContainer}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyText}>No hay registros para mostrar</Text>
            <Text style={s.emptySubtext}>Prueba con otros filtros o fecha</Text>
          </View>
        }
        renderItem={({ item: row }) => {
          if (row.type === 'header') {
            return (
              <View style={s.groupHeader}>
                <Text style={s.groupHeaderText}>{row.letter}</Text>
              </View>
            );
          }
          const item = row.item;
          const status = getStatusConfig(item.status);
          return (
            <TouchableOpacity
              onPress={() => notify(
                item.student,
                `${item.course} · ${status.label}\n🕐 ${item.time} hs\n📝 ${item.observations}`
              )}
            >
              <Card style={[s.eventCard, getStatusStyle(item.status)]}>
                <View style={s.eventRow}>
                  <View style={s.eventInfo}>
                    <Text style={s.studentName}>{item.student}</Text>
                    <Text style={s.studentCourse}>{item.course}</Text>
                    {item.observations !== '-' && (
                      <Text style={s.observations}>📝 {item.observations}</Text>
                    )}
                  </View>
                  <View style={s.rightInfo}>
                    <View style={[s.statusBadge, { backgroundColor: status.color + '15' }]}>
                      <Text style={[s.statusText, { color: status.color }]}>
                        {status.icon} {status.label}
                      </Text>
                    </View>
                    {item.time !== '-' && (
                      <Text style={s.timeText}>🕐 {item.time} hs</Text>
                    )}
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={s.reportButton}
        onPress={async () => {
          const lines = filteredHistory.map((r) => `• ${r.student} (${r.course}): ${r.status} ${r.time}`).join('\n');
          try {
            await Share.share({
              message: `Reporte de asistencia del ${formatDate(selectedDate)}\nPresentes: ${stats.presentes} · Tarde: ${stats.tarde} · Ausentes: ${stats.ausentes} · Total: ${stats.total}\n\n${lines || 'Sin registros'}`,
            });
          } catch (error) {
            notify('Error', 'No se pudo compartir el reporte');
          }
        }}
      >
        <Text style={s.reportButtonText}>📊 Generar reporte del día</Text>
      </TouchableOpacity>
    </View>
  );
}
