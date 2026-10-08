import { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ROLES } from '../services/firestore';
import { notify } from '../utils/notify';
import { SCREENS } from '../utils/constants';
import AuthBrand from '../components/AuthBrand';
import { InputField, PasswordField, SelectChips, MultiChips } from '../components/FormFields';
import {
  ANIOS_ESCOLARES,
  ANIOS_OPCIONES,
  CURSOS_OPCIONES,
  MATERIAS_ESCOLARES,
  divisionesDe,
  divisionesOpciones,
  etiquetaCursoId,
} from '../utils/colegio';

const ERRORES = {
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo electrónico.',
  'auth/invalid-email': 'El correo electrónico no es válido.',
  'auth/weak-password': 'La contraseña es demasiado débil. Usá al menos 6 caracteres.',
  'auth/operation-not-allowed': 'El acceso con correo y contraseña no está habilitado.',
  'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.',
  'auth/network-request-failed': 'Sin conexión a internet. Revisá tu red e intentá de nuevo.',
};

const mensajeError = (error) => ERRORES[error?.code] ?? 'No se pudo crear la cuenta. Intentá de nuevo.';

const ROLES_DISPONIBLES = [
  {
    key: ROLES.ALUMNO,
    label: 'Alumno',
    desc: 'Escaneo el QR de mi curso para registrar mi asistencia',
    icon: 'school-outline',
  },
  {
    key: ROLES.PROFESOR,
    label: 'Docente',
    desc: 'Cargo las notas y los informes de mis materias',
    icon: 'account-tie-outline',
  },
  {
    key: ROLES.PRECEPTOR,
    label: 'Preceptor',
    desc: 'Sigo la asistencia del curso que tengo a cargo',
    icon: 'clipboard-account-outline',
  },
  {
    key: ROLES.PADRE,
    label: 'Padre/Madre',
    desc: 'Sigo la asistencia de mi hijo o hija',
    icon: 'account-supervisor-outline',
  },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DNI_RE = /^\d{7,10}$/;

export default function RegisterScreen({ navigation }) {
  const { registrar } = useAuth();
  const { colors } = useTheme();

  const [rol, setRol] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [dni, setDni] = useState('');
  const [dniHijo, setDniHijo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  // Datos por rol: el alumno elige año + división (su curso queda "4°2"); el
  // docente declara años → divisiones → materias por curso; el preceptor
  // declara sus cursos a cargo.
  const [anioAlumno, setAnioAlumno] = useState('');
  const [divAlumno, setDivAlumno] = useState('');
  const [aniosDoc, setAniosDoc] = useState([]); // ['4', '5']
  const [divSel, setDivSel] = useState({}); // { '4': ['1', '2'] }
  const [materiasPorCurso, setMateriasPorCurso] = useState({}); // { '4°2': ['PROG'] }
  const [cursosPrecep, setCursosPrecep] = useState([]); // ['4°2']
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const navegando = useRef(false);

  const s = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.primaryDark },
        container: { flex: 1 },
        keyboardView: { flex: 1 },
        scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 36 },
        card: {
          backgroundColor: colors.surface,
          borderRadius: 24,
          padding: 22,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.28,
          shadowRadius: 20,
          elevation: 15,
        },
        cardTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 4 },
        cardSubtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: 20 },
        section: { fontSize: 11, fontWeight: '800', color: colors.textSecondary, letterSpacing: 1, marginBottom: 10, marginLeft: 2 },
        sectionBlock: { marginTop: 10 },
        rolError: { fontSize: 12, color: colors.error, marginBottom: 10, marginLeft: 2 },
        roleOption: {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 12,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: colors.surfaceVariant,
          marginBottom: 10,
        },
        roleOptionActive: { borderColor: colors.primary, backgroundColor: colors.surface },
        roleIconBox: {
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        },
        roleTexts: { flex: 1 },
        roleLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
        roleDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
        submit: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: colors.primary,
          borderRadius: 14,
          height: 52,
          marginTop: 20,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 5,
        },
        submitDisabled: { opacity: 0.7 },
        submitText: { fontSize: 16, fontWeight: '800', color: colors.onPrimary, letterSpacing: 0.3 },
        footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 18 },
        footerText: { fontSize: 13, color: colors.textSecondary },
        footerLink: { fontSize: 13, color: colors.primary, fontWeight: '800' },
      }),
    [colors]
  );

  // Curso final del alumno: año + división → "4°2" (id real de `cursos/`).
  const cursoAlumno = anioAlumno && divAlumno ? `${anioAlumno}°${divAlumno}` : '';

  // Cursos elegidos por el docente: combinación año + división ("4" + "2" →
  // "4°2"), en orden de la escuela (1°→7°, división ascendente). Los ids son
  // los reales de la colección `cursos` (la regla de alumnos exige que
  // existan y las declaraciones se confirman contra `materias/{mat_<curso>_<codigo>}`).
  const cursosDoc = ANIOS_ESCOLARES.filter((anio) => aniosDoc.includes(anio)).flatMap((anio) =>
    divisionesDe(anio)
      .filter((div) => (divSel[anio] || []).includes(div))
      .map((div) => ({ id: `${anio}°${div}`, anio, div }))
  );

  const seleccionarRol = (clave) => {
    setRol(clave);
    setErrores((prev) => ({ ...prev, rol: '' }));
  };

  const toggleAnio = (anio) => {
    setAniosDoc((prev) => (prev.includes(anio) ? prev.filter((x) => x !== anio) : [...prev, anio]));
    limpiarError('aniosDoc');
  };

  const toggleDiv = (anio, div) => {
    setDivSel((prev) => {
      const actual = prev[anio] || [];
      const siguiente = actual.includes(div) ? actual.filter((x) => x !== div) : [...actual, div];
      return { ...prev, [anio]: siguiente };
    });
    limpiarError(`div_${anio}`);
  };

  const toggleMateria = (cursoId, codigo) => {
    setMateriasPorCurso((prev) => {
      const actual = prev[cursoId] || [];
      const siguiente = actual.includes(codigo)
        ? actual.filter((x) => x !== codigo)
        : [...actual, codigo];
      return { ...prev, [cursoId]: siguiente };
    });
    limpiarError(`materias_${cursoId}`);
  };

  const toggleCursoPrecep = (cursoId) => {
    setCursosPrecep((prev) =>
      prev.includes(cursoId) ? prev.filter((x) => x !== cursoId) : [...prev, cursoId]
    );
    limpiarError('cursosPrecep');
  };

  const limpiarError = (campo) => setErrores((prev) => ({ ...prev, [campo]: '' }));

  const validar = () => {
    const err = {};
    if (!rol) err.rol = 'Seleccioná un rol';
    if (!nombre.trim()) err.nombre = 'El nombre es requerido';
    if (!apellido.trim()) err.apellido = 'El apellido es requerido';
    if (!dni.trim()) err.dni = 'El DNI es requerido';
    else if (!DNI_RE.test(dni.trim())) err.dni = 'Ingresá un DNI válido (entre 7 y 10 dígitos)';
    if (!email.trim()) err.email = 'El correo electrónico es requerido';
    else if (!EMAIL_RE.test(email.trim())) err.email = 'Ingresá un correo electrónico válido';
    if (!password) err.password = 'La contraseña es requerida';
    else if (password.length < 6) err.password = 'La contraseña debe tener al menos 6 caracteres';
    if (!confirmar) err.confirmar = 'Confirmá la contraseña';
    else if (confirmar !== password) err.confirmar = 'Las contraseñas no coinciden';

    if (rol === ROLES.ALUMNO) {
      if (!anioAlumno) err.anioAlumno = 'Seleccioná tu año';
      else if (!divAlumno) err.divAlumno = 'Seleccioná tu división';
    }
    if (rol === ROLES.PROFESOR) {
      if (!aniosDoc.length) err.aniosDoc = 'Seleccioná al menos un año que dictés';
      else
        aniosDoc.forEach((anio) => {
          if (!(divSel[anio] || []).length) err[`div_${anio}`] = `Elegí la división del ${anio}°`;
        });
      cursosDoc.forEach((curso) => {
        if (!(materiasPorCurso[curso.id] || []).length)
          err[`materias_${curso.id}`] = 'Elegí al menos una materia en este curso';
      });
    }
    if (rol === ROLES.PRECEPTOR && !cursosPrecep.length) {
      err.cursosPrecep = 'Seleccioná al menos un curso a cargo';
    }

    return err;
  };

  const handleRegister = async () => {
    if (enviando) return;
    const err = validar();
    setErrores(err);
    if (Object.keys(err).length) {
      notify('Revisá los datos', 'Hay campos obligatorios sin completar o con errores.');
      return;
    }

    const datos = {
      email: email.trim(),
      password,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      dni: dni.trim(),
      telefono: telefono.trim(),
      rol,
      dniHijo: rol === ROLES.PADRE ? dniHijo.trim() : '',
      // Alumno: su curso (existe en `cursos/`, lo exige la regla).
      ...(rol === ROLES.ALUMNO ? { cursoId: cursoAlumno } : {}),
      // Docente: declaracion de cursos + materias por curso (la confirma la
      // institución en materias.docenteId — no da permiso por sí sola).
      ...(rol === ROLES.PROFESOR
        ? {
            cursosDeclarados: cursosDoc.map((curso) => curso.id),
            materiasDeclaradas: cursosDoc.map((curso) => ({
              cursoId: curso.id,
              materias: materiasPorCurso[curso.id] || [],
            })),
          }
        : {}),
      // Preceptor: declaracion de cursos a cargo (la confirma la institución
      // en cursos.preceptorIds).
      ...(rol === ROLES.PRECEPTOR ? { cursosDeclarados: cursosPrecep } : {}),
    };

    setEnviando(true);
    try {
      await registrar(datos);
    } catch (error) {
      setEnviando(false);
      notify('No se pudo crear la cuenta', mensajeError(error));
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <LinearGradient
        colors={[colors.gradientStart, colors.primaryDark, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.container}
      >
        <KeyboardAvoidingView style={s.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <AuthBrand />

            <View style={s.card}>
              <Text style={s.cardTitle}>Crear cuenta</Text>
              <Text style={s.cardSubtitle}>Completá tus datos para registrarte en el sistema</Text>

              <Text style={s.section}>¿QUÉ SOY?</Text>
              {ROLES_DISPONIBLES.map((item) => {
                const activo = rol === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.8}
                    onPress={() => seleccionarRol(item.key)}
                    style={[s.roleOption, activo && s.roleOptionActive]}
                  >
                    <View style={s.roleIconBox}>
                      <MaterialCommunityIcons
                        name={item.icon}
                        size={20}
                        color={activo ? colors.primary : colors.textSecondary}
                      />
                    </View>
                    <View style={s.roleTexts}>
                      <Text style={s.roleLabel}>{item.label}</Text>
                      <Text style={s.roleDesc}>{item.desc}</Text>
                    </View>
                    <MaterialCommunityIcons
                      name={activo ? 'check-circle' : 'circle-outline'}
                      size={20}
                      color={activo ? colors.primary : colors.border}
                    />
                  </TouchableOpacity>
                );
              })}
              {errores.rol ? <Text style={s.rolError}>{errores.rol}</Text> : null}

              {rol === ROLES.ALUMNO ? (
                <View style={s.sectionBlock}>
                  <Text style={s.section}>DATOS ACADÉMICOS</Text>
                  <SelectChips
                    label="MI AÑO"
                    options={ANIOS_OPCIONES}
                    value={anioAlumno}
                    onSelect={(id) => {
                      setAnioAlumno(id);
                      setDivAlumno('');
                      limpiarError('anioAlumno');
                      limpiarError('divAlumno');
                    }}
                    error={errores.anioAlumno}
                  />
                  <SelectChips
                    label="MI DIVISIÓN"
                    options={anioAlumno ? divisionesOpciones(anioAlumno) : []}
                    value={divAlumno}
                    onSelect={(id) => {
                      setDivAlumno(id);
                      limpiarError('divAlumno');
                    }}
                    error={errores.divAlumno}
                    hint={
                      anioAlumno
                        ? 'Se usa para escanear el QR de tu curso'
                        : 'Elegí primero tu año'
                    }
                    emptyText="Elegí primero tu año"
                  />
                </View>
              ) : null}

              {rol === ROLES.PROFESOR ? (
                <View style={s.sectionBlock}>
                  <Text style={s.section}>DATOS DOCENTE</Text>
                  <MultiChips
                    label="AÑOS QUE DICTO"
                    options={ANIOS_OPCIONES}
                    values={aniosDoc}
                    onToggle={toggleAnio}
                    error={errores.aniosDoc}
                  />
                  {aniosDoc.map((anio) => (
                    <MultiChips
                      key={`div-${anio}`}
                      label={`DIVISIONES DEL ${anio}°`}
                      options={divisionesOpciones(anio)}
                      values={divSel[anio] || []}
                      onToggle={(div) => toggleDiv(anio, div)}
                      error={errores[`div_${anio}`]}
                    />
                  ))}
                  {cursosDoc.map((curso) => (
                    <MultiChips
                      key={`mat-${curso.id}`}
                      label={`MATERIAS EN ${etiquetaCursoId(curso.id)}`}
                      options={MATERIAS_ESCOLARES}
                      values={materiasPorCurso[curso.id] || []}
                      onToggle={(codigo) => toggleMateria(curso.id, codigo)}
                      error={errores[`materias_${curso.id}`]}
                    />
                  ))}
                  <Text style={[s.roleDesc, { marginTop: 4 }]}>
                    Las materias quedan pendientes de aprobación de la institución: hasta que
                    un administrador las asigne no vas a poder cargar notas.
                  </Text>
                </View>
              ) : null}

              {rol === ROLES.PRECEPTOR ? (
                <View style={s.sectionBlock}>
                  <Text style={s.section}>CURSOS A CARGO</Text>
                  <MultiChips
                    label="CURSOS QUE SIGO"
                    options={CURSOS_OPCIONES}
                    values={cursosPrecep}
                    onToggle={toggleCursoPrecep}
                    error={errores.cursosPrecep}
                    hint="La institución confirma tu asignación"
                  />
                </View>
              ) : null}

              <View style={s.sectionBlock}>
                <Text style={s.section}>DATOS PERSONALES</Text>

                <InputField
                  icon="account-outline"
                  label="Nombre"
                  placeholder="Ej: Ana"
                  value={nombre}
                  onChangeText={(texto) => {
                    setNombre(texto);
                    limpiarError('nombre');
                  }}
                  error={errores.nombre}
                  autoCapitalize="words"
                />

                <InputField
                  icon="account-outline"
                  label="Apellido"
                  placeholder="Ej: Alumna"
                  value={apellido}
                  onChangeText={(texto) => {
                    setApellido(texto);
                    limpiarError('apellido');
                  }}
                  error={errores.apellido}
                  autoCapitalize="words"
                />

                <InputField
                  icon="card-account-details-outline"
                  label="DNI"
                  placeholder="12345678"
                  value={dni}
                  onChangeText={(texto) => {
                    setDni(texto.replace(/\D/g, '').slice(0, 10));
                    limpiarError('dni');
                  }}
                  error={errores.dni}
                  keyboardType="number-pad"
                  autoCorrect={false}
                />

                {rol === ROLES.PADRE ? (
                  <InputField
                    icon="account-child-outline"
                    label="DNI del hijo/a (opcional)"
                    placeholder="12345678"
                    value={dniHijo}
                    onChangeText={(texto) => setDniHijo(texto.replace(/\D/g, '').slice(0, 10))}
                    keyboardType="number-pad"
                    autoCorrect={false}
                  />
                ) : null}

                <InputField
                  icon="phone-outline"
                  label="Teléfono (opcional)"
                  placeholder="Ej: +54 9 11 5555 0000"
                  value={telefono}
                  onChangeText={setTelefono}
                  keyboardType="phone-pad"
                />

                <InputField
                  icon="email-outline"
                  label="Correo electrónico"
                  placeholder="usuario@escuela.edu"
                  value={email}
                  onChangeText={(texto) => {
                    setEmail(texto);
                    limpiarError('email');
                  }}
                  error={errores.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                />

                <PasswordField
                  label="Contraseña"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChangeText={(texto) => {
                    setPassword(texto);
                    limpiarError('password');
                  }}
                  error={errores.password}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                />

                <PasswordField
                  label="Confirmar contraseña"
                  placeholder="Repetí la contraseña"
                  value={confirmar}
                  onChangeText={(texto) => {
                    setConfirmar(texto);
                    limpiarError('confirmar');
                  }}
                  error={errores.confirmar}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  returnKeyType="go"
                  onSubmitEditing={handleRegister}
                />
              </View>

              <TouchableOpacity
                style={[s.submit, enviando && s.submitDisabled]}
                onPress={handleRegister}
                disabled={enviando}
              >
                {enviando ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <>
                    <Text style={s.submitText}>Crear cuenta</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color={colors.onPrimary} />
                  </>
                )}
              </TouchableOpacity>

              <View style={s.footer}>
                <Text style={s.footerText}>¿Ya tenés cuenta?</Text>
                <TouchableOpacity onPress={() => navigation.navigate(SCREENS.LOGIN)}>
                  <Text style={s.footerLink}>Iniciar sesión</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}
