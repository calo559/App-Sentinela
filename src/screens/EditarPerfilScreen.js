// EditarPerfilScreen — edición del perfil para cualquier rol.
// Se abre desde Perfil → "Editar perfil" (Stack, con botón atrás).
// Los cambios se guardan en authService y quedan visibles al volver.
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { getActiveUser, updateProfile } from '../services/authService';
import { InputField, PasswordField, SelectChips, MultiChips } from '../components/FormFields';
import { materiasDe, divisionesDe } from '../utils/malla';

const CURSOS = ['1°', '2°', '3°', '4°', '5°', '6°', '7°'];

export default function EditarPerfilScreen({ navigation }) {
  const { colors } = useTheme();
  const active = useMemo(() => getActiveUser() || {}, []);
  const role = active.role;
  const esDocente = role === 'docente';
  const esAlumnoOCurso = role === 'alumno' || role === 'preceptor';

  const [nombre, setNombre] = useState(active.nombre || '');
  const [apellido, setApellido] = useState(active.apellido || '');
  const [dni, setDni] = useState(active.dni || '');
  const [email, setEmail] = useState(active.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [curso, setCurso] = useState(active.curso || '');
  const [division, setDivision] = useState(active.division || '');
  // Docente: puede tener varios cursos, cada uno con sus materias
  const cursosGuardados = Array.isArray(active.cursos) ? active.cursos : [];
  const [aniosDoc, setAniosDoc] = useState(() => {
    if (cursosGuardados.length) return [...new Set(cursosGuardados.map((c) => c.curso))];
    return active.anio ? [`${active.anio}°`] : [];
  });
  const [divSel, setDivSel] = useState(() => {
    const out = {};
    cursosGuardados.forEach((c) => {
      out[c.curso] = [...new Set([...(out[c.curso] || []), String(c.division)])];
    });
    return out;
  });
  const [materiasPorCurso, setMateriasPorCurso] = useState(() => {
    const out = {};
    cursosGuardados.forEach((c) => {
      out[`${c.curso}${c.division}`] = Array.isArray(c.materias) ? c.materias : [];
    });
    return out;
  });
  const [titulo, setTitulo] = useState(active.titulo || '');

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null); // { tipo: 'error', texto }

  // Cursos elegidos: cada combinación año + división ("7°" + "2" → "7°2"),
  // ordenados como en la escuela (1°→7°, división 1→5).
  const aniosOrdenados = CURSOS.filter((anio) => aniosDoc.includes(anio));
  const cursosDoc = aniosOrdenados.flatMap((anio) =>
    (divSel[anio] || []).slice().sort().map((div) => ({
      anio,
      div,
      etiqueta: `${anio}${div}`,
    }))
  );

  const toggleAnioDoc = (anio) => {
    const quitaba = aniosDoc.includes(anio);
    setAniosDoc(quitaba ? aniosDoc.filter((x) => x !== anio) : [...aniosDoc, anio]);
    if (quitaba) {
      // Quitar un año borra sus divisiones y las materias de sus cursos
      const { [anio]: _sinAnio, ...divResto } = divSel;
      setDivSel(divResto);
      setMateriasPorCurso((prev) =>
        Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith(anio)))
      );
    }
    setErrors((prev) => ({ ...prev, aniosDoc: '' }));
  };

  const toggleDivisionDoc = (anio, div) => {
    const actual = divSel[anio] || [];
    const quitaba = actual.includes(div);
    setDivSel({ ...divSel, [anio]: quitaba ? actual.filter((x) => x !== div) : [...actual, div] });
    if (quitaba) {
      const copia = { ...materiasPorCurso };
      delete copia[`${anio}${div}`];
      setMateriasPorCurso(copia);
    }
    setErrors((prev) => ({ ...prev, [`div_${anio}`]: '' }));
  };

  const toggleMateriaDoc = (etiqueta, materia) => {
    const actual = materiasPorCurso[etiqueta] || [];
    setMateriasPorCurso({
      ...materiasPorCurso,
      [etiqueta]: actual.includes(materia)
        ? actual.filter((x) => x !== materia)
        : [...actual, materia],
    });
    setErrors((prev) => ({ ...prev, [`materias_${etiqueta}`]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!apellido.trim()) e.apellido = 'El apellido es requerido';
    if (!dni.trim() || dni.length < 7) e.dni = 'Ingresá un DNI válido';
    if (!email.trim() || !email.includes('@')) e.email = 'Ingresá un correo válido';
    if (password && password.length < 6) e.password = 'Mínimo 6 caracteres';

    if (esDocente) {
      if (aniosDoc.length === 0) e.aniosDoc = 'Seleccioná al menos un año que dictés';
      else
        aniosDoc.forEach((anio) => {
          if (!(divSel[anio] || []).length) e[`div_${anio}`] = `Elegí la división del ${anio}`;
        });
      cursosDoc.forEach((c) => {
        if (!(materiasPorCurso[c.etiqueta] || []).length)
          e[`materias_${c.etiqueta}`] = 'Elegí al menos una materia en este curso';
      });
      if (!titulo.trim()) e.titulo = 'El título es requerido';
    } else if (esAlumnoOCurso) {
      if (!curso) e.curso = 'Seleccioná un curso';
      if (!division) e.division = 'Seleccioná una división';
    }
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      setStatus(null);
      return;
    }
    setErrors({});

    try {
      const patch = {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: dni.trim(),
        email: email.trim(),
      };
      if (password) patch.password = password; // vacío = no cambiar

      if (esDocente) {
        patch.anio = (cursosDoc[0]?.anio ?? aniosDoc[0] ?? '').replace(/[^\d]/g, '');
        patch.materias = [...new Set(cursosDoc.flatMap((c) => materiasPorCurso[c.etiqueta] || []))];
        patch.cursos = cursosDoc.map((c) => ({
          curso: c.anio,
          division: c.div,
          materias: materiasPorCurso[c.etiqueta] || [],
        }));
        patch.titulo = titulo.trim();
      } else if (esAlumnoOCurso) {
        patch.curso = curso;
        patch.division = division;
      }

      updateProfile(patch);
      navigation?.goBack?.(); // Perfil vuelve a renderizar con los datos nuevos
    } catch (err) {
      setStatus({ tipo: 'error', texto: err.message });
    }
  };

  const sectionLabel = (text) => <Text style={st.sectionLabel}>{text}</Text>;

  return (
    <View style={[st.container, { backgroundColor: colors.background }]}>
      {/* Barra superior con botón atrás (igual que Configuración) */}
      <View style={st.topBar}>
        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={st.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[st.topTitle, { color: colors.text }]}>Editar perfil</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={st.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[st.intro, { color: colors.textSecondary }]}>
            Actualizá tus datos personales y académicos. Los cambios quedan guardados en tu cuenta.
          </Text>

          {/* Tarjeta de formulario (misma estética que Login / Registro) */}
          <View style={st.card}>
            {sectionLabel('DATOS PERSONALES')}
            <InputField
              icon="account-outline"
              label="Nombre"
              placeholder="Ej: Ana"
              value={nombre}
              onChangeText={setNombre}
              errors={errors}
              setErrors={setErrors}
              errorKey="nombre"
            />
            <InputField
              icon="account-outline"
              label="Apellido"
              placeholder="Ej: Alumna"
              value={apellido}
              onChangeText={setApellido}
              errors={errors}
              setErrors={setErrors}
              errorKey="apellido"
            />
            <InputField
              icon="account-details-outline"
              label="DNI"
              placeholder="Ej: 11111111"
              keyboardType="number-pad"
              maxLength={10}
              value={dni}
              onChangeText={setDni}
              errors={errors}
              setErrors={setErrors}
              errorKey="dni"
            />
            <InputField
              icon="email-outline"
              label="Correo electrónico"
              placeholder="ejemplo@escuela.edu"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              errors={errors}
              setErrors={setErrors}
              errorKey="email"
            />
            <PasswordField
              label="Nueva contraseña (opcional)"
              placeholder="Dejar en blanco para no cambiarla"
              value={password}
              onChangeText={setPassword}
              showPassword={showPassword}
              onToggleShow={() => setShowPassword((v) => !v)}
              errors={errors}
              setErrors={setErrors}
              errorKey="password"
            />

            {/* Datos académicos según rol */}
            {esAlumnoOCurso && (
              <View>
                {sectionLabel(role === 'preceptor' ? 'CURSO A CARGO' : 'DATOS ACADÉMICOS')}
                <SelectChips
                  label="Curso"
                  options={CURSOS}
                  value={curso}
                  onSelect={setCurso}
                  errors={errors}
                  setErrors={setErrors}
                  errorKey="curso"
                />
                <SelectChips
                  label="División"
                  options={divisionesDe(curso)}
                  value={division}
                  onSelect={setDivision}
                  errors={errors}
                  setErrors={setErrors}
                  errorKey="division"
                />
              </View>
            )}

            {esDocente && (
              <View>
                {sectionLabel('DATOS DOCENTE')}
                <MultiChips
                  label="Años que dictás (podés elegir varios)"
                  options={CURSOS}
                  value={aniosDoc}
                  onToggle={toggleAnioDoc}
                  errors={errors}
                  setErrors={setErrors}
                  errorKey="aniosDoc"
                />
                {aniosOrdenados.map((anio) => (
                  <MultiChips
                    key={`div-${anio}`}
                    label={`Divisiones del ${anio} (las que existen)`}
                    options={divisionesDe(anio)}
                    value={divSel[anio] || []}
                    onToggle={(div) => toggleDivisionDoc(anio, div)}
                    errors={errors}
                    setErrors={setErrors}
                    errorKey={`div_${anio}`}
                  />
                ))}
                {cursosDoc.map((c) => (
                  <MultiChips
                    key={c.etiqueta}
                    label={`Materias del ${c.etiqueta}`}
                    options={materiasDe(c.anio, c.div)}
                    value={materiasPorCurso[c.etiqueta] || []}
                    onToggle={(materia) => toggleMateriaDoc(c.etiqueta, materia)}
                    errors={errors}
                    setErrors={setErrors}
                    errorKey={`materias_${c.etiqueta}`}
                  />
                ))}
                <InputField
                  icon="certificate"
                  label="Título profesional"
                  placeholder="Ej: Prof. de Matemática"
                  value={titulo}
                  onChangeText={setTitulo}
                  errors={errors}
                  setErrors={setErrors}
                  errorKey="titulo"
                />
              </View>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSave}
            style={[st.saveBtn, { backgroundColor: colors.primary }]}
          >
            <MaterialCommunityIcons
              name="content-save-outline"
              size={19}
              color={colors.onPrimary || '#0B1628'}
            />
            <Text style={[st.saveText, { color: colors.onPrimary || '#0B1628' }]}>
              Guardar cambios
            </Text>
          </TouchableOpacity>

          {status && (
            <View style={st.statusRow}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={15}
                color={colors.error}
              />
              <Text style={[st.statusText, { color: colors.error }]}>{status.texto}</Text>
            </View>
          )}

          <Text style={[st.hint, { color: colors.textSecondary }]}>
            {esDocente
              ? 'Tus materias definen qué notas e informes podés cargar en el Boletín.'
              : 'Tu curso define las materias que ves en el Boletín.'}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  backButton: { padding: 4, marginRight: 6 },
  topTitle: { fontSize: 17, fontWeight: '700' },
  scroll: { paddingHorizontal: 16, paddingBottom: 36 },
  intro: { fontSize: 12.5, lineHeight: 18, marginBottom: 14 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#5A6B80',
    marginTop: 6,
    marginBottom: 12,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  saveText: { fontSize: 15, fontWeight: '800' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  statusText: { fontSize: 12.5, fontWeight: '600', flex: 1 },
  hint: { fontSize: 12, lineHeight: 17, marginTop: 14 },
});
