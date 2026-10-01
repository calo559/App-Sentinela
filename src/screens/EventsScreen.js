import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../theme/colors';
import typography from '../theme/typography';
import Card from '../components/Card';
import Header from '../components/Header';
import Calendar from '../components/Calendar';
import { attendance, courses, students, formatDateKey, toDateKey, todayKey } from '../services/firestore';
import { notify } from '../utils/notify';


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
  },
  justificado: {
    label: 'Justificado',
    color: colors.primary,
    icon: '📄',
    bgOpacity: '20'
  }
};

export default function EventsScreen({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos'); // 'todos', 'presente', 'tarde', 'ausente'
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [registros, setRegistros] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [usandoDemo, setUsandoDemo] = useState(false);
  const listaRef = useRef(null);
  const avisarAlCargar = useRef(false);

  useEffect(() => {
    let vigente = true;
    setCargando(true);

    const cargar = async () => {
      try {
        const datos = await attendance.obtenerAsistenciasPorFecha(selectedDate);

        const alumnos = await students.obtenerMapaAlumnos(datos.map((item) => item.alumnoId));
        const mapaCursos = await courses.obtenerMapaCursos(datos.map((item) => item.cursoId));

        if (!vigente) return;

        setRegistros(
          datos.map((item) => ({
            id: item.id,
            alumnoId: item.alumnoId,
            cursoId: item.cursoId,
            student: alumnos[item.alumnoId]?.nombreCompleto ?? 'Alumno',
            course: mapaCursos[item.cursoId]?.nombre ?? '-',
            date: item.fechaKey ?? selectedDate,
            time: item.horaTexto ?? '-',
            status: item.estado,
            observations: item.observaciones || '-'
          }))
        );
        setUsandoDemo(false);

        if (avisarAlCargar.current) {
          avisarAlCargar.current = false;
          notify(
            formatDateKey(selectedDate),
            datos.length
              ? `${datos.length} ${datos.length === 1 ? 'registro' : 'registros'} de asistencia`
              : 'Sin registros de asistencia para ese día'
          );
        }
      } catch (error) {
        if (vigente) setUsandoDemo(true);
        if (avisarAlCargar.current) avisarAlCargar.current = false;
      } finally {
        if (vigente) setCargando(false);
      }
    };

    cargar();
    return () => {
      vigente = false;
    };
  }, [selectedDate]);

  // Fechas con movimientos para marcar en el calendario
  useEffect(() => {
    let vigente = true;

    const cargarMarcas = async () => {
      try {
        const ultimas = await attendance.obtenerUltimasAsistencias({ limite: 200 });
        if (vigente) setMarcas(ultimas);
      } catch (error) {
        if (vigente) setMarcas([]);
      }
    };

    cargarMarcas();
    return () => {
      vigente = false;
    };
  }, []);

  const base = registros;

  // Días marcados para el calendario (a partir de asistencias de Firestore)
  const diasMarcados = useMemo(() => {
    const mapa = new Map();
    const agregar = (clave, estado) => {
      if (!clave) return;
      const previa = mapa.get(clave);
      if (!previa) {
        mapa.set(clave, { fecha: clave, estados: estado ? [estado] : [] });
        return;
      }
      if (estado && !previa.estados.includes(estado)) previa.estados.push(estado);
    };

    marcas.forEach((item) => agregar(item.fechaKey ?? toDateKey(item.fecha), item.estado));
    base.forEach((item) => agregar(item.date, item.status));

    return [...mapa.entries()].flatMap(([clave, estados]) =>
      estados.length ? estados.map((estado) => ({ fecha: clave, estado })) : [{ fecha: clave }]
    );
  }, [marcas, base]);

  // Filtrar historial
  const filteredHistory = useMemo(() => {
    const term = searchText.trim().toLowerCase();

    return base.filter(item => {
      const matchesSearch = !term ||
                          item.student.toLowerCase().includes(term) ||
                          item.course.toLowerCase().includes(term);
      const matchesStatus = filterStatus === 'todos' || item.status === filterStatus;
      const matchesDate = item.date === selectedDate;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [base, searchText, filterStatus, selectedDate]);

  const getStatusStyle = (status) => {
    const config = statusConfig[status] ?? statusConfig.ausente;
    return {
      backgroundColor: config.color + config.bgOpacity,
      borderLeftColor: config.color,
    };
  };

  const formatDate = (dateString) => {
    const [year, month, day] = String(dateString).split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatsForDate = (date) => {
    const dayRecords = base.filter(item => item.date === date);
    const presentes = dayRecords.filter(item => item.status === 'presente').length;
    const tarde = dayRecords.filter(item => item.status === 'tarde').length;
    const ausentes = dayRecords.filter(item => item.status === 'ausente').length;
    return { presentes, tarde, ausentes, total: dayRecords.length };
  };

  const stats = getStatsForDate(selectedDate);

  const seleccionarDia = (fecha) => {
    avisarAlCargar.current = true;
    setSelectedDate(fecha);
    listaRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const renderListHeader = () => (
    <>
      <Calendar
        eventos={diasMarcados}
        selectedDate={selectedDate}
        onSelect={seleccionarDia}
        color="primary"
      />

      {/* Resumen del día */}
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Resumen del {formatDate(selectedDate)}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.success }]}>{stats.presentes}</Text>
            <Text style={styles.statLabel}>Presentes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.warning }]}>{stats.tarde}</Text>
            <Text style={styles.statLabel}>Llegadas tarde</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.error }]}>{stats.ausentes}</Text>
            <Text style={styles.statLabel}>Ausentes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </Card>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchBox}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por alumno o curso..."
            placeholderTextColor={colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <View style={styles.statusFilters}>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'todos' && styles.filterChipActive]}
            onPress={() => setFilterStatus('todos')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'todos' && styles.filterChipTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'presente' && styles.filterChipActive]}
            onPress={() => setFilterStatus('presente')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'presente' && styles.filterChipTextActive]}>
              ✓ Presentes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'tarde' && styles.filterChipActive]}
            onPress={() => setFilterStatus('tarde')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'tarde' && styles.filterChipTextActive]}>
              ⏰ Tarde
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterStatus === 'ausente' && styles.filterChipActive]}
            onPress={() => setFilterStatus('ausente')}
          >
            <Text style={[styles.filterChipText, filterStatus === 'ausente' && styles.filterChipTextActive]}>
              ✗ Ausentes
            </Text>
          </TouchableOpacity>
        </View>

        {usandoDemo && (
          <Text style={styles.demoText}>Sin conexión con Firestore</Text>
        )}
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <Header 
        title="Historial de Asistencia" 
        subtitle="Registro completo de asistencia por día"
      />

      <FlatList
        ref={listaRef}
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={
          cargando ? (
            <ActivityIndicator style={styles.loader} color={colors.primary} />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No hay registros para mostrar</Text>
              <Text style={styles.emptySubtext}>Prueba con otros filtros o fecha</Text>
            </View>
          )
        }
        ListFooterComponent={
          cargando && filteredHistory.length ? (
            <ActivityIndicator style={styles.loader} color={colors.primary} />
          ) : null
        }
        renderItem={({ item }) => {
          const status = statusConfig[item.status] ?? statusConfig.ausente;
          return (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() =>
                notify(
                  item.student,
                  `${item.course} · ${status.label}${item.time !== '-' ? ` · ${item.time} hs` : ''}`
                )
              }
            >
              <Card style={[styles.eventCard, getStatusStyle(item.status)]}>
                <View style={styles.eventRow}>
                  <View style={styles.eventInfo}>
                    <Text style={styles.studentName}>{item.student}</Text>
                    <Text style={styles.studentCourse}>{item.course}</Text>
                    {item.observations !== '-' && (
                      <Text style={styles.observations}>📝 {item.observations}</Text>
                    )}
                  </View>
                  <View style={styles.rightInfo}>
                    <View style={[styles.statusBadge, { backgroundColor: status.color + '15' }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>
                        {status.icon} {status.label}
                      </Text>
                    </View>
                    {item.time !== '-' && (
                      <Text style={styles.timeText}>🕐 {item.time} hs</Text>
                    )}
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
      />

      {/* Botón para generar reporte */}
      <TouchableOpacity 
        style={styles.reportButton}
        onPress={() => {
          notify('Generar reporte', `Reporte de asistencia del ${formatDate(selectedDate)} generado`);
        }}
      >
        <MaterialCommunityIcons name="chart-box-outline" size={18} color={colors.white} />
        <Text style={styles.reportButtonText}>Generar reporte del día</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
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
    backgroundColor: colors.white,
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
  demoText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.warning,
    marginTop: 10,
    textAlign: 'center',
  },
  loader: {
    marginTop: 32,
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
    color: colors.white,
    fontWeight: '600',
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
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  reportButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: 'bold',
  },
});
