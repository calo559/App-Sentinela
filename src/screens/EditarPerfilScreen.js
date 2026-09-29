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
import { materiasDelAnio } from '../utils/malla';

const CURSOS = ['1°', '2°', '3°', '4°', '5°', '6°', '7°'];
const DIVISIONES = ['1', '2', '3', '4', '5'];

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
  const [anioDoc, setAnioDoc] = useState(active.anio ? `${active.anio}°` : '');
  const [materiasSel, setMateriasSel] = useState(active.materias || []);
  const [titulo, setTitulo] = useState(active.titulo || '');

  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null); // { tipo: 'error', texto }

  const toggleMateria = (m) =>
    setMateriasSel((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const validate = () => {
    const e = {};
    if (!nombre.trim()) e.nombre = 'El nombre es requerido';
    if (!apellido.trim()) e.apellido = 'El apellido es requerido';
    if (!dni.trim() || dni.length < 7) e.dni = 'Ingresá un DNI válido';
    if (!email.trim() || !email.includes('@')) e.email = 'Ingresá un correo válido';
    if (password && password.length < 6) e.password = 'Mínimo 6 caracteres';

    if (esDocente) {
      if (!anioDoc) e.anioDoc = 'Seleccioná el año que dictás';
      if (materiasSel.length === 0) e.materiasSel = 'Elegí al menos una materia';
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
        patch.anio = anioDoc.replace(/[^\d]/g, '');
        patch.materias = materiasSel;
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
                  options={DIVISIONES}
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
                <SelectChips
                  label="Año que dictás"
                  options={CURSOS}
                  value={anioDoc}
                  onSelect={(v) => {
                    setAnioDoc(v);
                    setMateriasSel([]); // las materias dependen del año
                  }}
                  errors={errors}
                  setErrors={setErrors}
                  errorKey="anioDoc"
                />
                <MultiChips
                  label="Materias que dictás (podés elegir varias)"
                  options={materiasDelAnio(anioDoc)}
                  value={materiasSel}
                  onToggle={toggleMateria}
                  errors={errors}
                  setErrors={setErrors}
                  errorKey="materiasSel"
                />
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
