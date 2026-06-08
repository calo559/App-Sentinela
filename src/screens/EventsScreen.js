import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import colors from '../theme/colors';
import typography from '../theme/typography';
import Card from '../components/Card';
import Header from '../components/Header';

// Datos de historial de asistencia (simulados)
const attendanceHistory = [
  { 
    id: '1', 
    student: 'Juan Pérez', 
    course: '3° A', 
    date: '2024-01-15', 
    time: '08:15', 
    status: 'presente',
    observations: 'Llegó temprano'
  },
  { 
    id: '2', 
    student: 'María López', 
    course: '4° B', 
    date: '2024-01-15', 
    time: '08:45', 
    status: 'tarde',
    observations: 'Justificó llegada tarde'
  },
  { 
    id: '3', 
    student: 'Carlos Gómez', 
    course: '5° C', 
    date: '2024-01-15', 
    time: '-', 
    status: 'ausente',
    observations: 'Sin aviso'
  },
  { 
    id: '4', 
    student: 'Ana Martínez', 
    course: '3° A', 
    date: '2024-01-14', 
    time: '08:10', 
    status: 'presente',
    observations: '-'
  },
  { 
    id: '5', 
    student: 'Lucas Rodríguez', 
    course: '4° B', 
    date: '2024-01-14', 
    time: '08:20', 
    status: 'presente',
    observations: '-'
  },
  { 
    id: '6', 
    student: 'Sofía Fernández', 
    course: '5° C', 
    date: '2024-01-14', 
    time: '08:50', 
    status: 'tarde',
    observations: 'Problemas de transporte'
  },
  { 
    id: '7', 
    student: 'Tomás Díaz', 
    course: '3° A', 
    date: '2024-01-13', 
    time: '-', 
    status: 'ausente',
    observations: 'Presentó justificación médica'
  },
];

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

export default function EventsScreen({ navigation }) {
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos'); // 'todos', 'presente', 'tarde', 'ausente'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Filtrar historial
  const filteredHistory = attendanceHistory.filter(item => {
    const matchesSearch = item.student.toLowerCase().includes(searchText.toLowerCase()) ||
                          item.course.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || item.status === filterStatus;
    const matchesDate = item.date === selectedDate;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Obtener fechas únicas para el selector
  const uniqueDates = [...new Set(attendanceHistory.map(item => item.date))];

  const getStatusStyle = (status) => {
    const config = statusConfig[status];
    return {
      backgroundColor: config.color + config.bgOpacity,
      borderLeftColor: config.color,
    };
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-AR', options);
  };

  const getStatsForDate = (date) => {
    const dayRecords = attendanceHistory.filter(item => item.date === date);
    const presentes = dayRecords.filter(item => item.status === 'presente').length;
    const tarde = dayRecords.filter(item => item.status === 'tarde').length;
    const ausentes = dayRecords.filter(item => item.status === 'ausente').length;
    return { presentes, tarde, ausentes, total: dayRecords.length };
  };

  const stats = getStatsForDate(selectedDate);

  return (
    <View style={styles.container}>
      <Header 
        title="Historial de Asistencia" 
        subtitle="Registro completo de asistencia por día"
      />

      {/* Selector de fecha */}
      <View style={styles.dateSelector}>
        <Text style={styles.dateLabel}>Fecha:</Text>
        <View style={styles.dateButtons}>
          {uniqueDates.map(date => (
            <TouchableOpacity
              key={date}
              style={[styles.dateButton, selectedDate === date && styles.dateButtonActive]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[styles.dateButtonText, selectedDate === date && styles.dateButtonTextActive]}>
                {formatDate(date).split(',')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
      </View>

      {/* Lista de registros */}
      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No hay registros para mostrar</Text>
            <Text style={styles.emptySubtext}>Prueba con otros filtros o fecha</Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = statusConfig[item.status];
          return (
            <TouchableOpacity 
              onPress={() => navigation?.navigate('StudentDetail', { student: item })}
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
          Alert.alert('Generar reporte', `Reporte de asistencia del ${formatDate(selectedDate)} generado`);
        }}
      >
        <Text style={styles.reportButtonText}>📊 Generar reporte del día</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
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
    color: colors.white,
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