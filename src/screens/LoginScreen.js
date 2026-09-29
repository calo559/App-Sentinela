// LoginScreen — acceso al sistema (auth simulado con authService)
import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { login } from "../services/authService";
import { notify } from "../utils/notify";
import AuthBrand from "../components/AuthBrand";
import { InputField, PasswordField } from "../components/FormFields";

const DEMO_ACCOUNTS = [
  { role: "Alumno", email: "alumno@escuela.edu", color: "#00C9DB" },
  { role: "Docente", email: "docente@escuela.edu", color: "#6B3FA0" },
  { role: "Preceptor", email: "preceptor@escuela.edu", color: "#34D399" },
];

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Adaptador para que InputField/PasswordField (que usan un objeto de errores)
  // escriban en los estados simples de esta pantalla.
  const errors = { email: emailError, password: passwordError };
  const setErrors = (fn) => {
    const next = typeof fn === "function" ? fn(errors) : fn;
    setEmailError(next.email || "");
    setPasswordError(next.password || "");
  };

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const float1 = useRef(new Animated.Value(0)).current;
  const float2 = useRef(new Animated.Value(0)).current;
  const float3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, delay: 300, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 6, tension: 50, delay: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 45, delay: 400, useNativeDriver: true }),
    ]).start();

    const makeFloat = (val, dur) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration: dur, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: dur, useNativeDriver: true }),
        ])
      );

    makeFloat(float1, 6000).start();
    makeFloat(float2, 8000).start();
    makeFloat(float3, 7000).start();
  }, []);

  const floatY1 = float1.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const floatY2 = float2.interpolate({ inputRange: [0, 1], outputRange: [0, 25] });
  const floatY3 = float3.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });

  const handleLogin = () => {
    setEmailError("");
    setPasswordError("");

    let hasError = false;
    if (!email.trim()) {
      setEmailError("El correo electrónico es requerido");
      hasError = true;
    } else if (!email.includes("@")) {
      setEmailError("Ingrese un correo electrónico válido");
      hasError = true;
    }
    if (!password) {
      setPasswordError("La contraseña es requerida");
      hasError = true;
    }
    if (hasError) return;

    Animated.sequence([
      Animated.spring(buttonScale, { toValue: 0.96, friction: 3, tension: 40, useNativeDriver: true }),
      Animated.spring(buttonScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();

    setLoading(true);

    try {
      login(email.trim(), password);
      navigation.replace("Home");
    } catch (err) {
      notify("No se pudo iniciar sesión", err.message);
      setLoading(false);
    }
    // Si el login fue exitoso la pantalla se desmonta: no tocar el estado después.
  };

  const handleForgotPassword = () => {
    notify(
      "Recuperar contraseña",
      "Te enviaremos un enlace de recuperación a tu correo electrónico registrado."
    );
  };

  return (
    <LinearGradient
      colors={["#00C9DB", "#0B1628", "#6B3FA0"]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Formas de fondo sutiles */}
      <Animated.View style={[styles.floatShape1, { transform: [{ translateY: floatY1 }] }]} />
      <Animated.View style={[styles.floatShape2, { transform: [{ translateY: floatY2 }] }]} />
      <Animated.View style={[styles.floatShape3, { transform: [{ translateY: floatY3 }] }]} />

      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Marca */}
          <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
            <AuthBrand />
          </Animated.View>

          {/* Tarjeta de acceso */}
          <Animated.View
            style={[
              styles.card,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
            ]}
          >
            <Text style={styles.cardTitle}>Iniciar sesión</Text>
            <Text style={styles.cardSubtitle}>Accedé con tu cuenta institucional</Text>

            <InputField
              icon="email-outline"
              label="Correo electrónico"
              placeholder="usuario@institucion.edu"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                setEmailError("");
              }}
              errorKey="email"
              errors={errors}
              setErrors={setErrors}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <PasswordField
              label="Contraseña"
              placeholder="Ingresá tu contraseña"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                setPasswordError("");
              }}
              errorKey="password"
              errors={errors}
              setErrors={setErrors}
              showPassword={showPassword}
              onToggleShow={() => setShowPassword((v) => !v)}
            />

            {/* Recordarme / recuperar */}
            <View style={styles.optionsRow}>
              <TouchableOpacity style={styles.remember} onPress={() => setRememberMe(!rememberMe)}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe && <MaterialCommunityIcons name="check" size={13} color="#0B1628" />}
                </View>
                <Text style={styles.rememberText}>Recordarme</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleForgotPassword} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </View>

            {/* Botón */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#0B1628" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Ingresar</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color="#0B1628" />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Ir al registro */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>¿No tenés una cuenta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.footerLink}>Solicitar acceso</Text>
              </TouchableOpacity>
            </View>

            {/* Cuentas demo */}
            <View style={styles.demoBox}>
              <View style={styles.demoHeader}>
                <MaterialCommunityIcons name="key-variant" size={13} color="#5A6B80" />
                <Text style={styles.demoTitle}>CUENTAS DE DEMOSTRACIÓN</Text>
              </View>
              {DEMO_ACCOUNTS.map((acc, idx) => (
                <View
                  key={acc.email}
                  style={[styles.demoRow, idx < DEMO_ACCOUNTS.length - 1 && styles.demoRowBorder]}
                >
                  <View style={[styles.demoDot, { backgroundColor: acc.color }]} />
                  <Text style={styles.demoRole}>{acc.role}</Text>
                  <Text style={styles.demoEmail} numberOfLines={1}>{acc.email}</Text>
                  <Text style={styles.demoPass}>123456</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 52,
    paddingBottom: 40,
  },

  // Formas de fondo
  floatShape1: {
    position: "absolute", width: 220, height: 220, borderRadius: 110,
    backgroundColor: "rgba(0,201,219,0.10)", top: "8%", left: -60,
  },
  floatShape2: {
    position: "absolute", width: 170, height: 170, borderRadius: 85,
    backgroundColor: "rgba(107,63,160,0.16)", bottom: "12%", right: -45,
  },
  floatShape3: {
    position: "absolute", width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)", top: "42%", right: "16%",
  },

  // Tarjeta
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  cardTitle: { fontSize: 26, fontWeight: "800", color: "#0B1628", marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: "#5A6B80", marginBottom: 22 },

  // Opciones
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 20,
  },
  remember: { flexDirection: "row", alignItems: "center" },
  checkbox: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 2, borderColor: "#00C9DB",
    alignItems: "center", justifyContent: "center",
    marginRight: 8, backgroundColor: "#FFFFFF",
  },
  checkboxChecked: { backgroundColor: "#00C9DB" },
  rememberText: { fontSize: 13, color: "#5A6B80", fontWeight: "600" },
  link: { fontSize: 13, color: "#6B3FA0", fontWeight: "700" },

  // Botón principal
  primaryButton: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00C9DB",
    borderRadius: 14,
    height: 52,
    shadowColor: "#00C9DB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: { fontSize: 16, fontWeight: "800", color: "#0B1628", letterSpacing: 0.3 },

  // Footer
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
    marginBottom: 20,
  },
  footerText: { fontSize: 13, color: "#5A6B80" },
  footerLink: { fontSize: 13, color: "#6B3FA0", fontWeight: "800" },

  // Cuentas demo
  demoBox: {
    backgroundColor: "#F4F7FB",
    borderWidth: 1,
    borderColor: "#E4EAF3",
    borderRadius: 14,
    padding: 12,
  },
  demoHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  demoTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#5A6B80",
    letterSpacing: 1,
  },
  demoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
  },
  demoRowBorder: { borderBottomWidth: 1, borderBottomColor: "#E9EEF6" },
  demoDot: { width: 7, height: 7, borderRadius: 4, marginRight: 8 },
  demoRole: { fontSize: 11, fontWeight: "800", color: "#0B1628", width: 70 },
  demoEmail: { flex: 1, fontSize: 11, color: "#5A6B80" },
  demoPass: {
    fontSize: 11,
    color: "#5A6B80",
    backgroundColor: "#E9EEF6",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
    marginLeft: 6,
  },
});
