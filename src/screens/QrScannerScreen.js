import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { useMemo } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { SCREENS } from "../utils/constants";
import { getActiveUser } from "../services/authService";
import { markPresentToday } from "../services/attendanceService";

export default function QrScannerScreen({ navigation }) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [registro, setRegistro] = useState(null); // asistencia del alumno registrada
  const [yaMarcada, setYaMarcada] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    animateScanLine();
  }, []);

  const animateScanLine = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.2, duration: 1500, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  };

  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned) return;
    setScanned(true);
    setScannedData(data);

    // El alumno se marca presente al escanear el QR de su clase
    const user = getActiveUser();
    if (user?.role === "alumno") {
      const reg = markPresentToday(user);
      setRegistro(reg);
      setYaMarcada(!!reg?.ya);
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setScannedData(null);
  };

  // La pestaña QR no tiene historial atrás: si no se puede "goBack", volvemos a Home
  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate(SCREENS.HOME);
    }
  };

  const s = useMemo(() => ({
    container: { flex: 1, backgroundColor: colors.black },
    camera: { flex: 1 },
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "space-between" },
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingTop: 50, paddingHorizontal: 20,
    },
    backButton: { padding: 8 },
    backText: { color: colors.white, fontSize: 16, fontWeight: "600" },
    headerTitle: { color: colors.white, fontSize: 18, fontWeight: "700" },
    placeholder: { width: 80 },
    scanArea: {
      width: 250, height: 250, alignSelf: "center",
      borderWidth: 2, borderColor: "transparent",
    },
    cornerTL: {
      position: "absolute", top: -2, left: -2,
      width: 30, height: 30,
      borderTopWidth: 4, borderLeftWidth: 4, borderColor: colors.secondary,
    },
    cornerTR: {
      position: "absolute", top: -2, right: -2,
      width: 30, height: 30,
      borderTopWidth: 4, borderRightWidth: 4, borderColor: colors.secondary,
    },
    cornerBL: {
      position: "absolute", bottom: -2, left: -2,
      width: 30, height: 30,
      borderBottomWidth: 4, borderLeftWidth: 4, borderColor: colors.secondary,
    },
    cornerBR: {
      position: "absolute", bottom: -2, right: -2,
      width: 30, height: 30,
      borderBottomWidth: 4, borderRightWidth: 4, borderColor: colors.secondary,
    },
    scanLine: {
      position: "absolute", top: "50%", alignSelf: "center",
      width: 220, height: 2, backgroundColor: colors.secondary,
      opacity: 0.8,
    },
    hint: {
      color: colors.white, textAlign: "center", fontSize: 14,
      paddingBottom: 60, paddingHorizontal: 40,
    },
    resultContainer: {
      backgroundColor: "rgba(0,0,0,0.8)", marginHorizontal: 30,
      borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 40,
    },
    resultTitle: { color: colors.white, fontSize: 14, fontWeight: "600", marginBottom: 8 },
    successIcon: { marginBottom: 8 },
    resultData: {
      color: colors.secondary, fontSize: 14, fontWeight: "500",
      textAlign: "center", marginBottom: 16,
    },
    button: {
      backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 24,
      borderRadius: 12, alignSelf: "center",
    },
    buttonText: { color: colors.white, fontWeight: "700", fontSize: 14 },
    message: { color: colors.text, fontSize: 16, textAlign: "center", marginTop: 40 },
  }), [colors]);

  if (!permission) {
    return (
      <View style={s.container}>
        <Text style={s.message}>Solicitando permiso de cámara...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={s.container}>
        <View style={{ paddingTop: 50, paddingHorizontal: 20 }}>
          <TouchableOpacity onPress={handleBack} style={s.backButton}>
            <Text style={s.backText}>← Volver</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.message}>Sin acceso a la cámara</Text>
        <TouchableOpacity style={s.button} onPress={requestPermission}>
          <Text style={s.buttonText}>Conceder permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <CameraView
        style={s.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      >
        <View style={s.overlay}>
          <View style={s.header}>
            <TouchableOpacity onPress={handleBack} style={s.backButton}>
              <Text style={s.backText}>← Volver</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>Escanear QR</Text>
            <View style={s.placeholder} />
          </View>

          <View style={s.scanArea}>
            <View style={s.cornerTL} />
            <View style={s.cornerTR} />
            <View style={s.cornerBL} />
            <View style={s.cornerBR} />
          </View>

          <Animated.View style={[s.scanLine, { transform: [{ scaleY: scaleAnim }] }]} />

          {scanned && scannedData ? (
            <View style={s.resultContainer}>
              {registro ? (
                <View>
                  <View style={s.successIcon}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={44}
                      color={colors.success}
                    />
                  </View>
                  <Text style={s.resultTitle}>
                    {yaMarcada
                      ? "Tu asistencia de hoy ya estaba registrada"
                      : "¡Asistencia registrada!"}
                  </Text>
                  <Text style={s.resultData}>
                    {`Presente · ${registro.hora}`}
                    {registro.curso ? `\n${registro.curso} · ${registro.alumno}` : ""}
                  </Text>
                </View>
              ) : (
                <View>
                  <Text style={s.resultTitle}>Código escaneado:</Text>
                  <Text style={s.resultData}>{scannedData}</Text>
                </View>
              )}
              <TouchableOpacity style={s.button} onPress={handleScanAgain}>
                <Text style={s.buttonText}>Escanear otro</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={s.hint}>Coloca el código QR dentro del recuadro</Text>
          )}
        </View>
      </CameraView>
    </View>
  );
}
