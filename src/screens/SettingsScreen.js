// SettingsScreen.jsx
import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Share,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import colors from "../theme/colors";
import typography from "../theme/typography";

export default function SettingsScreen({ navigation }) {
  // Estados de configuración
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [nightMode, setNightMode] = useState(false);
  const [autoAttendance, setAutoAttendance] = useState(false);
  const [reportReminders, setReportReminders] = useState(true);
  const [language, setLanguage] = useState("es");
  const [dataSaver, setDataSaver] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const cardScale = useRef(new Animated.Value(0.95)).current;
  const headerScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 5,
        tension: 45,
        useNativeDriver: true,
      }),
      Animated.spring(headerScale, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: "Te invito a usar el Sistema de Asistencia Escolar Técnica Nº 3 - S.A. de Padrón",
        title: "Compartir aplicación",
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo compartir la aplicación");
    }
  };

  const handleClearData = () => {
    Alert.alert(
      "Limpiar datos",
      "¿Estás seguro que deseas limpiar los datos de caché? Esta acción no afectará tus datos personales.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpiar",
          style: "destructive",
          onPress: () => Alert.alert("Éxito", "Datos de caché eliminados correctamente"),
        },
      ],
    );
  };

  const handleContactSupport = () => {
    Linking.openURL("mailto:soporte@escuelatecnica3.edu?subject=Soporte técnico - Sistema de Asistencia");
  };

  const handleVersionPress = () => {
    Alert.alert("Versión 2.0.0", 'Sistema de Asistencia Escolar\nEscuela Técnica Nº 3 "S.A. de Padrón"');
  };

  // Secciones de configuración
  const sections = [
    {
      title: "🔔 NOTIFICACIONES",
      icon: "🔔",
      items: [
        {
          label: "Notificaciones push",
          description: "Recibir alertas de asistencia y novedades",
          value: notifications,
          onToggle: setNotifications,
          type: "switch",
        },
        {
          label: "Sonido de alerta",
          description: "Reproducir sonido al recibir notificaciones",
          value: sound,
          onToggle: setSound,
          type: "switch",
        },
        {
          label: "Recordatorios de reportes",
          description: "Recordatorios semanales para generar reportes",
          value: reportReminders,
          onToggle: setReportReminders,
          type: "switch",
        },
      ],
    },
    {
      title: "📊 ASISTENCIA",
      icon: "📊",
      items: [
        {
          label: "Asistencia automática",
          description: "Registro automático al entrar al aula",
          value: autoAttendance,
          onToggle: setAutoAttendance,
          type: "switch",
        },
        {
          label: "Modo ahorro de datos",
          description: "Reducir consumo de datos móviles",
          value: dataSaver,
          onToggle: setDataSaver,
          type: "switch",
        },
      ],
    },
    {
      title: "🎨 APARIENCIA",
      icon: "🎨",
      items: [
        {
          label: "Modo nocturno",
          description: "Tema oscuro para reducir fatiga visual",
          value: nightMode,
          onToggle: setNightMode,
          type: "switch",
        },
        {
          label: "Idioma",
          description: language === "es" ? "Español" : "English",
          value: language,
          onToggle: () => {
            Alert.alert("Idioma", "Selecciona un idioma", [
              { text: "Español", onPress: () => setLanguage("es") },
              { text: "English", onPress: () => setLanguage("en") },
            ]);
          },
          type: "button",
        },
      ],
    },
    {
      title: "ℹ️ ACERCA DE",
      icon: "ℹ️",
      items: [
        {
          label: "Compartir aplicación",
          description: "Invitar a otros docentes",
          onPress: handleShareApp,
          type: "action",
        },
        {
          label: "Soporte técnico",
          description: "Contactar al equipo de soporte",
          onPress: handleContactSupport,
          type: "action",
        },
        {
          label: "Limpiar caché",
          description: "Liberar espacio de almacenamiento",
          onPress: handleClearData,
          type: "action",
        },
        {
          label: "Versión 2.0.0",
          description: "Tocar para ver detalles",
          onPress: handleVersionPress,
          type: "version",
        },
      ],
    },
  ];

  return (
    <LinearGradient colors={[colors.background, "#F0F4F0"]} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header Animado */}
        <Animated.View
          style={[
            styles.headerContainer,
            {
              transform: [{ scale: headerScale }],
              opacity: fadeAnim,
            },
          ]}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerIconContainer}>
              <Text style={styles.headerIcon}>⚙️</Text>
            </View>
            <Text style={styles.headerTitle}>Configuración</Text>
            <Text style={styles.headerSubtitle}>Personaliza tu experiencia en el sistema</Text>
          </LinearGradient>
        </Animated.View>

        {/* Secciones */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          {sections.map((section, sectionIndex) => (
            <Animated.View
              key={section.title}
              style={[
                styles.sectionContainer,
                {
                  transform: [{ scale: cardScale }],
                },
              ]}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>{section.icon}</Text>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>

              <View style={styles.sectionContent}>
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.settingItem, itemIndex < section.items.length - 1 && styles.settingItemBorder]}
                    onPress={item.onPress || item.onToggle}
                    activeOpacity={item.type !== "switch" ? 0.7 : 1}
                    disabled={item.type === "switch"}
                  >
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingLabel}>{item.label}</Text>
                      {item.description && <Text style={styles.settingDescription}>{item.description}</Text>}
                    </View>

                    {item.type === "switch" && (
                      <Switch
                        value={item.value}
                        onValueChange={item.onToggle}
                        trackColor={{ false: colors.border, true: colors.primaryLight }}
                        thumbColor={item.value ? colors.primary : colors.textSecondary}
                        ios_backgroundColor={colors.border}
                      />
                    )}

                    {item.type === "button" && (
                      <View style={styles.buttonValue}>
                        <Text style={styles.buttonValueText}>{item.value === "es" ? "Español" : "English"}</Text>
                        <Text style={styles.chevron}>›</Text>
                      </View>
                    )}

                    {item.type === "action" && <Text style={styles.chevron}>›</Text>}

                    {item.type === "version" && (
                      <View style={styles.versionBadge}>
                        <Text style={styles.versionText}>2.0.0</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          ))}

          {/* Footer Institucional */}
          <Animated.View
            style={[
              styles.footerContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: cardScale }],
              },
            ]}
          >
            <View style={styles.footerContent}>
              <Text style={styles.footerSchool}>Escuela de Educación Secundaria</Text>
              <Text style={styles.footerSchoolName}>Técnica Nº 3 "S.A. de Padrón"</Text>
              <View style={styles.footerDivider} />
              <Text style={styles.footerRights}>© 2024 - Sistema de Asistencia Escolar</Text>
              <Text style={styles.footerVersion}>Versión 2.0.0 • Build 2401</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  headerContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerGradient: {
    paddingVertical: 28,
    alignItems: "center",
  },
  headerIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerIcon: {
    fontSize: 36,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  sectionTitle: {
    ...typography.subtitle2,
    fontWeight: "700",
    color: colors.primary,
    letterSpacing: 0.5,
  },
  sectionContent: {
    paddingHorizontal: 16,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    ...typography.body,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  buttonValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonValueText: {
    ...typography.body,
    color: colors.textSecondary,
    marginRight: 8,
  },
  chevron: {
    fontSize: 18,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  versionBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  versionText: {
    ...typography.caption,
    fontWeight: "700",
    color: colors.primary,
  },
  footerContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 20,
    backgroundColor: colors.surface,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  footerContent: {
    paddingVertical: 24,
    alignItems: "center",
  },
  footerSchool: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  footerSchoolName: {
    ...typography.body,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 12,
  },
  footerDivider: {
    width: 50,
    height: 2,
    backgroundColor: colors.primaryLight,
    marginVertical: 12,
  },
  footerRights: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  footerVersion: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
  },
});
