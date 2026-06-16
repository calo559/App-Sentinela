import { useRef, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function PerfilDocenteScreen({ route, navigation }) {
  const { nombre, apellido, dni, email, materia, titulo } = route.params || {};
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 6, tension: 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const campos = [
    { icon: "👤", label: "Nombre completo", value: `${nombre} ${apellido}` },
    { icon: "🪪", label: "DNI", value: dni },
    { icon: "📧", label: "Correo electrónico", value: email },
    { icon: "📚", label: "Materia", value: materia },
    { icon: "💼", label: "Título profesional", value: titulo },
  ];

  return (
    <LinearGradient colors={["#1B5E20", "#2E7D32", "#388E3C"]} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{nombre?.[0]?.toUpperCase() ?? "D"}</Text>
            </View>
            <View style={styles.badgeRow}>
              <Text style={styles.badgeIcon}>👨‍🏫</Text>
              <Text style={styles.badgeText}>DOCENTE</Text>
            </View>
            <Text style={styles.fullName}>{nombre} {apellido}</Text>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          {/* Tarjeta */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Información del docente</Text>
            {campos.map(({ icon, label, value }) => (
              <View key={label} style={styles.row}>
                <View style={styles.rowIcon}>
                  <Text style={styles.rowIconText}>{icon}</Text>
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>{label.toUpperCase()}</Text>
                  <Text style={styles.rowValue}>{value ?? "-"}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.backButton} onPress={() => navigation.replace("Login")}>
            <Text style={styles.backButtonText}>← Volver al inicio</Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 70, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 28 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(255,215,0,0.2)", borderWidth: 3, borderColor: "rgba(255,215,0,0.5)", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarText: { fontSize: 40, fontWeight: "800", color: "#FFD700" },
  badgeRow: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,215,0,0.2)", paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 10, gap: 6 },
  badgeIcon: { fontSize: 14 },
  badgeText: { fontSize: 12, fontWeight: "800", color: "#FFD700", letterSpacing: 1 },
  fullName: { fontSize: 26, fontWeight: "800", color: "#FFF", marginBottom: 4, textAlign: "center" },
  emailText: { fontSize: 14, color: "rgba(255,255,255,0.7)", textAlign: "center" },
  card: { backgroundColor: "rgba(255,255,255,0.95)", borderRadius: 24, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 12, marginBottom: 20 },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#1B5E20", marginBottom: 16, textAlign: "center", letterSpacing: 0.5 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  rowIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center", marginRight: 12 },
  rowIconText: { fontSize: 18 },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 10, fontWeight: "700", color: "#999", marginBottom: 2, letterSpacing: 0.5 },
  rowValue: { fontSize: 15, fontWeight: "600", color: "#333" },
  backButton: { alignItems: "center", paddingVertical: 12 },
  backButtonText: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.7)" },
});
