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
import { users } from '../services/firestore';
import { notify } from '../utils/notify';
import { SCREENS } from '../utils/constants';
import AuthBrand from '../components/AuthBrand';
import { InputField, PasswordField } from '../components/FormFields';

const ERRORES = {
  'auth/invalid-credential': 'El correo o la contraseña son incorrectos.',
  'auth/wrong-password': 'La contraseña es incorrecta.',
  'auth/user-not-found': 'No existe una cuenta con ese correo electrónico.',
  'auth/invalid-email': 'El correo electrónico no es válido.',
  'auth/missing-password': 'Ingresá tu contraseña.',
  'auth/user-disabled': 'La cuenta está deshabilitada. Contactá a la administración de la escuela.',
  'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.',
  'auth/network-request-failed': 'Sin conexión a internet. Revisá tu red e intentá de nuevo.',
  'auth/operation-not-allowed': 'El acceso con correo y contraseña no está habilitado.',
};

const mensajeError = (error) => ERRORES[error?.code] ?? 'No se pudo iniciar sesión. Intentá de nuevo.';

export default function LoginScreen({ navigation }) {
  const { entrar } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviandoEnlace, setEnviandoEnlace] = useState(false);
  const [errores, setErrores] = useState({});
  const navegando = useRef(false);

  const s = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.primaryDark },
        container: { flex: 1 },
        keyboardView: { flex: 1 },
        scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 36 },
        shape1: {
          position: 'absolute',
          width: 220,
          height: 220,
          borderRadius: 110,
          backgroundColor: `${colors.white}14`,
          top: '6%',
          left: -60,
        },
        shape2: {
          position: 'absolute',
          width: 170,
          height: 170,
          borderRadius: 85,
          backgroundColor: `${colors.secondary}1F`,
          bottom: '10%',
          right: -45,
        },
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
        forgotRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: -6, marginBottom: 18 },
        forgotText: { fontSize: 13, color: colors.primary, fontWeight: '700' },
        submit: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: colors.primary,
          borderRadius: 14,
          height: 52,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 5,
        },
        submitDisabled: { opacity: 0.7 },
        submitText: { fontSize: 16, fontWeight: '800', color: colors.onPrimary, letterSpacing: 0.3 },
        footer: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 6,
          marginTop: 18,
        },
        footerText: { fontSize: 13, color: colors.textSecondary },
        footerLink: { fontSize: 13, color: colors.primary, fontWeight: '800' },
        note: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          marginTop: 18,
          paddingHorizontal: 4,
        },
        noteText: { flex: 1, fontSize: 11.5, color: colors.textSecondary },
      }),
    [colors]
  );

  const validar = () => {
    const err = {};
    const correo = email.trim();
    if (!correo) err.email = 'El correo electrónico es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) err.email = 'Ingresá un correo electrónico válido';
    if (!password) err.password = 'La contraseña es requerida';
    return err;
  };

  const handleLogin = async () => {
    if (enviando) return;
    const err = validar();
    setErrores(err);
    if (Object.keys(err).length) return;

    setEnviando(true);
    try {
      await entrar(email.trim(), password);
    } catch (error) {
      setEnviando(false);
      notify('No se pudo iniciar sesión', mensajeError(error));
    }
  };

  const handleRecuperar = async () => {
    if (enviandoEnlace) return;
    const correo = email.trim();
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      notify('Recuperar contraseña', 'Ingresá tu correo electrónico para enviarte el enlace de recuperación.');
      return;
    }

    setEnviandoEnlace(true);
    try {
      await users.recuperarPassword(correo);
      notify('Enlace enviado', `Si existe una cuenta con ${correo}, te enviamos un correo para restablecer tu contraseña.`);
    } catch (error) {
      if (error?.code === 'auth/user-not-found') {
        notify('Recuperar contraseña', 'No existe una cuenta con ese correo electrónico.');
      } else {
        notify('No se pudo enviar el enlace', mensajeError(error));
      }
    } finally {
      setEnviandoEnlace(false);
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
        <View style={s.shape1} />
        <View style={s.shape2} />

        <KeyboardAvoidingView style={s.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <AuthBrand />

            <View style={s.card}>
              <Text style={s.cardTitle}>Iniciar sesión</Text>
              <Text style={s.cardSubtitle}>Ingresá con tu cuenta institucional</Text>

              <InputField
                icon="email-outline"
                label="Correo electrónico"
                placeholder="usuario@escuela.edu"
                value={email}
                onChangeText={(texto) => {
                  setEmail(texto);
                  setErrores((prev) => ({ ...prev, email: '' }));
                }}
                error={errores.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
              />

              <PasswordField
                label="Contraseña"
                placeholder="Ingresá tu contraseña"
                value={password}
                onChangeText={(texto) => {
                  setPassword(texto);
                  setErrores((prev) => ({ ...prev, password: '' }));
                }}
                error={errores.password}
                returnKeyType="go"
                onSubmitEditing={handleLogin}
              />

              <View style={s.forgotRow}>
                <TouchableOpacity
                  onPress={handleRecuperar}
                  disabled={enviandoEnlace}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={s.forgotText}>
                    {enviandoEnlace ? 'Enviando enlace...' : '¿Olvidaste tu contraseña?'}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[s.submit, enviando && s.submitDisabled]}
                onPress={handleLogin}
                disabled={enviando || enviandoEnlace}
              >
                {enviando ? (
                  <ActivityIndicator color={colors.onPrimary} size="small" />
                ) : (
                  <>
                    <Text style={s.submitText}>Ingresar</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color={colors.onPrimary} />
                  </>
                )}
              </TouchableOpacity>

              <View style={s.footer}>
                <Text style={s.footerText}>¿No tenés una cuenta?</Text>
                <TouchableOpacity onPress={() => navigation.navigate(SCREENS.REGISTER)}>
                  <Text style={s.footerLink}>Crear cuenta</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={s.note}>
              <MaterialCommunityIcons name="shield-lock-outline" size={16} color={colors.white} />
              <Text style={s.noteText}>
                Tu sesión se inicia de forma segura con Firebase Authentication. Si tenés problemas para acceder,
                comunicate con la administración de la escuela.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}
