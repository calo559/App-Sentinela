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
import { InputField, PasswordField } from '../components/FormFields';

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
    desc: 'Registro mi asistencia escaneando el QR de mi curso',
    icon: 'school-outline',
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

  const seleccionarRol = (clave) => {
    setRol(clave);
    setErrores((prev) => ({ ...prev, rol: '' }));
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
