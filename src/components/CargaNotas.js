import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { notify } from '../utils/notify';
import { GRADE_TYPES, PERIODS, grades, students } from '../services/firestore';
import { ETIQUETAS_TIPO, nombreCompleto, notaTexto } from '../utils/malla';

const TIPOS = Object.values(GRADE_TYPES);
const PERIODOS = Object.values(PERIODS);

function Chip({ label, active, onPress, colors }) {
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: colors.border, backgroundColor: colors.surfaceVariant },
        active && { borderColor: colors.primary, backgroundColor: colors.primary + '1F' },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: colors.textSecondary },
          active && { color: colors.primary, fontWeight: '800' },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function CargaNotas({ alumnos: alumnosProp, cursoId, materiaId, onCargada }) {
  const { colors } = useTheme();
  const { usuario } = useAuth();

  const [alumnos, setAlumnos] = useState(alumnosProp ?? []);
  const [cargandoAlumnos, setCargandoAlumnos] = useState(false);
  const [alumnoId, setAlumnoId] = useState(null);
  const [tipo, setTipo] = useState(GRADE_TYPES.EVALUACION);
  const [periodo, setPeriodo] = useState(PERIODS.PRIMER_TRIMESTRE);
  const [descripcion, setDescripcion] = useState('');
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (Array.isArray(alumnosProp)) {
      setAlumnos(alumnosProp);
      return;
    }
    if (!cursoId) {
      setAlumnos([]);
      return;
    }

    let vigente = true;
    setCargandoAlumnos(true);
    students
      .obtenerAlumnos({ cursoId })
      .then((lista) => {
        if (vigente) setAlumnos(lista);
      })
      .catch((error) => {
        if (!vigente) return;
        setAlumnos([]);
        notify('No se pudieron cargar los alumnos', error?.message ?? '');
      })
      .finally(() => {
        if (vigente) setCargandoAlumnos(false);
      });

    return () => {
      vigente = false;
    };
  }, [alumnosProp, cursoId]);

  useEffect(() => {
    if (alumnoId && !alumnos.some((alumno) => alumno.id === alumnoId)) setAlumnoId(null);
  }, [alumnos, alumnoId]);

  const onChangeNota = (texto) => {
    const limpio = String(texto).replace(',', '.').replace(/[^0-9.]/g, '');
    const partes = limpio.split('.');
    const normalizado = partes.length > 1
      ? `${partes[0]}.${partes.slice(1).join('').slice(0, 1)}`
      : limpio;
    setNota(normalizado);
  };

  const valorNota = Number.parseFloat(nota);
  const notaValida = Number.isFinite(valorNota) && valorNota >= 1 && valorNota <= 10;
  const alumnoElegido = alumnos.find((alumno) => alumno.id === alumnoId) ?? null;

  const guardar = async () => {
    if (!cursoId) {
      notify('Elegí un curso', 'Seleccioná el curso antes de cargar una nota.');
      return;
    }
    if (!materiaId) {
      notify('Elegí una materia', 'Seleccioná la materia antes de cargar una nota.');
      return;
    }
    if (!alumnoId) {
      notify('Elegí un alumno', 'Seleccioná a quién corresponde la nota.');
      return;
    }
    if (!notaValida) {
      notify('Nota inválida', 'Ingresá una nota numérica entre 1 y 10.');
      return;
    }

    setGuardando(true);
    try {
      await grades.crearNota({
        alumnoId,
        materiaId,
        cursoId,
        profesorId: usuario?.uid ?? '',
        tipo,
        descripcion: descripcion.trim(),
        nota: valorNota,
        fecha: new Date(),
        periodo,
      });

      setNota('');
      setDescripcion('');
      notify(
        'Nota registrada',
        `${ETIQUETAS_TIPO[tipo] ?? tipo} · ${notaTexto(valorNota)} · ${periodo}`
      );
      onCargada?.({ alumnoId, materiaId, cursoId, periodo, nota: valorNota });
    } catch (error) {
      notify('No se pudo guardar la nota', error?.message ?? 'Intentá de nuevo en un momento.');
    } finally {
      setGuardando(false);
    }
  };

  const habilitado = !!cursoId && !!materiaId && !guardando;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.headRow}>
        <View style={[styles.iconBox, { backgroundColor: colors.primary + '22' }]}>
          <MaterialCommunityIcons name="pencil-plus-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.title, { color: colors.text }]}>Cargar nota</Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            {materiaId ? 'Registrá una evaluación para un alumno' : 'Elegí una materia para cargar'}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <Text style={[styles.label, { color: colors.textSecondary }]}>ALUMNO</Text>
      {cargandoAlumnos ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : alumnos.length ? (
        <View style={styles.chipsRow}>
          {alumnos.map((alumno) => (
            <Chip
              key={alumno.id}
              label={nombreCompleto(alumno)}
              active={alumnoId === alumno.id}
              onPress={() => setAlumnoId(alumno.id)}
              colors={colors}
            />
          ))}
        </View>
      ) : (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          Este curso no tiene alumnos activos.
        </Text>
      )}

      <Text style={[styles.label, { color: colors.textSecondary }]}>TIPO DE EVALUACIÓN</Text>
      <View style={styles.chipsRow}>
        {TIPOS.map((item) => (
          <Chip
            key={item}
            label={ETIQUETAS_TIPO[item] ?? item}
            active={tipo === item}
            onPress={() => setTipo(item)}
            colors={colors}
          />
        ))}
      </View>

      <Text style={[styles.label, { color: colors.textSecondary }]}>PERÍODO</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollRow}>
        {PERIODOS.map((item) => (
          <Chip
            key={item}
            label={item}
            active={periodo === item}
            onPress={() => setPeriodo(item)}
            colors={colors}
          />
        ))}
      </ScrollView>

      <Text style={[styles.label, { color: colors.textSecondary }]}>DESCRIPCIÓN</Text>
      <TextInput
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Ej.: Evaluación de la unidad 2"
        placeholderTextColor={colors.textSecondary}
        maxLength={120}
        style={[
          styles.input,
          {
            borderColor: colors.border,
            backgroundColor: colors.surfaceVariant,
            color: colors.text,
          },
        ]}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>NOTA (1 A 10)</Text>
      <View style={styles.notaRow}>
        <TextInput
          value={nota}
          onChangeText={onChangeNota}
          keyboardType="decimal-pad"
          placeholder="—"
          placeholderTextColor={colors.textSecondary}
          maxLength={4}
          style={[
            styles.notaInput,
            {
              borderColor: nota && !notaValida ? colors.error : colors.border,
              backgroundColor: colors.surfaceVariant,
              color: nota && !notaValida ? colors.error : colors.text,
            },
          ]}
        />
        <Text style={[styles.notaHint, { color: colors.textSecondary }]}>
          {nota && !notaValida
            ? 'Ingresá un valor entre 1 y 10'
            : `Alumno: ${alumnoElegido ? nombreCompleto(alumnoElegido) : 'sin elegir'}`}
        </Text>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={guardar}
        disabled={!habilitado}
        style={[
          styles.saveBtn,
          { backgroundColor: colors.primary },
          !habilitado && { opacity: 0.5 },
        ]}
      >
        {guardando ? (
          <ActivityIndicator size="small" color={colors.onPrimary} />
        ) : (
          <>
            <MaterialCommunityIcons name="content-save-outline" size={18} color={colors.onPrimary} />
            <Text style={[styles.saveText, { color: colors.onPrimary }]}>Guardar nota</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
  headRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  flex: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800' },
  sub: { fontSize: 11.5, marginTop: 2 },
  divider: { height: 1, marginVertical: 12 },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 8,
    marginLeft: 2,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  scrollRow: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 12.5, fontWeight: '600' },
  empty: { fontSize: 13, lineHeight: 19 },
  loader: { marginVertical: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  notaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notaInput: {
    width: 72,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  notaHint: { flex: 1, fontSize: 11.5, lineHeight: 16 },
  saveBtn: {
    marginTop: 16,
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveText: { fontSize: 14, fontWeight: '800' },
});