import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { notify } from '../utils/notify';
import Header from '../components/Header';
import CargaNotas from '../components/CargaNotas';
import { PERIODS, ROLES, courses, grades, students, subjects, toDate } from '../services/firestore';
import {
  colorNota,
  etiquetaCurso,
  etiquetaTipoNota,
  especialidadDe,
  nombreCompleto,
  notaTexto,
  promedioDe,
  promedioTexto,
} from '../utils/malla';

const TODOS = 'todos';
const TODAS_MATERIAS = 'todas';
const PERIODOS = Object.values(PERIODS);

const fechaTexto = (fecha) => {
  const fechaObjeto = toDate(fecha);
  if (!fechaObjeto) return '';
  return fechaObjeto.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const agruparPorAlumno = (notas = []) =>
  notas.reduce((mapa, nota) => {
    if (!nota.alumnoId) return mapa;
    mapa[nota.alumnoId] = [...(mapa[nota.alumnoId] ?? []), nota];
    return mapa;
  }, {});

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

function Tarjeta({ children, colors, style }) {
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

function Cargando({ colors, texto = 'Cargando…' }) {
  return (
    <Tarjeta colors={colors} style={styles.centrado}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.meta, { color: colors.textSecondary }]}>{texto}</Text>
    </Tarjeta>
  );
}

function Vacio({ icon, titulo, texto, colors }) {
  return (
    <Tarjeta colors={colors} style={styles.centrado}>
      <MaterialCommunityIcons name={icon} size={30} color={colors.textSecondary} />
      <Text style={[styles.vacioTitulo, { color: colors.text }]}>{titulo}</Text>
      <Text style={[styles.vacioTexto, { color: colors.textSecondary }]}>{texto}</Text>
    </Tarjeta>
  );
}

function PanelBoletin({ boletin, cargando, periodo, colors }) {
  if (cargando) return <Cargando colors={colors} texto="Cargando boletín…" />;

  if (!boletin.length) {
    return (
      <Vacio
        icon="clipboard-text-outline"
        titulo="Sin notas registradas"
        texto={
          periodo === TODOS
            ? 'Todavía no cargaste evaluaciones para este alumno.'
            : `Todavía no hay evaluaciones para ${periodo.toLowerCase()}.`
        }
        colors={colors}
      />
    );
  }

  const total = boletin.reduce((acc, materia) => acc + (materia.cantidad ?? 0), 0);
  const suma = boletin.reduce((acc, materia) => acc + (materia.promedio ?? 0) * (materia.cantidad ?? 0), 0);
  const promedioGeneral = total ? suma / total : null;

  return (
    <>
      <Tarjeta colors={colors}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>PROMEDIO GENERAL</Text>
        <View style={styles.promedioRow}>
          <Text style={[styles.promedioGrande, { color: colorNota(promedioGeneral, colors) }]}>
            {promedioTexto(promedioGeneral)}
          </Text>
          <Text style={[styles.meta, styles.flex, { color: colors.textSecondary }]}>
            {`${total} ${total === 1 ? 'evaluación' : 'evaluaciones'} · ${boletin.length} ${
              boletin.length === 1 ? 'materia' : 'materias'
            }${periodo === TODOS ? '' : ` · ${periodo}`}`}
          </Text>
        </View>
      </Tarjeta>

      {boletin.map((materia) => (
        <Tarjeta key={materia.materiaId} colors={colors}>
          <View style={styles.materiaHead}>
            <View style={styles.flex}>
              <Text style={[styles.materiaNombre, { color: colors.text }]} numberOfLines={2}>
                {materia.nombre}
              </Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {`${materia.cantidad ?? 0} ${materia.cantidad === 1 ? 'nota' : 'notas'}`}
              </Text>
            </View>
            <View
              style={[
                styles.badge,
                { borderColor: colorNota(materia.promedio, colors), backgroundColor: colorNota(materia.promedio, colors) + '1F' },
              ]}
            >
              <Text style={[styles.badgeTexto, { color: colorNota(materia.promedio, colors) }]}>
                {promedioTexto(materia.promedio)}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {(materia.notas ?? []).map((nota) => (
            <View key={nota.id ?? `${nota.materiaId}-${nota.fecha?.seconds ?? ''}`} style={styles.notaRow}>
              <View
                style={[
                  styles.notaBadge,
                  { borderColor: colorNota(nota.nota, colors), backgroundColor: colorNota(nota.nota, colors) + '1F' },
                ]}
              >
                <Text style={[styles.notaBadgeTexto, { color: colorNota(nota.nota, colors) }]}>
                  {notaTexto(nota.nota)}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text style={[styles.notaTitulo, { color: colors.text }]}>
                  {[etiquetaTipoNota(nota.tipo), nota.periodo].filter(Boolean).join(' · ')}
                </Text>
                <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={2}>
                  {[fechaTexto(nota.fecha), nota.descripcion].filter(Boolean).join(' · ') || 'Sin descripción'}
                </Text>
              </View>
            </View>
          ))}
        </Tarjeta>
      ))}
    </>
  );
}

function PanelAlumnos({ alumnos, notasPorAlumno, nombresMaterias, mostrarMateria, colors }) {
  if (!alumnos.length) {
    return (
      <Vacio
        icon="account-group-outline"
        titulo="Sin alumnos"
        texto="Este curso no tiene alumnos activos cargados."
        colors={colors}
      />
    );
  }

  const conNotas = alumnos.filter((alumno) => (notasPorAlumno[alumno.id] ?? []).length);
  if (!conNotas.length) {
    return (
      <Vacio
        icon="clipboard-text-outline"
        titulo="Sin notas registradas"
        texto="Todavía no hay evaluaciones para el curso y el período elegidos."
        colors={colors}
      />
    );
  }

  return (
    <Tarjeta colors={colors}>
      <View style={styles.materiaHead}>
        <Text style={[styles.materiaNombre, styles.flex, { color: colors.text }]}>Alumnos y notas</Text>
        <View style={[styles.countBadge, { backgroundColor: colors.surfaceVariant }]}>
          <Text style={[styles.countText, { color: colors.textSecondary }]}>
            {`${conNotas.length}/${alumnos.length}`}
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {alumnos.map((alumno, index) => {
        const notas = notasPorAlumno[alumno.id] ?? [];
        const promedio = promedioDe(notas);
        const ultimaFila = index === alumnos.length - 1;

        return (
          <View
            key={alumno.id}
            style={[
              styles.alumnoRow,
              !ultimaFila && { borderBottomWidth: 1, borderBottomColor: colors.border },
            ]}
          >
            <View style={styles.flex}>
              <Text style={[styles.materiaNombre, { color: colors.text }]} numberOfLines={1}>
                {nombreCompleto(alumno)}
              </Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {alumno.legajo ? `Legajo ${alumno.legajo}` : 'Sin legajo'}
              </Text>

              {notas.length ? (
                <View style={styles.notasFila}>
                  {notas.slice(0, 3).map((nota) => (
                    <View
                      key={nota.id}
                      style={[styles.notaChip, { backgroundColor: colors.surfaceVariant }]}
                    >
                      <Text style={[styles.notaChipValor, { color: colorNota(nota.nota, colors) }]}>
                        {notaTexto(nota.nota)}
                      </Text>
                      <Text style={[styles.notaChipTexto, { color: colors.textSecondary }]} numberOfLines={1}>
                        {mostrarMateria
                          ? `${nombresMaterias[nota.materiaId]?.nombre ?? 'Materia'} · ${etiquetaTipoNota(nota.tipo)}`
                          : etiquetaTipoNota(nota.tipo)}
                      </Text>
                      <Text style={[styles.notaChipTexto, { color: colors.textSecondary }]}>
                        {fechaTexto(nota.fecha)}
                      </Text>
                    </View>
                  ))}
                  {notas.length > 3 && (
                    <Text style={[styles.masNotas, { color: colors.textSecondary }]}>
                      {`+${notas.length - 3}`}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={[styles.sinNotas, { color: colors.textSecondary }]}>Sin notas en este período</Text>
              )}
            </View>

            <View style={styles.alumnoPromedio}>
              <Text style={[styles.promedio, { color: colorNota(promedio, colors) }]}>
                {promedioTexto(promedio)}
              </Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {notas.length ? `${notas.length} nota${notas.length === 1 ? '' : 's'}` : '—'}
              </Text>
            </View>
          </View>
        );
      })}
    </Tarjeta>
  );
}

export default function BoletinScreen() {
  const { colors } = useTheme();
  const { perfil, rol } = useAuth();

  const esAlumno = rol === ROLES.ALUMNO;
  const esProfesor = rol === ROLES.PROFESOR;
  const esStaff = !esAlumno && !esProfesor && !!rol;
  const esPanel = esProfesor || esStaff;

  const [periodo, setPeriodo] = useState(TODOS);
  const [tick, setTick] = useState(0);

  const primeraCarga = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (primeraCarga.current) {
        primeraCarga.current = false;
        return;
      }
      setTick((valor) => valor + 1);
    }, [])
  );

  const alumnoId = perfil?.alumnoId ?? null;
  const [boletin, setBoletin] = useState([]);
  const [cargandoBoletin, setCargandoBoletin] = useState(false);

  const misMaterias = useMemo(() => perfil?.materias ?? [], [perfil]);
  const misCursos = useMemo(
    () => [...new Set(misMaterias.map((materia) => materia.cursoId).filter(Boolean))],
    [misMaterias]
  );

  const [cursos, setCursos] = useState([]);
  const [mapaCursos, setMapaCursos] = useState({});
  const [materiasCurso, setMateriasCurso] = useState([]);
  const [seleccionCurso, setSeleccionCurso] = useState(null);
  const [seleccionMateria, setSeleccionMateria] = useState(TODAS_MATERIAS);

  const [alumnos, setAlumnos] = useState([]);
  const [notasPorAlumno, setNotasPorAlumno] = useState({});
  const [nombresMaterias, setNombresMaterias] = useState({});
  const [cargandoPanel, setCargandoPanel] = useState(false);

  const opcionesCurso = useMemo(() => {
    if (esProfesor) return misCursos.map((id) => ({ id, nombre: mapaCursos[id]?.nombre ?? id }));
    if (esStaff) return cursos.map((curso) => ({ id: curso.id, nombre: curso.nombre }));
    return [];
  }, [esProfesor, esStaff, misCursos, mapaCursos, cursos]);

  const cursoPanel = opcionesCurso.some((curso) => curso.id === seleccionCurso)
    ? seleccionCurso
    : opcionesCurso[0]?.id ?? null;

  const opcionesMateria = useMemo(() => {
    if (esProfesor) return misMaterias.filter((materia) => materia.cursoId === cursoPanel);
    if (esStaff) return materiasCurso;
    return [];
  }, [esProfesor, esStaff, misMaterias, materiasCurso, cursoPanel]);

  const materiaFiltro = esProfesor
    ? opcionesMateria.some((materia) => materia.id === seleccionMateria)
      ? seleccionMateria
      : opcionesMateria[0]?.id ?? null
    : seleccionMateria === TODAS_MATERIAS
    ? null
    : seleccionMateria;

  const nombreMateriaSeleccionada = esProfesor
    ? opcionesMateria.find((materia) => materia.id === materiaFiltro)?.nombre ?? ''
    : '';
  const nombreCursoSeleccionado = opcionesCurso.find((curso) => curso.id === cursoPanel)?.nombre ?? '';

  useEffect(() => {
    if (!esAlumno || !alumnoId) {
      setBoletin([]);
      return;
    }

    let vigente = true;
    setCargandoBoletin(true);

    (async () => {
      try {
        const datos = await grades.obtenerBoletin(alumnoId, {
          periodo: periodo === TODOS ? undefined : periodo,
        });
        const mapa = await subjects.obtenerMapaMaterias(datos.map((materia) => materia.materiaId));
        if (!vigente) return;
        setBoletin(
          datos.map((materia) => ({
            ...materia,
            nombre: mapa[materia.materiaId]?.nombre ?? 'Materia',
          }))
        );
      } catch (error) {
        if (!vigente) return;
        setBoletin([]);
        notify('No se pudo cargar el boletín', error?.message ?? '');
      } finally {
        if (vigente) setCargandoBoletin(false);
      }
    })();

    return () => {
      vigente = false;
    };
  }, [alumnoId, esAlumno, periodo, tick]);

  useEffect(() => {
    if (!esProfesor || !misCursos.length) {
      setMapaCursos({});
      return;
    }

    let vigente = true;
    courses
      .obtenerMapaCursos(misCursos)
      .then((mapa) => {
        if (vigente) setMapaCursos(mapa);
      })
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [esProfesor, misCursos]);

  useEffect(() => {
    if (!esStaff) return;

    let vigente = true;
    courses
      .obtenerCursos()
      .then((lista) => {
        if (vigente) setCursos(lista);
      })
      .catch((error) => {
        if (!vigente) return;
        notify('No se pudieron cargar los cursos', error?.message ?? '');
      });

    return () => {
      vigente = false;
    };
  }, [esStaff, tick]);

  const cursoPrevio = useRef(null);
  useEffect(() => {
    if (!esStaff || !cursoPanel) {
      setMateriasCurso([]);
      return;
    }

    let vigente = true;
    if (cursoPrevio.current !== cursoPanel) {
      cursoPrevio.current = cursoPanel;
      setSeleccionMateria(TODAS_MATERIAS);
    }

    subjects
      .obtenerMaterias({ cursoId: cursoPanel })
      .then((lista) => {
        if (vigente) setMateriasCurso(lista);
      })
      .catch((error) => {
        if (!vigente) return;
        setMateriasCurso([]);
        notify('No se pudieron cargar las materias', error?.message ?? '');
      });

    return () => {
      vigente = false;
    };
  }, [esStaff, cursoPanel, tick]);

  useEffect(() => {
    if (!esPanel || !cursoPanel) return;

    let vigente = true;
    setCargandoPanel(true);

    (async () => {
      try {
        const [listaAlumnos, notas] = await Promise.all([
          students.obtenerAlumnos({ cursoId: cursoPanel }),
          grades.obtenerNotas({
            cursoId: cursoPanel,
            materiaId: esProfesor ? materiaFiltro : materiaFiltro ?? undefined,
            periodo: periodo === TODOS ? undefined : periodo,
          }),
        ]);
        const mapa = await subjects.obtenerMapaMaterias(notas.map((nota) => nota.materiaId));
        if (!vigente) return;
        setAlumnos(listaAlumnos);
        setNotasPorAlumno(agruparPorAlumno(notas));
        setNombresMaterias(mapa);
      } catch (error) {
        if (!vigente) return;
        setAlumnos([]);
        setNotasPorAlumno({});
        notify('No se pudieron cargar las notas', error?.message ?? '');
      } finally {
        if (vigente) setCargandoPanel(false);
      }
    })();

    return () => {
      vigente = false;
    };
  }, [esPanel, esProfesor, cursoPanel, materiaFiltro, periodo, tick]);

  const subtitulo = esAlumno
    ? 'Promedios por materia y período'
    : esProfesor
    ? 'Carga de notas por materia'
    : esStaff
    ? 'Consulta de notas por curso'
    : 'Boletín de calificaciones';

  const selectorPeriodo = (
    <Tarjeta colors={colors}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>PERÍODO</Text>
      <View style={styles.chipsRow}>
        <Chip
          label="Todos"
          active={periodo === TODOS}
          onPress={() => setPeriodo(TODOS)}
          colors={colors}
        />
        {PERIODOS.map((item) => (
          <Chip
            key={item}
            label={item}
            active={periodo === item}
            onPress={() => setPeriodo(item)}
            colors={colors}
          />
        ))}
      </View>
    </Tarjeta>
  );

  const panelAlumno = esAlumno ? (
    <>
      <Tarjeta colors={colors}>
        <View style={styles.cursoRow}>
          <View style={[styles.cursoIcono, { backgroundColor: colors.primary + '22' }]}>
            <MaterialCommunityIcons name="school-outline" size={24} color={colors.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={[styles.cursoTitulo, { color: colors.text }]}>
              {etiquetaCurso(perfil?.anio, perfil?.division)}
            </Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]} numberOfLines={1}>
              {perfil?.cursoNombre || 'Sin curso asignado'}
            </Text>
          </View>
          {especialidadDe({ orientacion: perfil?.cursoDoc?.orientacion }) ? (
            <View style={[styles.espChip, { backgroundColor: colors.primary + '1F' }]}>
              <Text style={[styles.espChipText, { color: colors.primary }]}>
                {especialidadDe({ orientacion: perfil?.cursoDoc?.orientacion })}
              </Text>
            </View>
          ) : null}
        </View>
      </Tarjeta>

      {alumnoId ? (
        <PanelBoletin boletin={boletin} cargando={cargandoBoletin} periodo={periodo} colors={colors} />
      ) : (
        <Vacio
          icon="account-alert-outline"
          titulo="Perfil sin alumno vinculado"
          texto="Tu usuario no está asociado a un alumno. Contactá a la preceptoría para regularizarlo."
          colors={colors}
        />
      )}
    </>
  ) : null;

  const panelDocente = esProfesor ? (
    <>
      {!misMaterias.length ? (
        <Vacio
          icon="human-male-board"
          titulo="Sin materias asignadas"
          texto="No tenés materias cargadas. Pedí que la dirección te asigne una materia para poder cargar notas."
          colors={colors}
        />
      ) : (
        <>
          <CargaNotas
            alumnos={alumnos}
            cursoId={cursoPanel}
            materiaId={materiaFiltro}
            onCargada={() => setTick((valor) => valor + 1)}
          />
          {cargandoPanel ? (
            <Cargando colors={colors} texto="Cargando notas…" />
          ) : (
            <PanelAlumnos
              alumnos={alumnos}
              notasPorAlumno={notasPorAlumno}
              nombresMaterias={nombresMaterias}
              mostrarMateria={false}
              colors={colors}
            />
          )}
        </>
      )}
    </>
  ) : null;

  const panelStaff = esStaff ? (
    <>
      {!opcionesCurso.length && !cargandoPanel ? (
        <Vacio
          icon="school-outline"
          titulo="Sin cursos cargados"
          texto="No hay cursos activos en el sistema."
          colors={colors}
        />
      ) : (
        <>
          {cargandoPanel ? (
            <Cargando colors={colors} texto="Cargando notas…" />
          ) : (
            <PanelAlumnos
              alumnos={alumnos}
              notasPorAlumno={notasPorAlumno}
              nombresMaterias={nombresMaterias}
              mostrarMateria={materiaFiltro === null}
              colors={colors}
            />
          )}
        </>
      )}
    </>
  ) : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Boletín" subtitle={subtitulo} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {(esAlumno || esPanel) && selectorPeriodo}

        {esPanel && opcionesCurso.length > 0 && (
          <Tarjeta colors={colors}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>CURSO</Text>
            <View style={styles.chipsRow}>
              {opcionesCurso.map((curso) => (
                <Chip
                  key={curso.id}
                  label={curso.nombre}
                  active={cursoPanel === curso.id}
                  onPress={() => setSeleccionCurso(curso.id)}
                  colors={colors}
                />
              ))}
            </View>

            {opcionesMateria.length > 0 && (
              <>
                <Text style={[styles.label, { color: colors.textSecondary }]}>MATERIA</Text>
                <View style={styles.chipsRow}>
                  {esStaff && (
                    <Chip
                      label="Todas"
                      active={materiaFiltro === null}
                      onPress={() => setSeleccionMateria(TODAS_MATERIAS)}
                      colors={colors}
                    />
                  )}
                  {opcionesMateria.map((materia) => (
                    <Chip
                      key={materia.id}
                      label={materia.nombre}
                      active={materiaFiltro === materia.id}
                      onPress={() => setSeleccionMateria(materia.id)}
                      colors={colors}
                    />
                  ))}
                </View>
              </>
            )}

            <Text style={[styles.meta, { color: colors.textSecondary, marginTop: 10 }]} numberOfLines={1}>
              {esProfesor
                ? `${nombreCursoSeleccionado} · ${nombreMateriaSeleccionada || 'sin materia'}`
                : `${nombreCursoSeleccionado}${materiaFiltro ? ` · ${nombreMateriaSeleccionada}` : ''}`}
            </Text>
          </Tarjeta>
        )}

        {panelAlumno}
        {panelDocente}
        {panelStaff}

        {!rol && (
          <Vacio
            icon="account-question-outline"
            titulo="Sin permisos asignados"
            texto="Tu usuario todavía no tiene un rol asignado, así que no podés ver el boletín."
            colors={colors}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  centrado: { alignItems: 'center', justifyContent: 'center', paddingVertical: 26, gap: 6 },
  flex: { flex: 1 },
  divider: { height: 1, marginVertical: 12 },

  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 2,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: { fontSize: 12.5, fontWeight: '600' },
  meta: { fontSize: 11.5, lineHeight: 16 },

  cursoRow: { flexDirection: 'row', alignItems: 'center' },
  cursoIcono: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cursoTitulo: { fontSize: 20, fontWeight: '800' },
  espChip: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9 },
  espChipText: { fontSize: 11, fontWeight: '800' },

  promedioRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  promedioGrande: { fontSize: 34, fontWeight: '800' },
  promedio: { fontSize: 17, fontWeight: '800' },

  materiaHead: { flexDirection: 'row', alignItems: 'center' },
  materiaNombre: { fontSize: 15, fontWeight: '800' },
  badge: {
    minWidth: 46,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  badgeTexto: { fontSize: 16, fontWeight: '800' },
  countBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 9 },
  countText: { fontSize: 11, fontWeight: '700' },

  notaRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 10 },
  notaBadge: {
    width: 42,
    height: 42,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notaBadgeTexto: { fontSize: 15, fontWeight: '800' },
  notaTitulo: { fontSize: 13.5, fontWeight: '700' },

  alumnoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 11 },
  alumnoPromedio: { alignItems: 'flex-end', paddingLeft: 10, minWidth: 58 },
  notasFila: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 8 },
  notaChip: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, minWidth: 62 },
  notaChipValor: { fontSize: 14, fontWeight: '800' },
  notaChipTexto: { fontSize: 9.5, marginTop: 1 },
  masNotas: { fontSize: 11, fontWeight: '700' },
  sinNotas: { fontSize: 11.5, marginTop: 6, fontStyle: 'italic' },

  vacioTitulo: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  vacioTexto: { fontSize: 12.5, lineHeight: 19, textAlign: 'center', paddingHorizontal: 8 },
});