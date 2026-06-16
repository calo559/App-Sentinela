import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const ROLES = [
  { key: "alumno", label: "Alumno", icon: "🎒" },
  { key: "docente", label: "Docente", icon: "👨‍🏫" },
  { key: "preceptor", label: "Preceptor", icon: "📋" },
];

const CURSOS = ["1°", "2°", "3°", "4°", "5°", "6°"];
const DIVISIONES = ["1", "2", "3", "4", "5"];

export default function RegisterScreen({ navigation }) {
  const [role, setRole] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Docente
  const [materia, setMateria] = useState("");
  const [titulo, setTitulo] = useState("");

  // Alumno / Preceptor
  const [curso, setCurso] = useState("");
  const [division, setDivision] = useState("");

  // Animations
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

    makeFloat(float1, 3000).start();
    makeFloat(float2, 4000).start();
    makeFloat(float3, 3500).start();
  }, []);

  const floatY1 = float1.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const floatY2 = float2.interpolate({ inputRange: [0, 1], outputRange: [0, 25] });
  const floatY3 = float3.interpolate({ inputRange: [0, 1], outputRange: [0, -15] });

  const validate = () => {
    const e = {};
    if (!role) e.role = "Seleccioná un rol";
    if (!nombre.trim()) e.nombre = "El nombre es requerido";
    if (!apellido.trim()) e.apellido = "El apellido es requerido";
    if (!dni.trim() || dni.length < 7) e.dni = "Ingresá un DNI válido";
    if (!email.trim() || !email.includes("@")) e.email = "Ingresá un correo válido";
    if (!password || password.length < 6) e.password = "La contraseña debe tener al menos 6 caracteres";
    if (role === "docente") {
      if (!materia.trim()) e.materia = "La materia es requerida";
      if (!titulo.trim()) e.titulo = "El título es requerido";
    }
    if (role === "alumno" || role === "preceptor") {
      if (!curso) e.curso = "Seleccioná un curso";
      if (!division) e.division = "Seleccioná una división";
    }
    return e;
  };

  const handleRegister = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});

    Animated.sequence([
      Animated.spring(buttonScale, { toValue: 0.95, friction: 3, tension: 40, useNativeDriver: true }),
      Animated.spring(buttonScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const data = {
        role, nombre, apellido, dni, email, password,
        ...(role === "docente" ? { materia, titulo } : { curso, division }),
      };
      if (role === "alumno") navigation.replace("PerfilAlumno", data);
      else if (role === "docente") navigation.replace("PerfilDocente", data);
      else if (role === "preceptor") navigation.replace("PerfilPreceptor", data);
    }, 1200);
  };

  const InputField = ({ icon, label, value, onChangeText, errorKey, ...props }) => (
    <View style={styles.inputGroup}>
      <View style={styles.inputIconContainer}>
        <Text style={styles.inputIcon}>{icon}</Text>
      </View>
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
          style={[styles.input, errors[errorKey] && styles.inputError]}
          placeholderTextColor="rgba(0,0,0,0.3)"
          value={value}
          onChangeText={(t) => { onChangeText(t); setErrors((prev) => ({ ...prev, [errorKey]: "" })); }}
          {...props}
        />
        {errors[errorKey] ? <Text style={styles.errorText}>{errors[errorKey]}</Text> : null}
      </View>
    </View>
  );

  const SelectRow = ({ label, options, value, onSelect, errorKey, display }) => (
    <View style={styles.inputGroup}>
      <View style={styles.inputIconContainer}>
        <Text style={styles.inputIcon}>📋</Text>
      </View>
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={styles.selectRow}>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => { onSelect(opt); setErrors((prev) => ({ ...prev, [errorKey]: "" })); }}
              style={[styles.selectChip, value === opt && styles.selectChipActive]}
            >
              <Text style={[styles.selectChipText, value === opt && styles.selectChipTextActive]}>
                {display ? display(opt) : opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors[errorKey] ? <Text style={styles.errorText}>{errors[errorKey]}</Text> : null}
      </View>
    </View>
  );

  return (
    <LinearGradient colors={["#1B5E20", "#2E7D32", "#388E3C"]} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <Animated.View style={[styles.floatingShape1, { transform: [{ translateY: floatY1 }] }]} />
      <Animated.View style={[styles.floatingShape2, { transform: [{ translateY: floatY2 }] }]} />
      <Animated.View style={[styles.floatingShape3, { transform: [{ translateY: floatY3 }] }]} />

      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Logo */}
          <Animated.View style={[styles.logoContainer, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>🎓</Text>
            </View>
            <Text style={styles.schoolName}>ESCUELA DE EDUCACIÓN{"\n"}SECUNDARIA TÉCNICA Nº 3</Text>
            <Text style={styles.schoolSubtitle}>"S.A. de Padrón"</Text>
          </Animated.View>

          {/* Form */}
          <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
            <Text style={styles.welcomeText}>Crear Cuenta</Text>
            <Text style={styles.welcomeSubtext}>Completá tus datos para registrarte</Text>

            {/* Selector de rol */}
            <Text style={styles.sectionLabel}>SOY</Text>
            <View style={styles.roleRow}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.key}
                  onPress={() => { setRole(r.key); setErrors((prev) => ({ ...prev, role: "" })); }}
                  style={[styles.roleChip, role === r.key && styles.roleChipActive]}
                >
                  <Text style={styles.roleIcon}>{r.icon}</Text>
                  <Text style={[styles.roleLabel, role === r.key && styles.roleLabelActive]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.role ? <Text style={styles.errorText}>{errors.role}</Text> : null}

            <View style={styles.divider} />

            {/* Campos base */}
            <InputField icon="👤" label="Nombre" value={nombre} onChangeText={setNombre} errorKey="nombre" placeholder="Juan" />
            <InputField icon="👤" label="Apellido" value={apellido} onChangeText={setApellido} errorKey="apellido" placeholder="Pérez" />
            <InputField icon="🪪" label="DNI" value={dni} onChangeText={(t) => setDni(t.replace(/\D/g, "").slice(0, 8))} errorKey="dni" placeholder="12345678" keyboardType="numeric" />
            <InputField icon="📧" label="Correo Electrónico" value={email} onChangeText={setEmail} errorKey="email" placeholder="usuario@institucion.edu" keyboardType="email-address" autoCapitalize="none" />

            {/* Contraseña */}
            <View style={styles.inputGroup}>
              <View style={styles.inputIconContainer}>
                <Text style={styles.inputIcon}>🔒</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Contraseña</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor="rgba(0,0,0,0.3)"
                    value={password}
                    onChangeText={(t) => { setPassword(t); setErrors((prev) => ({ ...prev, password: "" })); }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)}>
                    <Text style={styles.eyeIcon}>{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
                  </TouchableOpacity>
                </View>
                {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
              </View>
            </View>

            {/* Campos según rol */}
            {role === "docente" && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>DATOS DOCENTE</Text>
                <InputField icon="📚" label="Materia" value={materia} onChangeText={setMateria} errorKey="materia" placeholder="Ej: Matemática" />
                <InputField icon="💼" label="Título Profesional" value={titulo} onChangeText={setTitulo} errorKey="titulo" placeholder="Ej: Lic. en Ciencias de la Educación" />
              </>
            )}

            {(role === "alumno" || role === "preceptor") && (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>{role === "preceptor" ? "CURSO A CARGO" : "DATOS ACADÉMICOS"}</Text>
                <SelectRow label="Curso" options={CURSOS} value={curso} onSelect={setCurso} errorKey="curso" display={(o) => `${o} año`} />
                <SelectRow label="División" options={DIVISIONES} value={division} onSelect={setDivision} errorKey="division" />
              </>
            )}

            <View style={styles.divider} />

            {/* Botón */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity style={styles.registerButton} onPress={handleRegister} disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#1B5E20" size="small" />
                  : <Text style={styles.registerButtonText}>Crear Cuenta</Text>
                }
              </TouchableOpacity>
            </Animated.View>

            {/* Volver al login */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>¿Ya tenés cuenta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLink}>Iniciar Sesión</Text>
              </TouchableOpacity>
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
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  floatingShape1: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "rgba(255,215,0,0.1)", top: "10%", left: -50 },
  floatingShape2: { position: "absolute", width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(255,215,0,0.08)", bottom: "15%", right: -30 },
  floatingShape3: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.05)", top: "40%", right: "20%" },
  logoContainer: { alignItems: "center", marginBottom: 40 },
  logoCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,215,0,0.15)", justifyContent: "center", alignItems: "center", marginBottom: 16, borderWidth: 2, borderColor: "rgba(255,215,0,0.3)" },
  logoIcon: { fontSize: 48 },
  schoolName: { fontSize: 20, fontWeight: "800", color: "#FFFFFF", textAlign: "center", marginBottom: 8, textShadowColor: "rgba(0,0,0,0.2)", textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
  schoolSubtitle: { fontSize: 14, color: "rgba(255,215,0,0.9)", fontWeight: "600", textAlign: "center" },
  formContainer: { backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 28, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 15 },
  welcomeText: { fontSize: 28, fontWeight: "800", color: "#1B5E20", marginBottom: 8, textAlign: "center" },
  welcomeSubtext: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#888", marginBottom: 10, letterSpacing: 1 },
  divider: { height: 1, backgroundColor: "#E0E0E0", marginVertical: 16 },
  roleRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  roleChip: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, borderColor: "#E0E0E0", backgroundColor: "#F9F9F9" },
  roleChipActive: { borderColor: "#2E7D32", backgroundColor: "#E8F5E9" },
  roleIcon: { fontSize: 22, marginBottom: 4 },
  roleLabel: { fontSize: 12, fontWeight: "600", color: "#999" },
  roleLabelActive: { color: "#1B5E20" },
  inputGroup: { flexDirection: "row", marginBottom: 16, alignItems: "flex-start" },
  inputIconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center", marginRight: 12 },
  inputIcon: { fontSize: 22 },
  inputWrapper: { flex: 1 },
  inputLabel: { fontSize: 12, fontWeight: "600", color: "#555", marginBottom: 4, marginLeft: 4 },
  input: { backgroundColor: "#F5F5F5", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: "#333", borderWidth: 1, borderColor: "#E0E0E0" },
  inputError: { borderColor: "#D32F2F", borderWidth: 2 },
  passwordWrapper: { position: "relative" },
  passwordInput: { paddingRight: 48 },
  eyeButton: { position: "absolute", right: 12, top: 12 },
  eyeIcon: { fontSize: 20 },
  errorText: { fontSize: 12, color: "#D32F2F", marginTop: 4, marginLeft: 4 },
  selectRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: "#E0E0E0", backgroundColor: "#F9F9F9" },
  selectChipActive: { borderColor: "#2E7D32", backgroundColor: "#E8F5E9" },
  selectChipText: { fontSize: 13, fontWeight: "600", color: "#999" },
  selectChipTextActive: { color: "#1B5E20" },
  registerButton: { backgroundColor: "#FFD700", borderRadius: 16, paddingVertical: 16, alignItems: "center", marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  registerButtonText: { color: "#1B5E20", fontSize: 18, fontWeight: "800" },
  loginContainer: { flexDirection: "row", justifyContent: "center" },
  loginText: { fontSize: 14, color: "#666" },
  loginLink: { fontSize: 14, color: "#2E7D32", fontWeight: "700" },
});
