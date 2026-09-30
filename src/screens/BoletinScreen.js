// BoletinScreen — Boletín Virtual
// 2 cuatrimestres, cada uno con su informe de avance.
// Las materias dependen del año y división con los que se registró el alumno
// (ver reglas en src/utils/malla.js).
import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getActiveUser } from '../services/authService';
import { getNotasAlumno, getInforme } from '../services/gradesService';
import CargaNotas from '../components/CargaNotas';
import Header from '../components/Header';
import {
  CUATRIMESTRES,
  ESPECIALIDADES,
  especialidadDe,
  materiasDe,
  detalleMateria,
  etiquetaCurso,
  notasDe,
  informeDe,
  colorNota,
  INFORME_OPCIONES,
} from '../utils/malla';

const CURSOS = ['1°', '2°', '3°', '4°', '5°', '6°', '7°'];
const DIVISIONES = ['1', '2', '3', '4', '5'];

const ESTADO_LABEL = { aprobada: 'Aprobada', libre: 'Libre', pendiente: 'En curso' };
const ESTADO_COLOR = {
  aprobada: '#34D399',
  libre: '#F472B6',
  pendiente: '#8494AB',
};

const fechaHoy = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};

// Chip reutilizable (nombres cortos para no repetir estilos)
function Chip({ label, active, onPress, colors }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        st.chip,
        { borderColor: colors.border, backgroundColor: colors.surfaceVariant },
        active && { borderColor: colors.primary, backgroundColor: colors.primary + '1F' },
      ]}
    >
      <Text
        style={[
          st.chipText,
          { color: colors.textSecondary },
          active && { color: colors.primary, fontWeight: '800' },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Stat({ value, label, color }) {
  return (
    <View style={st.stat}>
      <Text style={[st.statValue, { color }]}>{value}</Text>
      <Text style={st.statLabel}>{label}</Text>
    </View>
  );
}

export default function BoletinScreen() {
  const { colors } = useTheme();
  const active = getActiveUser() || {};
  const tieneCurso = !!active.curso;
  const esDocente = active.role === 'docente';

  // Refresca al volver de Editar perfil (curso o materias cambiados)
  const [, setTick] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setTick((t) => t + 1);
    }, [])
  );

  // Sin curso propio (docente): permite buscar cualquier curso
  const [pickCurso, setPickCurso] = useState('4°');
  const [pickDivision, setPickDivision] = useState('2');
  const [cuatri, setCuatri] = useState(1);

  const curso = tieneCurso ? active.curso : pickCurso;
  const division = tieneCurso ? active.division : pickDivision;

  const espKey = especialidadDe(curso, division);
  const espLabel = espKey ? ESPECIALIDADES[espKey].label : null;
  const materias = materiasDe(curso, division);
  // Detalle (docente y horario) por materia — solo cursos con horario especial
  const detalles = Object.fromEntries(
    materias.map((m) => [m, detalleMateria(curso, division, m)])
  );

  const cursoDiv = etiquetaCurso(curso, division);
  const semilla = `${active.email || active.nombre || 'invitado'}|${cursoDiv}`;
  const rowsBase = notasDe(semilla, materias, cuatri);

  // Notas cargadas por los docentes reemplazan a las del boletín
  const guardadas = active.email
    ? getNotasAlumno({ cursoDiv, cuatri, alumnoId: active.email })
    : {};
  const rows = rowsBase.map((r) => {
    if (!(r.materia in guardadas)) return r;
    const nota = guardadas[r.materia];
    const estado = nota == null ? 'pendiente' : nota >= 6 ? 'aprobada' : 'libre';
    return { ...r, nota, estado };
  });

  const informe = informeDe(rows);
  // Informe escrito por un docente (TED / TEP / TEA + descripción)
  const informeDoc = active.email
    ? getInforme({ cursoDiv, cuatri, alumnoId: active.email })
    : null;
  const colorClasif = informeDoc
    ? INFORME_OPCIONES.find((o) => o.key === informeDoc.clasif)?.color || colors.primary
    : colors.primary;
  const periodo = CUATRIMESTRES.find((c) => c.key === cuatri);

  const nombreAlumno = [active.nombre, active.apellido].filter(Boolean).join(' ');

  return (
    <View style={[st.container, { backgroundColor: colors.background }]}>
      <Header title="Boletín Virtual" subtitle="2 cuatrimestres · informe de avance" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
        {/* Curso / especialidad */}
        <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={st.courseRow}>
            <View style={[st.courseBadge, { backgroundColor: colors.primary + '22' }]}>
              <MaterialCommunityIcons name="school-outline" size={26} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[st.courseTitle, { color: colors.text }]}>
                {etiquetaCurso(curso, division)}
              </Text>
              <Text style={[st.courseSub, { color: colors.textSecondary }]}>
                {espLabel ? `Especialidad: ${espLabel}` : 'Ciclo común (1° a 3°)'}
              </Text>
            </View>
            {espKey && (
              <View style={[st.espChip, { backgroundColor: colors.primary + '1F' }]}>
                <MaterialCommunityIcons
                  name={ESPECIALIDADES[espKey].icon}
                  size={13}
                  color={colors.primary}
                />
                <Text style={[st.espChipText, { color: colors.primary }]}>{espLabel}</Text>
              </View>
            )}
          </View>
          <View style={[st.courseDivider, { backgroundColor: colors.border }]} />
          <View style={st.ownerRow}>
            <MaterialCommunityIcons
              name={tieneCurso ? 'account-outline' : 'magnify'}
              size={15}
              color={colors.textSecondary}
            />
            <Text style={[st.ownerText, { color: colors.textSecondary }]}>
              {tieneCurso
                ? active.role === 'alumno'
                  ? `Boletín de ${nombreAlumno || 'alumno'}`
                  : `Curso a cargo: ${nombreAlumno || 'Preceptoría'}`
                : esDocente
                ? `Cargá notas e informes de ${cursoDiv}`
                : 'Elegí un curso para ver su boletín'}
            </Text>
          </View>
        </View>

        {/* Selector de curso (solo si el usuario no tiene curso propio) */}
        {!tieneCurso && (
          <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[st.sectionLabel, { color: colors.textSecondary }]}>CURSO</Text>
            <View style={st.chipsRow}>
              {CURSOS.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  colors={colors}
                  active={pickCurso === c}
                  onPress={() => setPickCurso(c)}
                />
              ))}
            </View>
            <Text style={[st.sectionLabel, { color: colors.textSecondary, marginTop: 14 }]}>
              DIVISIÓN
            </Text>
            <View style={st.chipsRow}>
              {DIVISIONES.map((d) => (
                <Chip
                  key={d}
                  label={d}
                  colors={colors}
                  active={pickDivision === d}
                  onPress={() => setPickDivision(d)}
                />
              ))}
            </View>
          </View>
        )}

        {/* Cuatrimestres */}
        <View style={st.cuatriRow}>
          {CUATRIMESTRES.map((c) => {
            const activeC = cuatri === c.key;
            return (
              <TouchableOpacity
                key={c.key}
                onPress={() => setCuatri(c.key)}
                style={[
                  st.cuatri,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  activeC && { borderColor: colors.primary, backgroundColor: colors.primary + '14' },
                ]}
              >
                <Text
                  style={[
                    st.cuatriLabel,
                    { color: activeC ? colors.primary : colors.text },
                  ]}
                >
                  {c.label}
                </Text>
                <Text style={[st.cuatriPeriodo, { color: colors.textSecondary }]}>{c.periodo}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Docente: carga de notas e informes por materia */}
        {esDocente && (
          <CargaNotas
            curso={curso}
            division={division}
            cuatri={cuatri}
            misMaterias={active.materias || (active.materia ? [active.materia] : [])}
          />
        )}

        {/* Informe de avance (lectura) */}
        {!esDocente && (
        <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={st.reportHead}>
            <View style={[st.reportIcon, { backgroundColor: colors.primary + '22' }]}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={18}
                color={colors.primary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[st.reportTitle, { color: colors.text }]}>Informe de avance</Text>
              <Text style={[st.reportSub, { color: colors.textSecondary }]}>
                {periodo.label} · {periodo.periodo}
              </Text>
            </View>
          </View>

          <View style={[st.statsRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
            <Stat
              value={informe.promedio.toFixed(1).replace('.', ',')}
              label="Promedio"
              color={colorNota(Math.round(informe.promedio))}
            />
            <View style={[st.statSep, { backgroundColor: colors.border }]} />
            <Stat
              value={`${informe.aprobadas}/${informe.total}`}
              label="Aprobadas"
              color={colors.success}
            />
            <View style={[st.statSep, { backgroundColor: colors.border }]} />
            <Stat
              value={String(informe.libres + informe.pendientes)}
              label="Pendientes"
              color={informe.libres + informe.pendientes > 0 ? colors.warning : colors.textSecondary}
            />
          </View>

          {informeDoc ? (
            <View>
              <View style={st.clasifRow}>
                <View
                  style={[
                    st.clasifBadge,
                    { borderColor: colorClasif, backgroundColor: colorClasif + '1F' },
                  ]}
                >
                  <Text style={[st.clasifText, { color: colorClasif }]}>{informeDoc.clasif}</Text>
                </View>
                <Text style={[st.clasifMeta, { color: colors.textSecondary }]}>
                  {`${informeDoc.materia}${informeDoc.autor ? ` · ${informeDoc.autor}` : ''}${
                    informeDoc.fecha ? ` · ${informeDoc.fecha}` : ''
                  }`}
                </Text>
              </View>
              <Text style={[st.reportText, { color: colors.textSecondary }]}>
                {informeDoc.desc || 'El docente registró este informe sin descripción adicional.'}
              </Text>
            </View>
          ) : (
            <Text style={[st.reportText, { color: colors.textSecondary }]}>{informe.texto}</Text>
          )}

          {informe.destacada && (
            <View style={[st.destacadaRow, { backgroundColor: colors.primary + '14' }]}>
              <MaterialCommunityIcons name="star-outline" size={15} color={colors.primary} />
              <Text style={[st.destacadaText, { color: colors.text }]}>
                Materia destacada: {informe.destacada}
              </Text>
            </View>
          )}

          <Text style={[st.emitido, { color: colors.textSecondary }]}>
            Emitido el {fechaHoy()} · Escuela Técnica N°3
          </Text>
        </View>
        )}

        {/* Materias */}
        {!esDocente && (
        <View style={[st.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={st.subjectsHead}>
            <Text style={[st.subjectsTitle, { color: colors.text }]}>Materias</Text>
            <View style={[st.countBadge, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[st.countText, { color: colors.textSecondary }]}>{rows.length}</Text>
            </View>
          </View>

          {rows.map((row, idx) => (
            <View
              key={row.materia}
              style={[
                st.subjectRow,
                idx < rows.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
              ]}
            >
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[st.subjectName, { color: colors.text }]} numberOfLines={1}>
                  {row.materia}
                </Text>
                {detalles[row.materia]?.docente ? (
                  <Text
                    style={[st.subjectMeta, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {`${detalles[row.materia].docente} · ${detalles[row.materia].horario}`}
                  </Text>
                ) : null}
                <View style={[st.barBg, { backgroundColor: colors.surfaceVariant }]}>
                  <View
                    style={[
                      st.barFill,
                      {
                        width: `${(row.nota ?? 0) * 10}%`,
                        backgroundColor: colorNota(row.nota),
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[st.subjectState, { color: ESTADO_COLOR[row.estado] }]}
                >
                  {ESTADO_LABEL[row.estado]}
                </Text>
              </View>
              <View
                style={[
                  st.noteBadge,
                  { borderColor: colorNota(row.nota), backgroundColor: colorNota(row.nota) + '1F' },
                ]}
              >
                <Text style={[st.noteValue, { color: colorNota(row.nota) }]}>
                  {row.nota ?? '—'}
                </Text>
              </View>
            </View>
          ))}
        </View>
        )}

        <Text style={[st.legal, { color: colors.textSecondary }]}>
          El boletín virtual refleja las evaluaciones y la asistencia registradas en el sistema.
          Ante cualquier consulta, contactar a la preceptoría.
        </Text>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  subjectMeta: { fontSize: 11, marginTop: 2, marginBottom: 4 },
  scroll: { paddingHorizontal: 16, paddingBottom: 32 },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },

  // Curso
  courseRow: { flexDirection: 'row', alignItems: 'center' },
  courseBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  courseTitle: { fontSize: 20, fontWeight: '800' },
  courseSub: { fontSize: 12, marginTop: 2 },
  espChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
  },
  espChipText: { fontSize: 11, fontWeight: '800' },
  courseDivider: { height: 1, marginVertical: 12 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  ownerText: { fontSize: 12 },

  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 2,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 13, fontWeight: '700' },

  // Cuatrimestres
  cuatriRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  cuatri: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cuatriLabel: { fontSize: 13, fontWeight: '800' },
  cuatriPeriodo: { fontSize: 10, marginTop: 3 },

  // Informe
  reportHead: { flexDirection: 'row', alignItems: 'center' },
  reportIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  reportTitle: { fontSize: 16, fontWeight: '800' },
  reportSub: { fontSize: 11, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#8494AB', marginTop: 3, letterSpacing: 0.6 },
  statSep: { width: 1, height: 30 },
  reportText: { fontSize: 13, lineHeight: 20, marginTop: 14 },
  // Informe escrito por un docente (TED / TEP / TEA + descripción)
  clasifRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 8 },
  clasifBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  clasifText: { fontSize: 13, fontWeight: '800' },
  clasifMeta: { fontSize: 11, flex: 1, lineHeight: 15 },
  destacadaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  destacadaText: { fontSize: 12, fontWeight: '700', flex: 1 },
  emitido: { fontSize: 10, marginTop: 12, textAlign: 'center' },

  // Materias
  subjectsHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  subjectsTitle: { fontSize: 16, fontWeight: '800', flex: 1 },
  countBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 9 },
  countText: { fontSize: 11, fontWeight: '700' },
  subjectRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  subjectName: { fontSize: 14, fontWeight: '700' },
  barBg: { height: 5, borderRadius: 3, marginTop: 7, overflow: 'hidden' },
  barFill: { height: 5, borderRadius: 3 },
  subjectState: { fontSize: 10, fontWeight: '700', marginTop: 5, letterSpacing: 0.4 },
  noteBadge: {
    minWidth: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  noteValue: { fontSize: 17, fontWeight: '800' },

  legal: { fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 2, paddingHorizontal: 8 },
});
