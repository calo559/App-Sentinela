// SettingsScreen.jsx — ahora se abre desde Perfil → "Configuración"
import { useState, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  Animated,
  Share,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { notify } from "../utils/notify";
import typography from "../theme/typography";

export default function SettingsScreen({ navigation }) {
  const { colors, isDarkMode, toggleDarkMode } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);
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
      notify("Error", "No se pudo compartir la aplicación");
    }
  };

  const handleClearData = () => {
    notify(
      "Limpiar datos",
      "¿Estás seguro que deseas limpiar los datos de caché? Esta acción no afectará tus datos personales.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpiar",
          style: "destructive",
          onPress: () => notify("Éxito", "Datos de caché eliminados correctamente"),
        },
      ],
    );
  };

  const handleContactSupport = async () => {
    try {
      await Linking.openURL("mailto:soporte@escuelatecnica3.edu?subject=Soporte técnico - Sistema de Asistencia");
    } catch (error) {
      notify("Error", "No se pudo abrir el cliente de correo");
    }
  };

  const handleVersionPress = () => {
    notify("Versión 2.0.0", 'Sistema de Asistencia Escolar\nEscuela Técnica Nº 3 "S.A. de Padrón"');
  };

  const handleBack = () => {
    if (navigation?.canGoBack?.()) navigation.goBack();
    else navigation?.navigate?.("Home");
  };

  // Secciones de configuración
  const sections = [
    {
      title: "NOTIFICACIONES",
      icon: "bell-outline",
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
      title: "ASISTENCIA",
      icon: "calendar-check-outline",
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
      title: "APARIENCIA",
      icon: "palette-outline",
      items: [
        {
          label: "Modo nocturno",
          description: "Tema oscuro para reducir fatiga visual",
          value: isDarkMode,
          onToggle: toggleDarkMode,
          type: "switch",
        },
        {
          label: "Idioma",
          description: language === "es" ? "Español" : "English",
          value: language,
          onToggle: () => {
            notify("Idioma", "Selecciona un idioma", [
              { text: "Español", onPress: () => setLanguage("es") },
              { text: "English", onPress: () => setLanguage("en") },
            ]);
          },
          type: "button",
        },
      ],
    },
    {
      title: "ACERCA DE",
      icon: "information-outline",
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
    <LinearGradient colors={[colors.background, isDarkMode ? colors.surface : colors.surfaceVariant]} style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Barra superior con botón de vuelta (se abre desde Perfil) */}
        <View style={s.topBar}>
          <TouchableOpacity
            style={[s.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[s.topTitle, { color: colors.text }]}>Configuración</Text>
          <View style={{ width: 40 }} />
        </View>

        <Animated.View style={[s.headerContainer, { transform: [{ scale: headerScale }], opacity: fadeAnim }]}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.headerGradient}
          >
            <View style={s.headerIconContainer}>
              <MaterialCommunityIcons name="cog-outline" size={34} color="#FFFFFF" />
            </View>
            <Text style={s.headerTitle}>Configuración</Text>
            <Text style={s.headerSubtitle}>Personaliza tu experiencia en el sistema</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {sections.map((section) => (
            <Animated.View key={section.title} style={[s.sectionContainer, { backgroundColor: colors.surface, transform: [{ scale: cardScale }] }]}>
              <View style={[s.sectionHeader, { backgroundColor: colors.surfaceVariant, borderBottomColor: colors.border }]}>
                <MaterialCommunityIcons name={section.icon} size={18} color={colors.primary} style={s.sectionIcon} />
                <Text style={[s.sectionTitle, { color: colors.primary }]}>{section.title}</Text>
              </View>
              <View style={s.sectionContent}>
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={item.label}
                    style={[s.settingItem, itemIndex < section.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                    onPress={item.onPress || item.onToggle}
                    activeOpacity={item.type !== "switch" ? 0.7 : 1}
                    disabled={item.type === "switch"}
                  >
                    <View style={s.settingInfo}>
                      <Text style={[s.settingLabel, { color: colors.text }]}>{item.label}</Text>
                      {item.description && <Text style={[s.settingDescription, { color: colors.textSecondary }]}>{item.description}</Text>}
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
                      <View style={s.buttonValue}>
                        <Text style={[s.buttonValueText, { color: colors.textSecondary }]}>{item.value === "es" ? "Español" : "English"}</Text>
                        <Text style={[s.chevron, { color: colors.textSecondary }]}>›</Text>
                      </View>
                    )}
                    {item.type === "action" && <Text style={[s.chevron, { color: colors.textSecondary }]}>›</Text>}
                    {item.type === "version" && (
                      <View style={[s.versionBadge, { backgroundColor: colors.primaryLight }]}>
                        <Text style={[s.versionText, { color: colors.primary }]}>2.0.0</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          ))}

          <Animated.View style={[s.footerContainer, { backgroundColor: colors.surface, opacity: fadeAnim, transform: [{ scale: cardScale }] }]}>
            <View style={s.footerContent}>
              <Text style={[s.footerSchool, { color: colors.textSecondary }]}>Escuela de Educación Secundaria</Text>
              <Text style={[s.footerSchoolName, { color: colors.primary }]}>Técnica Nº 3 "S.A. de Padrón"</Text>
              <View style={[s.footerDivider, { backgroundColor: colors.primaryLight }]} />
              <Text style={[s.footerRights, { color: colors.textSecondary }]}>© 2024 - Sistema de Asistencia Escolar</Text>
              <Text style={[s.footerVersion, { color: colors.textSecondary }]}>Versión 2.0.0 • Build 2401</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const s = {
  container: { flex: 1 },
  scrollContent: { paddingBottom: 30 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  backButton: {
    width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center",
    borderWidth: 1, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4,
  },
  topTitle: { flex: 1, textAlign: "center", fontSize: 16, fontWeight: "800" },
  headerContainer: { marginHorizontal: 16, marginTop: 20, marginBottom: 24, borderRadius: 24, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  headerGradient: { paddingVertical: 28, alignItems: "center" },
  headerIconContainer: { width: 70, height: 70, borderRadius: 35, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  headerIcon: { fontSize: 36 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#FFFFFF", marginBottom: 8 },
  headerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.9)", textAlign: "center" },
  sectionContainer: { marginHorizontal: 16, marginBottom: 20, borderRadius: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 4, overflow: "hidden" },
  sectionHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  sectionIcon: { marginRight: 10 },
  sectionTitle: { ...typography.subtitle2, fontWeight: "700", letterSpacing: 0.5 },
  sectionContent: { paddingHorizontal: 16 },
  settingItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 16 },
  settingInfo: { flex: 1, marginRight: 16 },
  settingLabel: { ...typography.body, fontWeight: "600", marginBottom: 4 },
  settingDescription: { ...typography.caption },
  buttonValue: { flexDirection: "row", alignItems: "center" },
  buttonValueText: { ...typography.body, marginRight: 8 },
  chevron: { fontSize: 18, fontWeight: "600" },
  versionBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  versionText: { ...typography.caption, fontWeight: "700" },
  footerContainer: { marginHorizontal: 16, marginTop: 12, marginBottom: 20, borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  footerContent: { paddingVertical: 24, alignItems: "center" },
  footerSchool: { ...typography.caption, marginBottom: 4 },
  footerSchoolName: { ...typography.body, fontWeight: "600", marginBottom: 12 },
  footerDivider: { width: 50, height: 2, marginVertical: 12 },
  footerRights: { ...typography.caption, marginBottom: 4 },
  footerVersion: { ...typography.caption, fontSize: 10 },
};
