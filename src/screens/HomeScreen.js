import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import typography from '../theme/typography';
import Card from '../components/Card';
import Header from '../components/Header';

const recentAttendance = [
  { id: '1', name: 'Juan Pérez', course: '3° A', status: 'presente', time: '08:15' },
  { id: '2', name: 'María López', course: '4° B', status: 'tarde', time: '08:45' },
  { id: '3', name: 'Carlos Gómez', course: '5° C', status: 'ausente', time: '-' },
  { id: '4', name: 'Ana Martínez', course: '3° A', status: 'presente', time: '08:10' },
];

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();

  const attendanceStats = [
    { id: '1', label: 'Presentes', value: '142', color: colors.success, icon: '✓' },
    { id: '2', label: 'Ausentes', value: '18', color: colors.error, icon: '✗' },
    { id: '3', label: 'Llegadas Tarde', value: '7', color: colors.warning, icon: '⏰' },
    { id: '4', label: 'Total Alumnos', value: '167', color: colors.primary, icon: '👥' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'presente': return colors.success;
      case 'tarde': return colors.warning;
      case 'ausente': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'presente': return 'Presente';
      case 'tarde': return 'Llegó tarde';
      case 'ausente': return 'Ausente';
      default: return status;
    }
  };

  const s = useMemo(() => ({
    container: { flex: 1, backgroundColor: colors.background },
    statsList: { paddingHorizontal: 12, paddingBottom: 8 },
    statCard: {
      flex: 1,
      margin: 8,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 120,
    },
    statContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    statIcon: {
      fontSize: 32,
      marginBottom: 8,
    },
    statLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    statValue: {
      ...typography.h1,
      fontSize: 36,
      fontWeight: 'bold',
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 12,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '600',
    },
    sectionDate: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    seeAllLink: {
      ...typography.body,
      color: colors.primary,
      fontWeight: '500',
    },
    recentList: {
      paddingHorizontal: 16,
      paddingBottom: 80,
    },
    recentCard: {
      marginBottom: 8,
      paddingVertical: 12,
    },
    recentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    recentInfo: {
      flex: 1,
    },
    studentName: {
      ...typography.body,
      fontWeight: '500',
      color: colors.text,
    },
    studentCourse: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      alignItems: 'center',
      minWidth: 100,
    },
    statusText: {
      ...typography.caption,
      fontWeight: '600',
    },
    timeText: {
      ...typography.caption,
      fontSize: 10,
      marginTop: 2,
    },
    fab: {
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
    fabText: {
      ...typography.button,
      color: colors.white,
      fontWeight: 'bold',
    },
  }), [colors]);

  return (
    <View style={s.container}>
      <Header
        title="Escuela Técnica N°3"
        subtitle="Control de Asistencia - Padaria"
        showSchoolBadge={true}
      />

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Asistencia del día</Text>
        <Text style={s.sectionDate}>{new Date().toLocaleDateString('es-AR')}</Text>
      </View>

      <FlatList
        data={attendanceStats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.statsList}
        numColumns={2}
        renderItem={({ item }) => (
          <Card style={s.statCard}>
            <View style={s.statContent}>
              <Text style={s.statIcon}>{item.icon}</Text>
              <Text style={[s.statValue, { color: item.color }]}>{item.value}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
          </Card>
        )}
      />

      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Últimos registros</Text>
        <TouchableOpacity onPress={() => navigation?.navigate('History')}>
          <Text style={s.seeAllLink}>Ver todos →</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={recentAttendance}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.recentList}
        renderItem={({ item }) => (
          <Card style={s.recentCard}>
            <View style={s.recentRow}>
              <View style={s.recentInfo}>
                <Text style={s.studentName}>{item.name}</Text>
                <Text style={s.studentCourse}>{item.course}</Text>
              </View>
              <View style={[s.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[s.statusText, { color: getStatusColor(item.status) }]}>
                  {getStatusText(item.status)}
                </Text>
                {item.time !== '-' && <Text style={s.timeText}>{item.time}</Text>}
              </View>
            </View>
          </Card>
        )}
      />

      <TouchableOpacity
        style={s.fab}
        onPress={() => navigation?.navigate('TakeAttendance')}
      >
        <Text style={s.fabText}>+ Tomar Asistencia</Text>
      </TouchableOpacity>
    </View>
  );
}
