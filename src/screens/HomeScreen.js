import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useMemo, useRef, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SCREENS } from '../utils/constants';
import { notify } from '../utils/notify';
import { ROLE_INFO } from '../utils/roles';
import { getActiveUser } from '../services/authService';
import { getToday } from '../services/attendanceService';
import { proximaClase, periodosDeCurso, esDiaClase, HORARIO_DIAS_CURSOS } from '../qr/horarios';
import { detalleMateria } from '../utils/malla';
import typography from '../theme/typography';
import Card from '../components/Card';
import Header from '../components/Header';

const recentAttendance = [
  { id: '1', name: 'Juan Pérez', course: '3°1', status: 'presente', time: '08:15' },
  { id: '2', name: 'María López', course: '3°1', status: 'tarde', time: '08:45' },
  { id: '3', name: 'Carlos Gómez', course: '3°1', status: 'ausente', time: '-' },
  { id: '4', name: 'Ana Martínez', course: '3°1', status: 'presente', time: '08:10' },
  { id: '5', name: 'Pedro Gómez', course: '4°2', status: 'presente', time: '08:20' },
  { id: '6', name: 'Rocío Mena', course: '5°3', status: 'ausente', time: '-' },
];

// Avisos recientes (color del punto = clave de la paleta del tema)
const AVISOS = [
  { id: '1', titulo: 'Entrega de TP de Programación', cuando: 'Mañana — 23:59', color: 'info' },
  { id: '2', titulo: 'Reunión de curso', cuando: 'Viernes — 10:30', color: 'warning' },
  { id: '3', titulo: 'Simulacro de evacuación', cuando: 'Lunes — 08:00', color: 'primary' },
  { id: '4', titulo: 'Entrega de TP de Dibujo Técnico', cuando: 'Martes — 17:00', color: 'violet' },
];

// Accesos rápidos ('avisos' = baja a la sección de la misma pantalla)
const ACCESOS = [
  { id: 'a1', icon: 'clipboard-text-outline', label: 'Mis asistencias', to: SCREENS.EVENTS },
  { id: 'a2', icon: 'book-open-variant', label: 'Mis materias', to: SCREENS.BOLETIN },
  { id: 'a3', icon: 'file-document-outline', label: 'Mis notas', to: SCREENS.EVENTS },
  { id: 'a4', icon: 'bell-outline', label: 'Avisos', to: 'avisos' },
];

const capitalizar = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : '');

// "En 2 h 20 min" / "Mañana" / "En 2 días" hasta la próxima clase REAL del
// curso (fecha y hora salen del horario, no de datos de ejemplo).
function cuentaRegresiva(fecha, hora) {
  if (!fecha || !hora) return '';
  const [h, m] = hora.split(':').map(Number);
  const target = new Date(fecha);
  target.setHours(h, m, 0, 0);
  const now = new Date();
  const dias = Math.round(
    (new Date(target.getFullYear(), target.getMonth(), target.getDate()) -
      new Date(now.getFullYear(), now.getMonth(), now.getDate())) /
      86400000
  );
  if (dias >= 2) return `En ${dias} días`;
  if (dias === 1) return 'Mañana';
  const totalMin = Math.max(1, Math.round((target - now) / 60000));
  const horas = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (horas === 0) return `En ${mins} min`;
  return `En ${horas} h ${mins} min`;
}

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme();
  const activeUser = getActiveUser();
  const roleInfo = ROLE_INFO[activeUser?.role];
  const esAlumno = activeUser?.role === 'alumno';
  // Registro del día: el alumno se marca presente al escanear el QR de la clase
  const hoy = esAlumno ? getToday() : null;

  const scrollRef = useRef(null);
  const avisosY = useRef(0);
  const [avisosAbiertos, setAvisosAbiertos] = useState(false);

  // Alumno/preceptor: solo registros de SU curso (mismo formato que el registro: "3°1")
  const myCourse =
    activeUser?.curso && activeUser?.division ? `${activeUser.curso}${activeUser.division}` : null;
  const visibleRecent = myCourse
    ? recentAttendance.filter((r) => r.course === myCourse)
    : recentAttendance;

  // Próxima clase REAL del curso del usuario (misma fuente que valida el QR):
  // materia como en el Boletín, docente y horario del bloque.
  const prox = myCourse ? proximaClase(myCourse, new Date()) : null;
  const proxPeriodo = prox?.periodo ?? null;
  const proxMateria = proxPeriodo ? proxPeriodo.materia || proxPeriodo.nombre : null;
  const proxDocente = proxPeriodo
    ? proxPeriodo.docente ||
      (proxMateria
        ? detalleMateria(activeUser?.curso, activeUser?.division, proxMateria)?.docente
        : null)
    : null;
  const proximoDia = !prox
    ? null
    : prox.cuando === 'hoy'
      ? 'Hoy'
      : prox.cuando === 'manana'
        ? 'Mañana'
        : capitalizar(prox.fecha?.toLocaleDateString('es-AR', { weekday: 'long' }) || '');

  const metaProxima = !myCourse
    ? 'Cargá tu curso y división en tu perfil'
    : prox
      ? [proximoDia, `${proxPeriodo.inicio}–${proxPeriodo.fin}`, proxDocente]
          .filter(Boolean)
          .join(' · ')
      : 'Sin clases programadas';

  // Horario de HOY del curso (diálogo "Ver horario →")
  const horarioHoy = useMemo(() => {
    const d = new Date();
    if (!myCourse) return ['Sin curso asignado en tu perfil'];
    if (!esDiaClase(d)) return ['Hoy no hay clases'];
    const especial = !!HORARIO_DIAS_CURSOS[myCourse]?.[d.getDay()];
    const ps = periodosDeCurso(myCourse, d);
    if (!ps.length) return ['Tu curso no tiene clases hoy'];
    const lineas = [];
    for (const p of ps) {
      lineas.push(
        `${p.inicio}–${p.fin} · ${p.materia || p.nombre}${p.docente ? ` · ${p.docente}` : ''}`
      );
      // Recreo del horario general, solo si cursa las dos horas
      if (!especial && p.id === 'P1' && ps.some((x) => x.id === 'P2')) {
        lineas.push('09:20–09:40 · Recreo');
      }
    }
    return lineas;
  }, [myCourse]);

  const attendanceStats = [
    { id: '1', label: 'Presentes', value: '142', color: colors.success, icon: 'account-check-outline' },
    { id: '2', label: 'Ausentes', value: '18', color: colors.error, icon: 'account-remove-outline' },
    { id: '3', label: 'Llegadas Tarde', value: '7', color: colors.warning, icon: 'clock-alert-outline' },
    { id: '4', label: 'Total Alumnos', value: '167', color: colors.primary, icon: 'account-group-outline' },
  ];

  const avisosVisibles = avisosAbiertos ? AVISOS : AVISOS.slice(0, 2);

  const goToAvisos = () => {
    setAvisosAbiertos(true);
    scrollRef.current?.scrollTo({ y: Math.max(avisosY.current - 8, 0), animated: true });
  };

  const handleQuick = (item) => {
    if (item.to === 'avisos') goToAvisos();
    else navigation?.navigate(item.to);
  };

  const handleVerHorario = () => {
    notify('Horario de hoy', horarioHoy.join('\n'), [{ text: 'Cerrar' }]);
  };

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
    scrollContent: { paddingTop: 4, paddingBottom: 24 },


    // Encabezados de sección
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 10,
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
      fontSize: 13,
      color: colors.primary,
      fontWeight: '700',
    },
    linkText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    linkRow: {
      alignSelf: 'flex-end',
      marginTop: 12,
    },

    // Atajos superiores (existentes)
    shortcutRow: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 16,
      paddingBottom: 4,
    },
    shortcutChip: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      paddingVertical: 11,
      paddingHorizontal: 4,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    shortcutLabel: {
      ...typography.caption,
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },

    // Estadísticas del curso (existentes, más compactas)
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: 2,
    },
    statCard: {
      flexBasis: '47%',
      flexGrow: 1,
      marginHorizontal: 0,
      marginVertical: 0,
      paddingVertical: 14,
      minHeight: 104,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statContent: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    statIcon: {
      marginBottom: 6,
    },
    statLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 4,
      textAlign: 'center',
    },
    statValue: {
      ...typography.h1,
      fontSize: 32,
      fontWeight: 'bold',
    },

    // Tarjetas nuevas (Próxima clase / Mi asistencia)
    cardHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconBadge: {
      width: 46,
      height: 46,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardHeadInfo: { flex: 1 },
    eyebrow: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      color: colors.primary,
      marginBottom: 3,
    },
    cardTitleBig: { fontSize: 18, fontWeight: '800', color: colors.text },
    cardMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 3, lineHeight: 16 },
    todayLine: { fontSize: 11, fontWeight: '700', marginTop: 3 },
    pill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9 },
    pillText: { fontSize: 11, fontWeight: '800' },

    bigPct: { fontSize: 30, fontWeight: '800' },
    track: {
      height: 8,
      borderRadius: 4,
      marginTop: 14,
      marginBottom: 14,
      overflow: 'hidden',
    },
    fill: { width: '92%', height: 8, borderRadius: 4, backgroundColor: colors.primary },
    metricsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    metric: { flex: 1, alignItems: 'center' },
    metricSep: { width: 1, height: 30, backgroundColor: colors.border },
    metricValue: { fontSize: 18, fontWeight: '800' },
    metricLabel: {
      ...typography.caption,
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 3,
      letterSpacing: 0.4,
    },

    // Avisos
    avisoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 11,
      gap: 12,
    },
    avisoDot: { width: 10, height: 10, borderRadius: 5 },
    avisoTitulo: { fontSize: 13.5, fontWeight: '700', color: colors.text },
    avisoCuando: {
      ...typography.caption,
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 2,
    },

    // Acciones rápidas
    quickRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingBottom: 6,
    },
    quickTile: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 9,
      paddingHorizontal: 2,
    },
    quickLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.textSecondary,
      textAlign: 'center',
    },

    // Últimos registros (existentes)
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
    emptyState: {
      textAlign: 'center',
      marginTop: 6,
      marginBottom: 6,
      paddingHorizontal: 16,
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
      color: colors.textSecondary,
      marginTop: 2,
    },

  }), [colors]);

  return (
    <View style={s.container}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.scrollContent}
      >
        <Header
          title="Escuela Técnica N°3"
          subtitle={`Control de Asistencia · ${roleInfo?.label ?? 'Invitado'}`}
        />

        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Asistencia del día</Text>
          <Text style={s.sectionDate}>{new Date().toLocaleDateString('es-AR')}</Text>
        </View>

        {/* Atajos rápidos */}
        <View style={s.shortcutRow}>
          <TouchableOpacity
            style={s.shortcutChip}
            onPress={() => navigation?.navigate(SCREENS.EVENTS)}
          >
            <MaterialCommunityIcons name="calendar-check-outline" size={20} color={colors.primary} />
            <Text style={s.shortcutLabel}>Asistencias</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.shortcutChip}
            onPress={() => navigation?.navigate(SCREENS.EVENTS)}
          >
            <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.primary} />
            <Text style={s.shortcutLabel}>Notas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.shortcutChip}
            onPress={() => navigation?.navigate(SCREENS.BOLETIN)}
          >
            <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={colors.primary} />
            <Text style={s.shortcutLabel}>Boletín</Text>
          </TouchableOpacity>
        </View>

        {/* Estadísticas del curso */}
        <View style={s.statsGrid}>
          {attendanceStats.map((item) => (
            <Card key={item.id} style={s.statCard}>
              <View style={s.statContent}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={20}
                  color={item.color}
                  style={s.statIcon}
                />
                <Text style={[s.statValue, { color: item.color }]}>{item.value}</Text>
                <Text style={s.statLabel}>{item.label}</Text>
              </View>
            </Card>
          ))}
        </View>

        {/* Próxima clase (real, según el horario del curso) */}
        <Card>
          <View style={s.cardHeadRow}>
            <View style={[s.iconBadge, { backgroundColor: colors.primary + '1F' }]}>
              <MaterialCommunityIcons name="calendar-clock" size={22} color={colors.primary} />
            </View>
            <View style={s.cardHeadInfo}>
              <Text style={s.eyebrow}>PRÓXIMA CLASE</Text>
              <Text style={s.cardTitleBig}>{proxMateria || 'Sin clases'}</Text>
              <Text style={s.cardMeta}>{metaProxima}</Text>
            </View>
            {prox && (
              <View style={[s.pill, { backgroundColor: colors.primary + '1F' }]}>
                <Text style={[s.pillText, { color: colors.primary }]}>
                  {cuentaRegresiva(prox.fecha, proxPeriodo.inicio)}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={s.linkRow} onPress={handleVerHorario}>
            <Text style={s.linkText}>Ver horario →</Text>
          </TouchableOpacity>
        </Card>

        {/* Mi asistencia (solo alumno) */}
        {esAlumno && (
          <Card>
            <View style={s.cardHeadRow}>
              <View style={[s.iconBadge, { backgroundColor: colors.primary + '1F' }]}>
                <MaterialCommunityIcons
                  name="clipboard-check-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <View style={s.cardHeadInfo}>
                <Text style={s.eyebrow}>MI ASISTENCIA</Text>
                <Text style={s.cardMeta}>Este año lectivo · 26 días con clase</Text>
                <Text
                  style={[
                    s.todayLine,
                    {
                      color: hoy
                        ? hoy.status === 'tarde'
                          ? colors.warning
                          : colors.success
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {hoy
                    ? `Hoy: ${hoy.status === 'tarde' ? '⏰ Llegada tarde' : 'Presente'} · ${hoy.hora}`
                    : 'Hoy: sin marcar · Escaneá el QR'}
                </Text>
              </View>
              <Text style={[s.bigPct, { color: colors.primary }]}>92%</Text>
            </View>

            <View style={[s.track, { backgroundColor: colors.surfaceVariant }]}>
              <View style={s.fill} />
            </View>

            <View style={s.metricsRow}>
              <View style={s.metric}>
                <Text style={[s.metricValue, { color: colors.success }]}>23</Text>
                <Text style={s.metricLabel}>Presentes</Text>
              </View>
              <View style={s.metricSep} />
              <View style={s.metric}>
                <Text style={[s.metricValue, { color: colors.error }]}>2</Text>
                <Text style={s.metricLabel}>Ausentes</Text>
              </View>
              <View style={s.metricSep} />
              <View style={s.metric}>
                <Text style={[s.metricValue, { color: colors.warning }]}>1</Text>
                <Text style={s.metricLabel}>Tardanzas</Text>
              </View>
            </View>

            <TouchableOpacity
              style={s.linkRow}
              onPress={() => navigation?.navigate(SCREENS.EVENTS)}
            >
              <Text style={s.linkText}>Ver historial →</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Avisos */}
        <View
          style={s.sectionHeader}
          onLayout={(e) => {
            avisosY.current = e.nativeEvent.layout.y;
          }}
        >
          <Text style={s.sectionTitle}>Avisos</Text>
          <TouchableOpacity onPress={() => setAvisosAbiertos((v) => !v)}>
            <Text style={s.seeAllLink}>{avisosAbiertos ? 'Ver menos ↑' : 'Ver todos →'}</Text>
          </TouchableOpacity>
        </View>

        <Card>
          {avisosVisibles.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              style={[
                s.avisoRow,
                idx < avisosVisibles.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
              onPress={() =>
                notify(item.titulo, `Aviso del curso\n${item.cuando}`, [{ text: 'Cerrar' }])
              }
            >
              <View style={[s.avisoDot, { backgroundColor: colors[item.color] }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.avisoTitulo}>{item.titulo}</Text>
                <Text style={s.avisoCuando}>{item.cuando}</Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Últimos registros */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Últimos registros</Text>
          <TouchableOpacity onPress={() => navigation?.navigate(SCREENS.EVENTS)}>
            <Text style={s.seeAllLink}>Ver todos →</Text>
          </TouchableOpacity>
        </View>

        {visibleRecent.length === 0 ? (
          <Text style={[s.studentCourse, s.emptyState]}>
            Sin registros recientes de tu curso
          </Text>
        ) : (
          visibleRecent.map((item) => (
            <Card key={item.id} style={s.recentCard}>
              <View style={s.recentRow}>
                <View style={s.recentInfo}>
                  <Text style={s.studentName}>{item.name}</Text>
                  <Text style={s.studentCourse}>{item.course}</Text>
                </View>
                <View
                  style={[
                    s.statusBadge,
                    { backgroundColor: getStatusColor(item.status) + '20' },
                  ]}
                >
                  <Text style={[s.statusText, { color: getStatusColor(item.status) }]}>
                    {getStatusText(item.status)}
                  </Text>
                  {item.time !== '-' && <Text style={s.timeText}>{item.time}</Text>}
                </View>
              </View>
            </Card>
          ))
        )}

        {/* Acciones rápidas */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Acciones rápidas</Text>
        </View>
        <View style={s.quickRow}>
          {ACCESOS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={s.quickTile}
              onPress={() => handleQuick(item)}
            >
              <MaterialCommunityIcons name={item.icon} size={18} color={colors.primary} />
              <Text style={s.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
