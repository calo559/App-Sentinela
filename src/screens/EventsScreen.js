import { View, Text, FlatList, TouchableOpacity, TextInput, Share, Modal, ScrollView } from 'react-native';
import { notify } from '../utils/notify';
import { useState, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import typography from '../theme/typography';
import Card from '../components/Card';
import Header from '../components/Header';
import Calendar, { todayKey } from '../components/Calendar';
import { getActiveUser } from '../services/authService';
import { getToday } from '../services/attendanceService';
import {
  TIPOS_AVISO,
  tiposPara,
  crearAviso,
  listarAvisos,
  borrarAviso,
} from '../services/avisosService';

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
  const esAlumno = activeUser?.role === 'alumno';
  // Filtrar alumnos y generar reportes: solo docentes y preceptores
  const esStaff = activeUser?.role === 'docente' || activeUser?.role === 'preceptor';
  // El alumno/preceptor ve solo SU curso; el docente (sin curso asignado) ve todos
  const myCourse =
    activeUser?.curso && activeUser?.division ? `${activeUser.curso}${activeUser.division}` : null;

  // Registro REAL de hoy: el que se creó al escanear el QR de la entrada.
  const miRegistro = getToday();
  const miItem = (() => {
    if (!miRegistro) return null;
    // Si hay curso en pantalla, solo mostramos registros de ese curso
    if (myCourse && miRegistro.curso !== myCourse) return null;
    return {
      id: 'mi-asistencia-hoy',
      student: miRegistro.alumno || 'Tú',
      course: miRegistro.curso || myCourse || '',
      date: miRegistro.fecha,
      time: miRegistro.hora,
      status: miRegistro.status || 'presente',
      observations:
        miRegistro.status === 'tarde'
          ? 'Llegada tarde al escanear el QR'
          : 'Escaneó el QR de la clase',
    };
  })();

  const courseRecords = [
    ...(miItem ? [miItem] : []),
    ...attendanceHistory.filter((item) => !myCourse || item.course === myCourse),
  ];

  // La lista se toma por APELLIDO: el filtro de letras, el agrupado y el orden
  // usan la inicial del apellido ("Ana Martínez" → M), no la del nombre.
  const apellidoDe = (name) => {
    const partes = String(name ?? '').trim().split(/\s+/);
    return partes[partes.length - 1] || '';
  };
  const initial = (name) => {
    const ap = apellidoDe(name);
    return ap ? ap.charAt(0).toUpperCase() : '?';
  };
  // Orden alfabético de apellidos (como se toma la lista real); mismo apellido → nombre
  const porApellido = (a, b) =>
    apellidoDe(a.student).localeCompare(apellidoDe(b.student), 'es') ||
    a.student.localeCompare(b.student, 'es');

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

  // Agrupado alfabético por inicial del APELLIDO
  const grouped = (() => {
    const sorted = [...filteredHistory].sort(porApellido);
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

  /* ------------------------------------------- Notificaciones (avisos) */
  const [avisos, setAvisos] = useState(() => listarAvisos());
  const [modalAviso, setModalAviso] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    tipo: '',
    titulo: '',
    fecha: todayKey(),
    nota: '',
    detalle: '',
  });

  // Tipos que publica cada rol: docente (evaluación/exposición/TP) o preceptor
  const tiposRol = esStaff ? tiposPara(activeUser?.role) : [];
  const tipoActual = TIPOS_AVISO[form.tipo];

  const abrirModalAviso = () => {
    setForm({
      tipo: tiposRol[0]?.key || '',
      titulo: '',
      fecha: todayKey(),
      nota: '',
      detalle: '',
    });
    setFormError('');
    setModalAviso(true);
  };

  const publicarAviso = () => {
    const res = crearAviso(form);
    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    setAvisos(listarAvisos());
    setModalAviso(false);
    notify('Aviso publicado', `"${res.aviso.titulo}" ya aparece en Notificaciones`, [
      { text: 'OK' },
    ]);
  };

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
      flexWrap: 'wrap',
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
    myAttendanceCard: {
      marginHorizontal: 16,
      marginTop: 12,
      marginBottom: 4,
      padding: 14,
      alignItems: 'center',
    },
    myAttendanceTitle: {
      ...typography.caption,
      color: colors.textSecondary,
      letterSpacing: 1,
      marginBottom: 10,
    },
    myAttendanceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    myAttendanceTime: {
      ...typography.body,
      fontWeight: '600',
      color: colors.text,
    },
    myAttendanceEmpty: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
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

    // Notificaciones (avisos de docentes y preceptores)
    avisosSection: {
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    avisosHeadRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginBottom: 8,
    },
    avisosTitle: {
      ...typography.h3,
      color: colors.text,
      fontWeight: '700',
    },
    publicarBtn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    publicarBtnText: {
      color: colors.onPrimary || colors.white,
      ...typography.button,
      fontSize: 12,
    },
    avisosEmpty: {
      ...typography.caption,
      color: colors.textSecondary,
      paddingVertical: 6,
    },
    avisoCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 4,
      borderRadius: 14,
      padding: 12,
      marginBottom: 8,
    },
    avisoHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    avisoIcon: { fontSize: 16 },
    avisoTitulo: { flex: 1, fontSize: 14, fontWeight: '800', color: colors.text },
    avisoChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    avisoChipText: { fontSize: 10, fontWeight: '800' },
    avisoDelete: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '700',
      paddingHorizontal: 4,
    },
    avisoMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 6 },
    avisoDetalle: { fontSize: 12.5, color: colors.text, marginTop: 6, lineHeight: 18 },
    avisoNota: {
      fontSize: 12.5,
      fontWeight: '800',
      color: colors.primary,
      marginTop: 4,
    },

    // Modal publicar aviso
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 16,
      maxHeight: '90%',
    },
    fieldLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '700',
      marginTop: 12,
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: colors.surfaceVariant,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      ...typography.body,
      fontSize: 14,
      color: colors.text,
    },
    inputMultiline: { minHeight: 70, textAlignVertical: 'top' },
    tipoChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tipoChip: {
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    tipoChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    tipoChipText: { fontSize: 12, fontWeight: '700', color: colors.text },
    tipoChipTextActive: { color: colors.onPrimary || colors.white },
    formError: { ...typography.caption, color: colors.error, marginTop: 10 },
    modalActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
    cancelBtn: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      alignItems: 'center',
    },
    cancelBtnText: { ...typography.button, fontSize: 14, color: colors.text },
    publishBtn: {
      flex: 1,
      borderRadius: 12,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      alignItems: 'center',
    },
    publishBtnText: {
      ...typography.button,
      fontSize: 14,
      color: colors.onPrimary || colors.white,
    },
  }), [colors]);

  const renderListHeader = () => {
    const miCfg = getStatusConfig(miRegistro?.status || 'presente');
    return (
    <>
      {/* Mi asistencia de HOY: registro real del escaneo del QR de la entrada */}
      {esAlumno && (
        <Card style={s.myAttendanceCard}>
          <Text style={s.myAttendanceTitle}>TU ASISTENCIA DE HOY</Text>
          {miRegistro ? (
            <View style={s.myAttendanceRow}>
              <View style={[s.statusBadge, { backgroundColor: miCfg.color + '15' }]}>
                <Text style={[s.statusText, { color: miCfg.color }]}>
                  {miCfg.icon} {miCfg.label}
                </Text>
              </View>
              <Text style={s.myAttendanceTime}>
                🕐 {miRegistro.hora} hs{miRegistro.bloque ? ` · ${miRegistro.bloque}` : ''}
              </Text>
            </View>
          ) : (
            <Text style={s.myAttendanceEmpty}>
              Todavía no escaneaste el QR de hoy · acercate a la entrada
            </Text>
          )}
        </Card>
      )}

      {/* Notificaciones: avisos que publican docentes y preceptores (todos los roles) */}
      <View style={s.avisosSection}>
        <View style={s.avisosHeadRow}>
          <Text style={s.avisosTitle}>🔔 Notificaciones</Text>
          {esStaff && (
            <TouchableOpacity style={s.publicarBtn} onPress={abrirModalAviso}>
              <Text style={s.publicarBtnText}>＋ Publicar aviso</Text>
            </TouchableOpacity>
          )}
        </View>

        {avisos.length === 0 ? (
          <Text style={s.avisosEmpty}>No hay avisos por ahora</Text>
        ) : (
          avisos.map((a) => {
            const cfg = TIPOS_AVISO[a.tipo] || {
              icon: '•',
              label: a.tipo,
              color: 'primary',
            };
            const col = colors[cfg.color] || colors.primary;
            return (
              <View key={a.id} style={[s.avisoCard, { borderLeftColor: col }]}>
                <View style={s.avisoHead}>
                  <Text style={s.avisoIcon}>{cfg.icon}</Text>
                  <Text style={s.avisoTitulo}>{a.titulo}</Text>
                  <View style={[s.avisoChip, { backgroundColor: col + '1F' }]}>
                    <Text style={[s.avisoChipText, { color: col }]}>{cfg.label}</Text>
                  </View>
                  {esStaff && (
                    <TouchableOpacity
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={() =>
                        notify('Eliminar aviso', `¿Eliminar "${a.titulo}"?`, [
                          { text: 'Cancelar', style: 'cancel' },
                          {
                            text: 'Eliminar',
                            onPress: () => {
                              borrarAviso(a.id);
                              setAvisos(listarAvisos());
                            },
                          },
                        ])
                      }
                    >
                      <Text style={s.avisoDelete}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={s.avisoMeta}>
                  📅 {formatDate(a.fecha)} · {a.autor || '—'}
                </Text>
                {a.detalle ? <Text style={s.avisoDetalle}>{a.detalle}</Text> : null}
                {a.nota ? <Text style={s.avisoNota}>⭐ Nota: {a.nota}</Text> : null}
              </View>
            );
          })
        )}
      </View>

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

      {esStaff && (
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
      )}
    </>
    );
  };

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

      {esStaff && (
      <TouchableOpacity
        style={s.reportButton}
        onPress={async () => {
          const lines = [...filteredHistory]
            .sort(porApellido)
            .map((r) => `• ${r.student} (${r.course}): ${r.status} ${r.time}`)
            .join('\n');
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
      )}

      {/* Modal: publicar aviso (solo docentes y preceptores) */}
      <Modal
        visible={modalAviso}
        transparent
        animationType="slide"
        onRequestClose={() => setModalAviso(false)}
      >
        <View style={s.modalOverlay}>
          <ScrollView
            style={s.modalCard}
            contentContainerStyle={{ paddingBottom: 12 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.avisosHeadRow}>
              <Text style={s.avisosTitle}>➕ Publicar aviso</Text>
              <TouchableOpacity
                onPress={() => setModalAviso(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={s.avisoDelete}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.fieldLabel}>Tipo</Text>
            <View style={s.tipoChips}>
              {tiposRol.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[s.tipoChip, form.tipo === t.key && s.tipoChipActive]}
                  onPress={() => setForm((f) => ({ ...f, tipo: t.key }))}
                >
                  <Text
                    style={[s.tipoChipText, form.tipo === t.key && s.tipoChipTextActive]}
                  >
                    {t.icon} {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.fieldLabel}>Título</Text>
            <TextInput
              style={s.input}
              placeholder={tipoActual?.hint || 'Título del aviso'}
              placeholderTextColor={colors.textSecondary}
              value={form.titulo}
              onChangeText={(t) => setForm((f) => ({ ...f, titulo: t }))}
            />

            <Text style={s.fieldLabel}>{tipoActual?.fechaLabel || 'Fecha'}</Text>
            <Calendar
              records={[]}
              selectedDate={form.fecha}
              onSelect={(f) => setForm((v) => ({ ...v, fecha: f }))}
              showLegend={false}
            />

            {tipoActual?.conNota && (
              <>
                <Text style={s.fieldLabel}>Nota del trabajo práctico</Text>
                <TextInput
                  style={s.input}
                  placeholder="Ej: 10 puntos"
                  placeholderTextColor={colors.textSecondary}
                  value={form.nota}
                  onChangeText={(t) => setForm((f) => ({ ...f, nota: t }))}
                />
              </>
            )}

            <Text style={s.fieldLabel}>Detalle (opcional)</Text>
            <TextInput
              style={[s.input, s.inputMultiline]}
              placeholder="Aula, horario, materia…"
              placeholderTextColor={colors.textSecondary}
              value={form.detalle}
              onChangeText={(t) => setForm((f) => ({ ...f, detalle: t }))}
              multiline
            />

            {formError ? <Text style={s.formError}>{formError}</Text> : null}

            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setModalAviso(false)}>
                <Text style={s.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.publishBtn} onPress={publicarAviso}>
                <Text style={s.publishBtnText}>Publicar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
