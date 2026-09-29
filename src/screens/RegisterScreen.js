// RegistroScreen — creación de cuenta (auth simulado con authService)
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
import { register } from "../services/authService";
import { notify } from "../utils/notify";
import AuthBrand from "../components/AuthBrand";
import { InputField, PasswordField, SelectChips, MultiChips } from "../components/FormFields";
import { materiasDelAnio } from "../utils/malla";

const ROLES = [
  {
    key: "alumno",
    label: "Alumno",
    desc: "Escaneo el QR de mi curso para registrar mi asistencia",
    icon: "school",
  },
  {
    key: "docente",
    label: "Docente",
    desc: "Cargo las notas y los informes de mis materias",
    icon: "account-tie",
  },
  {
    key: "preceptor",
    label: "Preceptor",
    desc: "Sigo la asistencia del curso que tengo a cargo",
    icon: "clipboard-account",
  },
];

const CURSOS = ["1°", "2°", "3°", "4°", "5°", "6°", "7°"];
const DIVISIONES = ["1", "2", "3", "4", "5"];

// Opción de rol (nivel de módulo para no remontar el componente en cada render)
function RoleOption({ item, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[r.option, selected && r.optionActive]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[r.iconBox, selected && r.iconBoxActive]}>
        <MaterialCommunityIcons
          name={item.icon}
          size={20}
          color={selected ? "#0B1628" : "#6B7A90"}
        />
      </View>
      <View style={r.texts}>
        <Text style={[r.label, selected && r.labelActive]}>{item.label}</Text>
        <Text style={r.desc}>{item.desc}</Text>
      </View>
      <MaterialCommunityIcons
        name={selected ? "check-circle" : "circle-outline"}
        size={20}
        color={selected ? "#00C9DB" : "#C7D0DC"}
      />
    </TouchableOpacity>
  );
}

const r = StyleSheet.create({
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E4EAF3",
    backgroundColor: "#F8FAFD",
    marginBottom: 10,
  },
  optionActive: {
    borderColor: "#00C9DB",
    backgroundColor: "rgba(0,201,219,0.07)",
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EEF2F8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconBoxActive: { backgroundColor: "rgba(0,201,219,0.22)" },
  texts: { flex: 1 },
  label: { fontSize: 15, fontWeight: "800", color: "#0B1628" },
  labelActive: { color: "#0B1628" },
  desc: { fontSize: 12, color: "#5A6B80", marginTop: 2, lineHeight: 16 },
});

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
  const [anioDoc, setAnioDoc] = useState("");
  const [materiasSel, setMateriasSel] = useState([]);
  const [titulo, setTitulo] = useState("");

  // Alumno / Preceptor
  const [curso, setCurso] = useState("");
  const [division, setDivision] = useState("");

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

    makeFloat(float1, 6500).start();
    makeFloat(float2, 8500).start();
    makeFloat(float3, 7500).start();
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
      if (!anioDoc) e.anioDoc = "Seleccioná el año que dictás";
      if (materiasSel.length === 0) e.materiasSel = "Elegí al menos una materia";
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
      Animated.spring(buttonScale, { toValue: 0.96, friction: 3, tension: 40, useNativeDriver: true }),
      Animated.spring(buttonScale, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
    ]).start();

    setLoading(true);

    try {
      const data = {
        role, nombre, apellido, dni, email, password,
        ...(role === "docente"
          ? { anio: anioDoc.replace(/[^\d]/g, ""), materias: materiasSel, titulo }
          : { curso, division }),
      };
      register(data); // crea la cuenta e inicia sesión (authService)
      navigation.replace("Home"); // entra directo a sus secciones según rol
    } catch (err) {
      notify("No se pudo registrar", err.message);
      setLoading(false);
    }
    // Si el registro fue exitoso la pantalla se desmonta: no tocar el estado después.
  };

  const sectionLabel = (text) => <Text style={styles.sectionLabel}>{text}</Text>;

  const toggleMateria = (m) =>
    setMateriasSel((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  return (
    <LinearGradient colors={["#00C9DB", "#0B1628", "#6B3FA0"]} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
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

          {/* Tarjeta de registro */}
          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
            <Text style={styles.cardTitle}>Crear cuenta</Text>
            <Text style={styles.cardSubtitle}>Completá tus datos para registrarte</Text>

            {/* Rol */}
            {sectionLabel("¿QUÉ SOY?")}
            <View style={{ marginBottom: errors.role ? 4 : 16 }}>
              {ROLES.map((item) => (
                <RoleOption
                  key={item.key}
                  item={item}
                  selected={role === item.key}
                  onPress={() => {
                    setRole(item.key);
                    setErrors((prev) => ({ ...prev, role: "" }));
                  }}
                />
              ))}
            </View>
            {errors.role ? <Text style={styles.errorText}>{errors.role}</Text> : null}

            {/* Datos personales */}
            {sectionLabel("DATOS PERSONALES")}
            <InputField icon="account-outline" label="Nombre" placeholder="Juan" value={nombre} onChangeText={setNombre} errors={errors} setErrors={setErrors} errorKey="nombre" />
            <InputField icon="account-outline" label="Apellido" placeholder="Pérez" value={apellido} onChangeText={setApellido} errors={errors} setErrors={setErrors} errorKey="apellido" />
            <InputField
              icon="card-account-details-outline"
              label="DNI"
              placeholder="12345678"
              value={dni}
              onChangeText={(t) => setDni(t.replace(/\D/g, "").slice(0, 8))}
              errors={errors}
              setErrors={setErrors}
              errorKey="dni"
              keyboardType="numeric"
            />
            <InputField
              icon="email-outline"
              label="Correo electrónico"
              placeholder="usuario@institucion.edu"
              value={email}
              onChangeText={setEmail}
              errors={errors}
              setErrors={setErrors}
              errorKey="email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <PasswordField
              label="Contraseña"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChangeText={setPassword}
              errors={errors}
              setErrors={setErrors}
              errorKey="password"
              showPassword={showPassword}
              onToggleShow={() => setShowPassword((v) => !v)}
            />

            {/* Campos según rol */}
            {role === "docente" && (
              <View style={styles.sectionBlock}>
                {sectionLabel("DATOS DOCENTE")}
                <SelectChips
                  label="Año que dictás"
                  options={CURSOS}
                  value={anioDoc}
                  onSelect={(v) => {
                    setAnioDoc(v);
                    setMateriasSel([]); // las materias cambian con el año
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
                <InputField icon="certificate" label="Título profesional" placeholder="Ej: Prof. de Matemática" value={titulo} onChangeText={setTitulo} errors={errors} setErrors={setErrors} errorKey="titulo" />
              </View>
            )}

            {(role === "alumno" || role === "preceptor") && (
              <View style={styles.sectionBlock}>
                {sectionLabel(role === "preceptor" ? "CURSO A CARGO" : "DATOS ACADÉMICOS")}
                <SelectChips
                  label="Curso"
                  options={CURSOS}
                  value={curso}
                  onSelect={setCurso}
                  errors={errors}
                  setErrors={setErrors}
                  errorKey="curso"
                  display={(o) => `${o} año`}
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

            {/* Botón */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleRegister} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#0B1628" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Crear cuenta</Text>
                    <MaterialCommunityIcons name="arrow-right" size={18} color="#0B1628" />
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Volver al login */}
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>¿Ya tenés cuenta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.footerLink}>Iniciar sesión</Text>
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
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 52, paddingBottom: 40 },

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
  cardSubtitle: { fontSize: 13, color: "#5A6B80", marginBottom: 20 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#5A6B80",
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 2,
  },
  sectionBlock: { marginTop: 6 },
  errorText: { fontSize: 12, color: "#D32F2F", marginTop: -4, marginBottom: 14, marginLeft: 2 },

  primaryButton: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00C9DB",
    borderRadius: 14,
    height: 52,
    marginTop: 18,
    shadowColor: "#00C9DB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: { fontSize: 16, fontWeight: "800", color: "#0B1628", letterSpacing: 0.3 },

  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginTop: 18,
  },
  footerText: { fontSize: 13, color: "#5A6B80" },
  footerLink: { fontSize: 13, color: "#6B3FA0", fontWeight: "800" },
});
