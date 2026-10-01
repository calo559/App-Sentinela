// CargaNotas — sección del docente dentro del Boletín:
//   1) elige la materia que dicta en ese curso,
//   2) carga/edita las notas de cada alumno en tres columnas:
//      TP (trabajos prácticos) · Evaluaciones · Exposiciones (se guarda al escribir),
//   3) por alumno, arma el informe de avance de ESA materia: TED / TEP / TEA + descripción
//      (los rangos numéricos solo los ve el docente; el alumno ve la sigla y la descripción).
import { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getActiveUser } from '../services/authService';
import {
  alumnosDeCurso,
  getNotasMateria,
  setNota,
  getInformesMateria,
  setInforme,
} from '../services/gradesService';
import { materiasDe, etiquetaCurso, INFORME_OPCIONES, TIPOS_NOTA } from '../utils/malla';

export default function CargaNotas({ curso, division, cuatri, misMaterias = [] }) {
  const { colors } = useTheme();

  const cursoDiv = etiquetaCurso(curso, division);
  const delCurso = materiasDe(curso, division);
  const disponibles = misMaterias.filter((m) => delCurso.includes(m));
  const alumnos = useMemo(() => alumnosDeCurso(cursoDiv), [cursoDiv]);

  const [materia, setMateria] = useState(disponibles[0] || null);
  const [notas, setNotas] = useState({});        // alumnoId -> { tp: '8', ev: '', ex: '' }
  const [invalidas, setInvalidas] = useState({}); // `${alumnoId}.${tipo}` -> true si no es válida
  const [informes, setInformes] = useState({});   // alumnoId -> informe guardado de ESTA materia
  const [abierto, setAbierto] = useState(null);   // alumnoId con el informe abierto
  const [clasif, setClasif] = useState(null);
  const [desc, setDesc] = useState('');
  const [aviso, setAviso] = useState(null);       // { tipo: 'ok'|'error', texto }

  const dispKey = disponibles.join('|');

  // Cambió el curso: si la materia ya no aplica, vamos a la primera disponible
  useEffect(() => {
    const lista = dispKey ? dispKey.split('|') : [];
    if (!lista.includes(materia)) setMateria(lista[0] || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispKey]);

  // Notas e informes guardados (se recargan al cambiar curso, materia o cuatrimestre)
  useEffect(() => {
    setAbierto(null);
    setAviso(null);
    setClasif(null);
    setDesc('');
    if (!materia) {
      setNotas({});
      setInformes({});
      return;
    }
    const guardadas = getNotasMateria({ cursoDiv, materia, cuatri });
    const mapa = {};
    Object.keys(guardadas).forEach((id) => {
      const comp = guardadas[id] || {};
      mapa[id] = {
        tp: comp.tp == null ? '' : String(comp.tp),
        ev: comp.ev == null ? '' : String(comp.ev),
        ex: comp.ex == null ? '' : String(comp.ex),
      };
    });
    setNotas(mapa);
    setInvalidas({});
    setInformes(getInformesMateria({ cursoDiv, cuatri, materia }));
  }, [cursoDiv, materia, cuatri]);

  const onChangeNota = (id, tipo, texto) => {
    const limpio = String(texto).replace(/[^0-9]/g, '').slice(0, 2);
    setNotas((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), [tipo]: limpio } }));

    const marca = `${id}.${tipo}`;
    if (limpio === '') {
      setInvalidas((prev) => ({ ...prev, [marca]: false }));
      setNota({ cursoDiv, materia, cuatri, alumnoId: id, tipo }, null);
      return;
    }
    const n = parseInt(limpio, 10);
    const invalida = n < 1 || n > 10;
    setInvalidas((prev) => ({ ...prev, [marca]: invalida }));
    if (!invalida) setNota({ cursoDiv, materia, cuatri, alumnoId: id, tipo }, n);
  };

  const toggleInforme = (alumno) => {
    const yaAbierto = abierto === alumno.id;
    setAviso(null);
    setAbierto(yaAbierto ? null : alumno.id);
    const guardado = informes[alumno.id];
    setClasif(!yaAbierto && guardado?.clasif ? guardado.clasif : null);
    setDesc(!yaAbierto && guardado?.desc ? guardado.desc : '');
  };

  const guardarInforme = (alumno) => {
    if (!clasif) {
      setAviso({ tipo: 'error', texto: 'Elegí una opción: TED, TEP o TEA.' });
      return;
    }
    const user = getActiveUser();
    const data = {
      clasif,
      desc: desc.trim(),
      autor: [user?.nombre, user?.apellido].filter(Boolean).join(' ') || 'Docente',
      materia,
      fecha: new Date().toLocaleDateString('es-AR'),
    };
    setInforme({ cursoDiv, cuatri, materia, alumnoId: alumno.id }, data);
    setInformes((prev) => ({ ...prev, [alumno.id]: data }));
    setAbierto(null);
    setClasif(null);
    setDesc('');
    setAviso({ tipo: 'ok', texto: `Informe guardado · ${alumno.nombre}` });
  };

  const s = useMemo(
    () =>
      StyleSheet.create({
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
        label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, marginBottom: 10 },
        chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        chip: {
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
        },
        chipText: { fontSize: 12.5, fontWeight: '600' },
        empty: { fontSize: 13, lineHeight: 19 },
        headRow: { flexDirection: 'row', alignItems: 'center' },
        iconBox: {
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        },
        title: { fontSize: 16, fontWeight: '800' },
        sub: { fontSize: 11.5, marginTop: 2 },
        divider: { height: 1, marginVertical: 12 },
        alumnoRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 9,
          gap: 6,
        },
        alumnoName: { fontSize: 14, fontWeight: '600', flex: 1, paddingRight: 6 },
        tableHead: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingBottom: 4,
          marginBottom: 2,
        },
        headName: {
          flex: 1,
          paddingRight: 6,
          fontSize: 9.5,
          fontWeight: '800',
          letterSpacing: 0.6,
        },
        headTipo: {
          width: 56,
          textAlign: 'center',
          fontSize: 9.5,
          fontWeight: '800',
          letterSpacing: 0.4,
        },
        notaInput: {
          width: 56,
          borderWidth: 1,
          borderRadius: 10,
          paddingVertical: 6,
          paddingHorizontal: 4,
          fontSize: 15,
          fontWeight: '700',
          textAlign: 'center',
        },
        rangoHint: { fontSize: 11, lineHeight: 16, marginTop: 2 },
        hint: { fontSize: 11, marginTop: 8 },
        informeHead: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
        badge: {
          paddingHorizontal: 9,
          paddingVertical: 4,
          borderRadius: 8,
          borderWidth: 1.5,
          marginRight: 8,
        },
        badgeText: { fontSize: 12, fontWeight: '800' },
        informeMeta: { fontSize: 11, marginTop: 3 },
        panel: {
          borderWidth: 1,
          borderRadius: 14,
          padding: 12,
          marginBottom: 8,
          gap: 8,
        },
        panelLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
        textArea: {
          minHeight: 76,
          borderWidth: 1,
          borderRadius: 12,
          padding: 10,
          fontSize: 13.5,
          textAlignVertical: 'top',
        },
        actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
        cancelBtn: {
          paddingVertical: 9,
          paddingHorizontal: 14,
          borderRadius: 10,
          borderWidth: 1,
        },
        cancelText: { fontSize: 13, fontWeight: '600' },
        saveBtn: {
          paddingVertical: 9,
          paddingHorizontal: 16,
          borderRadius: 10,
        },
        saveText: { fontSize: 13, fontWeight: '800' },
        avisoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
        avisoText: { fontSize: 12, fontWeight: '600', flex: 1 },
      }),
    [colors]
  );

  /* ------------------------------------------------------------------ UI */

  const materiaCard = (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[s.label, { color: colors.textSecondary }]}>MATERIA A CARGAR</Text>
      {disponibles.length ? (
        <View style={s.chipsRow}>
          {disponibles.map((m) => {
            const activeM = materia === m;
            return (
              <TouchableOpacity
                key={m}
                activeOpacity={0.75}
                onPress={() => setMateria(m)}
                style={[
                  s.chip,
                  { borderColor: colors.border, backgroundColor: colors.surfaceVariant },
                  activeM && {
                    borderColor: colors.primary,
                    backgroundColor: colors.primary + '1F',
                  },
                ]}
              >
                <Text
                  style={[
                    s.chipText,
                    { color: colors.textSecondary },
                    activeM && { color: colors.primary, fontWeight: '800' },
                  ]}
                >
                  {m}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <Text style={[s.empty, { color: colors.textSecondary }]}>
          {`No dictás materias en ${cursoDiv}. Cargá las tuyas desde Perfil → Editar perfil.`}
        </Text>
      )}
    </View>
  );

  if (!materia) return materiaCard;

  return (
    <View>
      {materiaCard}

      {/* Notas */}
      <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={s.headRow}>
          <View style={[s.iconBox, { backgroundColor: colors.primary + '22' }]}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: colors.text }]}>Cargar notas</Text>
            <Text style={[s.sub, { color: colors.textSecondary }]}>
              {`${materia} · ${cursoDiv} · ${cuatri}° cuatrimestre`}
            </Text>
          </View>
        </View>

        <View style={[s.divider, { backgroundColor: colors.border }]} />

        {/* Encabezado de columnas: TP | Evaluaciones | Exposiciones */}
        <View style={s.tableHead}>
          <Text style={[s.headName, { color: colors.textSecondary }]}>ALUMNO</Text>
          {TIPOS_NOTA.map((t) => (
            <Text key={t.key} style={[s.headTipo, { color: colors.textSecondary }]}>
              {t.corto}
            </Text>
          ))}
        </View>

        {alumnos.map((al) => (
          <View key={al.id} style={s.alumnoRow}>
            <Text style={[s.alumnoName, { color: colors.text }]} numberOfLines={1}>
              {al.nombre}
            </Text>
            {TIPOS_NOTA.map((t) => {
              const marca = `${al.id}.${t.key}`;
              return (
                <TextInput
                  key={t.key}
                  value={notas[al.id]?.[t.key] ?? ''}
                  onChangeText={(txt) => onChangeNota(al.id, t.key, txt)}
                  keyboardType="number-pad"
                  maxLength={2}
                  placeholder="—"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    s.notaInput,
                    {
                      borderColor: invalidas[marca] ? colors.error : colors.border,
                      backgroundColor: colors.surfaceVariant,
                      color: invalidas[marca] ? colors.error : colors.text,
                    },
                  ]}
                />
              );
            })}
          </View>
        ))}

        <Text style={[s.hint, { color: colors.textSecondary }]}>
          Cada columna es 1 a 10 · se guarda automáticamente · vacío = sin nota
        </Text>
      </View>

      {/* Informes de avance */}
      <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={s.headRow}>
          <View style={[s.iconBox, { backgroundColor: colors.primary + '22' }]}>
            <MaterialCommunityIcons
              name="file-document-edit-outline"
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.title, { color: colors.text }]}>Informes de avance</Text>
            <Text style={[s.sub, { color: colors.textSecondary }]}>
              {`${cursoDiv} · ${cuatri}° cuatrimestre · ${materia}`}
            </Text>
          </View>
        </View>

        <View style={[s.divider, { backgroundColor: colors.border }]} />

        {alumnos.map((al) => {
          const inf = informes[al.id];
          const colorClasif =
            INFORME_OPCIONES.find((o) => o.key === inf?.clasif)?.color || colors.textSecondary;
          const open = abierto === al.id;

          return (
            <View key={al.id}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => toggleInforme(al)}
                style={s.informeHead}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[s.alumnoName, { color: colors.text, paddingRight: 0 }]}>
                    {al.nombre}
                  </Text>
                  <Text style={[s.informeMeta, { color: colors.textSecondary }]}>
                    {inf
                      ? `${inf.materia} · ${inf.fecha}`
                      : 'Sin informe en este cuatrimestre'}
                  </Text>
                </View>

                {inf ? (
                  <View style={[s.badge, { borderColor: colorClasif, backgroundColor: colorClasif + '22' }]}>
                    <Text style={[s.badgeText, { color: colorClasif }]}>{inf.clasif}</Text>
                  </View>
                ) : null}

                <MaterialCommunityIcons
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {open && (
                <View
                  style={[
                    s.panel,
                    { borderColor: colors.primary + '66', backgroundColor: colors.surfaceVariant },
                  ]}
                >
                  <Text style={[s.panelLabel, { color: colors.textSecondary }]}>
                    OPCIÓN DEL INFORME
                  </Text>
                  <View style={s.chipsRow}>
                    {INFORME_OPCIONES.map((op) => {
                      const activeO = clasif === op.key;
                      return (
                        <TouchableOpacity
                          key={op.key}
                          activeOpacity={0.75}
                          onPress={() => setClasif(op.key)}
                          style={[
                            s.chip,
                            { borderColor: colors.border, backgroundColor: colors.surface },
                            activeO && { borderColor: op.color, backgroundColor: op.color + '22' },
                          ]}
                        >
                          <Text
                            style={[
                              s.chipText,
                              { color: colors.textSecondary },
                              activeO && { color: op.color, fontWeight: '800' },
                            ]}
                          >
                            {op.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={[s.rangoHint, { color: colors.textSecondary }]}>
                    {`Referencia para vos (el alumno NO ve los números): ${INFORME_OPCIONES.map(
                      (o) => `${o.label} ${o.rango}`
                    ).join(' · ')}`}
                  </Text>

                  <Text style={[s.panelLabel, { color: colors.textSecondary }]}>
                    DESCRIPCIÓN
                  </Text>
                  <TextInput
                    value={desc}
                    onChangeText={setDesc}
                    multiline
                    maxLength={280}
                    placeholder="Descripción breve del alumno en tu materia…"
                    placeholderTextColor={colors.textSecondary}
                    style={[
                      s.textArea,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                        color: colors.text,
                      },
                    ]}
                  />

                  <View style={s.actions}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setAbierto(null)}
                      style={[
                        s.cancelBtn,
                        { borderColor: colors.border, backgroundColor: colors.surface },
                      ]}
                    >
                      <Text style={[s.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => guardarInforme(al)}
                      style={[s.saveBtn, { backgroundColor: colors.primary }]}
                    >
                      <Text style={[s.saveText, { color: colors.onPrimary || '#0B1628' }]}>
                        Guardar informe
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {aviso && (
          <View style={s.avisoRow}>
            <MaterialCommunityIcons
              name={aviso.tipo === 'ok' ? 'check-circle-outline' : 'alert-circle-outline'}
              size={15}
              color={aviso.tipo === 'ok' ? colors.success : colors.error}
            />
            <Text
              style={[
                s.avisoText,
                { color: aviso.tipo === 'ok' ? colors.success : colors.error },
              ]}
            >
              {aviso.texto}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
