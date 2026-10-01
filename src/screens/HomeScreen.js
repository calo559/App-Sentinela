import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import colors from '../theme/colors';
import typography from '../theme/typography';
import Card from '../components/Card';
import Header from '../components/Header';
import { attendance, courses, students, todayKey } from '../services/firestore';

export default function HomeScreen({ navigation }) {
  const fecha = todayKey();
  const [resumen, setResumen] = useState(null);
  const [recientes, setRecientes] = useState([]);
  const [totalAlumnos, setTotalAlumnos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [usandoDemo, setUsandoDemo] = useState(false);

  useEffect(() => {
    let unsubscribeResumen = () => {};
    let unsubscribeRecientes = () => {};
    let vigente = true;

    const fallback = () => {
      if (!vigente) return;
      setUsandoDemo(true);
      setCargando(false);
    };

    const cargarAlumnos = async () => {
      try {
        const listaCursos = await courses.obtenerCursos({ activo: true });
        if (!listaCursos.length) return;

        const conteo = await students.contarAlumnosPorCurso(listaCursos.map((curso) => curso.id));
        const total = Object.values(conteo).reduce((suma, valor) => suma + valor, 0);
        if (vigente && total > 0) setTotalAlumnos(total);
      } catch (error) {
        fallback();
      }
    };

    const cargarRecientes = async () => {
      try {
        const registros = await attendance.obtenerUltimasAsistencias({ limite: 6 });
        if (!vigente) return;

        const alumnos = await students.obtenerMapaAlumnos(registros.map((item) => item.alumnoId));
        const mapaCursos = await courses.obtenerMapaCursos(registros.map((item) => item.cursoId));

        setRecientes(
          registros.map((item) => ({
            id: item.id,
            name: alumnos[item.alumnoId]?.nombreCompleto ?? 'Alumno',
            course: mapaCursos[item.cursoId]?.nombre ?? '-',
            status: item.estado,
            time: item.horaTexto,
          }))
        );
      } catch (error) {
        fallback();
      }
    };

    try {
      unsubscribeResumen = attendance.observarResumenDiario(fecha, {}, (data) => {
        if (!vigente) return;
        setResumen(data);
        setCargando(false);
        setUsandoDemo(false);
      });

      unsubscribeRecientes = attendance.observarAsistenciasPorFecha(fecha, { limite: 6 }, (registros) => {
        if (!vigente || !registros.length) return;

        Promise.all([
          students.obtenerMapaAlumnos(registros.map((item) => item.alumnoId)),
          courses.obtenerMapaCursos(registros.map((item) => item.cursoId)),
        ])
          .then(([alumnos, mapaCursos]) => {
            if (!vigente) return;
            setRecientes(
              registros.map((item) => ({
                id: item.id,
                name: alumnos[item.alumnoId]?.nombreCompleto ?? 'Alumno',
                course: mapaCursos[item.cursoId]?.nombre ?? '-',
                status: item.estado,
                time: item.horaTexto,
              }))
            );
            setUsandoDemo(false);
          })
          .catch(() => {});
      });
    } catch (error) {
      fallback();
    }

    cargarAlumnos();
    cargarRecientes();

    return () => {
      vigente = false;
      unsubscribeResumen();
      unsubscribeRecientes();
    };
  }, [fecha]);

  const attendanceStats = useMemo(() => {
    const fuente = resumen ?? { presentes: 0, ausentes: 0, tarde: 0, total: 0 };

    return [
      { id: '1', label: 'Presentes', value: String(fuente.presentes ?? 0), color: colors.success, icon: '✓' },
      { id: '2', label: 'Ausentes', value: String(fuente.ausentes ?? 0), color: colors.error, icon: '✗' },
      { id: '3', label: 'Llegadas Tarde', value: String(fuente.tarde ?? 0), color: colors.warning, icon: '⏰' },
      { id: '4', label: 'Total Alumnos', value: String(totalAlumnos ?? fuente.total ?? 0), color: colors.primary, icon: '👥' },
    ];
  }, [resumen, totalAlumnos]);

  const recentAttendance = recientes;

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'presente': return colors.success;
      case 'tarde': return colors.warning;
      case 'ausente': return colors.error;
      case 'justificado': return colors.primary;
      default: return colors.textSecondary;
    }
  }, []);

  const getStatusText = useCallback((status) => {
    switch (status) {
      case 'presente': return 'Presente';
      case 'tarde': return 'Llegó tarde';
      case 'ausente': return 'Ausente';
      case 'justificado': return 'Justificado';
      default: return status;
    }
  }, []);

  return (
    <View style={styles.container}>
      <Header
        title="Escuela Técnica N°3"
        subtitle="Control de Asistencia - Padaria"
        showSchoolBadge={true}
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Asistencia del día</Text>
        <Text style={styles.sectionDate}>{new Date().toLocaleDateString('es-AR')}</Text>
      </View>

      {usandoDemo && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>Sin conexión con Firestore</Text>
        </View>
      )}

      <FlatList
        data={attendanceStats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.statsList}
        numColumns={2}
        renderItem={({ item }) => (
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <Text style={styles.statIcon}>{item.icon}</Text>
              <Text style={[styles.statValue, { color: item.color }]}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          </Card>
        )}
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Últimos registros</Text>
        <TouchableOpacity onPress={() => navigation?.navigate('Events')}>
          <Text style={styles.seeAllLink}>Ver todos →</Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={recentAttendance}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.recentList}
          renderItem={({ item }) => (
            <Card style={styles.recentCard}>
              <View style={styles.recentRow}>
                <View style={styles.recentInfo}>
                  <Text style={styles.studentName}>{item.name}</Text>
                  <Text style={styles.studentCourse}>{item.course}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {getStatusText(item.status)}
                  </Text>
                  {item.time !== '-' && <Text style={styles.timeText}>{item.time}</Text>}
                </View>
              </View>
            </Card>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation?.navigate('Events')}
      >
        <Text style={styles.fabText}>+ Tomar Asistencia</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  statsList: { 
    paddingHorizontal: 12,
    paddingBottom: 8 
  },
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
  demoBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.warning + '20',
  },
  demoBannerText: {
    ...typography.caption,
    color: colors.warning,
    textAlign: 'center',
  },
  loader: {
    marginTop: 24,
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
});