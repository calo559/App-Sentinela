import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Linking, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { notify } from '../utils/notify';
import { SCREENS } from '../utils/constants';
import {
  ATTENDANCE_METHOD,
  ATTENDANCE_STATUS,
  ROLES,
  attendance,
  qrSessions,
  schedules,
  subjects,
} from '../services/firestore';
import { horarioDePeriodo, llegoTarde, periodoDeSlot, slotActual } from '../qr/horarios';
import { validarEscaneo } from '../qr/qrDinamico';

const MARGEN_SESION_MIN = 5;

const MOTIVOS_SESION = {
  codigo_invalido: 'Ese código no corresponde a una sesión de asistencia.',
  sesion_inactiva: 'Esa sesión de asistencia ya está cerrada.',
  sesion_sin_horario: 'Esa sesión de asistencia no tiene horario cargado.',
  aun_no_comienza: 'La sesión de asistencia todavía no empezó.',
  sesion_terminada: 'La sesión de asistencia ya terminó.',
  otra_fecha: 'Esa sesión de asistencia es de otro día.',
};

const MOTIVOS_ALUMNO = {
  datos_incompletos: 'Tu perfil no tiene un alumno ni un curso asignado.',
  alumno_inexistente: 'No encontramos tu ficha de alumno.',
  alumno_inactivo: 'Tu ficha de alumno está dada de baja.',
  alumno_de_otro_curso: 'No pertenecés al curso de esta sesión.',
};

const TEXTO_ESTADO = {
  [ATTENDANCE_STATUS.PRESENTE]: 'Presente',
  [ATTENDANCE_STATUS.TARDE]: 'Llegada tarde',
};

const horaTexto = (date) =>
  `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

export default function QrScannerScreen({ navigation }) {
  const { colors } = useTheme();
  const { usuario, perfil, rol } = useAuth();
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [escaneado, setEscaneado] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const procesandoRef = useRef(false);
  const pulso = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const esAlumno = rol === ROLES.ALUMNO;
  const alumnoId = perfil?.alumnoId ?? null;
  const cursoId = perfil?.cursoId ?? null;

  useEffect(() => {
    const animacion = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulso, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    animacion.start();
    return () => animacion.stop();
  }, [pulso]);

  const volver = useCallback(() => {
    if (navigation?.canGoBack?.()) navigation.goBack();
    else navigation?.navigate?.(SCREENS.HOME);
  }, [navigation]);

  const marcarError = useCallback((titulo, mensaje) => {
    setResultado({ ok: false, titulo, mensaje });
    notify(titulo, mensaje);
  }, []);

  const marcarExito = useCallback((datos) => {
    setResultado({ ok: true, titulo: 'Asistencia registrada', ...datos });
  }, []);

  const escanearOtro = useCallback(() => {
    procesandoRef.current = false;
    setProcesando(false);
    setEscaneado(false);
    setResultado(null);
  }, []);

  const horariosDelCurso = useCallback(
    async (ahora) => {
      if (!cursoId) return [];
      try {
        return await schedules.obtenerHorarios({ cursoId, diaSemana: ahora.getDay() });
      } catch (error) {
        return [];
      }
    },
    [cursoId]
  );

  const nombreMateria = useCallback(async (materiaId) => {
    if (!materiaId) return null;
    try {
      const materia = await subjects.obtenerMateria(materiaId);
      return materia?.nombre ?? null;
    } catch (error) {
      return null;
    }
  }, []);

  const registrar = useCallback(
    async ({ materiaId, horarioId, sesionQRId, estado, ahora }) => {
      // CREATE la primera vez (incluye creadoEn); UPDATE en un reescaneo (solo
      // hora/estado/actualizadoEn). La funcion elige el camino segun exista el doc.
      const id = await attendance.registrarOActualizarAsistenciaQr({
        alumnoId,
        cursoId,
        materiaId: materiaId ?? null,
        horarioId: horarioId ?? null,
        fecha: ahora,
        hora: ahora,
        estado,
        observaciones: estado === ATTENDANCE_STATUS.TARDE ? 'Llegada tarde (registro por QR)' : 'Registro por QR',
        registradoPor: usuario?.uid ?? alumnoId,
        metodoRegistro: ATTENDANCE_METHOD.QR,
        sesionQRId: sesionQRId ?? null,
      });
      return id;
    },
    [alumnoId, cursoId, usuario]
  );

  // El token stateless (qrCore/qrDinamico) es SOLO validacion de cliente: como el
  // secreto viaja en el bundle, Firestore no puede verificar quien lo emitio. Para
  // que el registro sea verificable, resolvemos la sesion QR activa del curso y la
  // adjuntamos; sin sesion activa no se escribe ninguna asistencia.
  const registrarPorToken = useCallback(
    async (token, ahora) => {
      const sesion = await qrSessions.obtenerSesionVigenteDeCurso(cursoId, { fecha: ahora });
      if (!sesion?.id) {
        marcarError(
          'QR sin sesión activa',
          'El registro por QR necesita una sesión de asistencia activa de tu curso. Pedile el código vigente al docente.'
        );
        return;
      }

      const horarios = await horariosDelCurso(ahora);
      const horario = horarioDePeriodo(horarios, token.periodo);
      const materiaId = horario?.materiaId ?? null;
      const estado = token.tarde ? ATTENDANCE_STATUS.TARDE : ATTENDANCE_STATUS.PRESENTE;

      const id = await registrar({
        materiaId,
        horarioId: horario?.id ?? null,
        sesionQRId: sesion.id,
        estado,
        ahora,
      });

      marcarExito({
        estado,
        hora: horaTexto(ahora),
        periodo: token.periodo?.nombre ?? null,
        materia: await nombreMateria(materiaId),
        id,
      });
    },
    [cursoId, horariosDelCurso, marcarError, marcarExito, nombreMateria, registrar]
  );

  const registrarPorSesion = useCallback(
    async (codigo, ahora) => {
      const { valida, razon, sesion } = await qrSessions.validarSesionQr(codigo, {
        fecha: ahora,
        margenToleranciaMinutos: MARGEN_SESION_MIN,
      });

      if (!valida) {
        marcarError('Código no válido', MOTIVOS_SESION[razon] ?? 'Ese código no es válido para registrar asistencia.');
        return false;
      }

      const alumno = await qrSessions.validarAlumnoEnCurso({ alumnoId, cursoId });
      if (!alumno.valida) {
        marcarError('No podés marcar aquí', MOTIVOS_ALUMNO[alumno.razon] ?? 'No se pudo validar tu curso.');
        return false;
      }

      const horarios = await horariosDelCurso(ahora);
      const slot = slotActual(ahora);
      const periodo = periodoDeSlot(slot);
      const horario =
        (sesion.materiaId ? horarios.find((item) => item.materiaId === sesion.materiaId) : null) ??
        horarioDePeriodo(horarios, periodo);
      const materiaId = sesion.materiaId ?? horario?.materiaId ?? null;
      const estado = llegoTarde(ahora, slot) ? ATTENDANCE_STATUS.TARDE : ATTENDANCE_STATUS.PRESENTE;

      const id = await registrar({
        materiaId,
        horarioId: horario?.id ?? null,
        sesionQRId: sesion.id ?? null,
        estado,
        ahora,
      });

      marcarExito({
        estado,
        hora: horaTexto(ahora),
        periodo: periodo?.nombre ?? null,
        materia: await nombreMateria(materiaId),
        id,
      });
      return true;
    },
    [alumnoId, cursoId, horariosDelCurso, marcarError, marcarExito, nombreMateria, registrar]
  );

  const manejarEscaneo = useCallback(
    async ({ data }) => {
      if (procesandoRef.current) return;
      const codigo = String(data ?? '').trim();

      procesandoRef.current = true;
      setProcesando(true);
      setEscaneado(true);
      setResultado(null);

      try {
        if (!esAlumno) {
          marcarError('Solo para alumnos', 'El escáner de asistencia es exclusivo para los alumnos.');
          return;
        }
        if (!alumnoId || !cursoId) {
          marcarError(
            'Solo alumnos pueden registrar asistencia',
            'Tu cuenta no tiene un alumno ni un curso asignado. Avisá al preceptorado.'
          );
          return;
        }

        const ahora = new Date();
        const token = validarEscaneo(codigo, { ahora });

        if (token.valida) {
          await registrarPorToken(token, ahora);
          return;
        }
        if (token.esToken) {
          marcarError('Código no válido', token.mensaje);
          return;
        }
        await registrarPorSesion(codigo, ahora);
      } catch (error) {
        marcarError('No se pudo registrar', 'Ocurrió un problema al guardar tu asistencia. Intentá de nuevo.');
      } finally {
        setProcesando(false);
      }
    },
    [alumnoId, cursoId, esAlumno, marcarError, registrarPorSesion, registrarPorToken]
  );

  const abrirAjustes = useCallback(() => {
    Linking.openSettings().catch(() => {});
  }, []);

  const s = useMemo(
    () => ({
      container: { flex: 1, backgroundColor: colors.black },
      camera: { flex: 1 },
      overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
      },
      backButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingRight: 12 },
      backText: { color: colors.white, fontSize: 15, fontWeight: '600' },
      headerTitle: { color: colors.white, fontSize: 17, fontWeight: '700' },
      placeholder: { width: 80 },
      scanArea: { width: 240, height: 240, alignSelf: 'center' },
      corner: { position: 'absolute', width: 32, height: 32, borderColor: colors.secondary },
      cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4 },
      cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4 },
      cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4 },
      cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4 },
      scanLine: {
        position: 'absolute',
        top: '50%',
        alignSelf: 'center',
        width: 200,
        height: 2,
        borderRadius: 2,
        backgroundColor: colors.secondary,
        opacity: 0.9,
      },
      hint: { color: colors.white, textAlign: 'center', fontSize: 14, paddingHorizontal: 32 },
      card: {
        backgroundColor: 'rgba(10,10,10,0.88)',
        marginHorizontal: 24,
        borderRadius: 18,
        padding: 20,
        alignItems: 'center',
      },
      cardTitle: { color: colors.white, fontSize: 17, fontWeight: '700', marginTop: 10, textAlign: 'center' },
      cardText: { color: '#E8E8E8', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
      cardDetail: { color: colors.secondary, fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 10 },
      botonPrimario: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 26, borderRadius: 12, marginTop: 16 },
      botonPrimarioText: { color: colors.onPrimary, fontWeight: '700', fontSize: 15 },
      botonSecundario: { paddingVertical: 10, paddingHorizontal: 20, marginTop: 4 },
      botonSecundarioText: { color: colors.white, fontWeight: '600', fontSize: 14 },
      pantallaMensaje: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
      mensajeIcono: { marginBottom: 14 },
      mensajeTitulo: { fontSize: 19, fontWeight: '700', color: colors.text, textAlign: 'center' },
      mensajeTexto: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', marginTop: 10, lineHeight: 21 },
      loader: { marginTop: 18 },
    }),
    [colors]
  );

  const encabezado = (title = 'Escanear QR') => (
    <View style={[s.header, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={volver} style={s.backButton} accessibilityLabel="Volver">
        <MaterialCommunityIcons name="chevron-left" size={26} color={colors.white} />
        <Text style={s.backText}>Volver</Text>
      </TouchableOpacity>
      <Text style={s.headerTitle}>{title}</Text>
      <View style={s.placeholder} />
    </View>
  );

  if (!esAlumno) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        {encabezado('Escanear QR')}
        <View style={s.pantallaMensaje}>
          <MaterialCommunityIcons name="account-lock-outline" size={64} color={colors.textSecondary} style={s.mensajeIcono} />
          <Text style={s.mensajeTitulo}>Solo para alumnos</Text>
          <Text style={s.mensajeTexto}>
            El escáner de asistencia está disponible únicamente para cuentas de alumno. Si necesitás registrar o
            consultar asistencia, hacelo desde tu perfil.
          </Text>
          <TouchableOpacity style={s.botonPrimario} onPress={volver}>
            <Text style={s.botonPrimarioText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!permiso) {
    return (
      <View style={s.container}>
        <Text style={[s.mensajeTexto, { color: colors.white }]}>Verificando el permiso de cámara…</Text>
        <ActivityIndicator style={s.loader} color={colors.secondary} />
      </View>
    );
  }

  if (!permiso.granted) {
    return (
      <View style={[s.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        {encabezado('Escanear QR')}
        <View style={s.pantallaMensaje}>
          <MaterialCommunityIcons name="camera-off-outline" size={64} color={colors.textSecondary} style={s.mensajeIcono} />
          <Text style={s.mensajeTitulo}>Sin acceso a la cámara</Text>
          <Text style={s.mensajeTexto}>
            Necesitamos la cámara para leer el código QR de la entrada. El permiso solo se pide en este paso.
          </Text>
          {permiso.canAskAgain ? (
            <TouchableOpacity style={s.botonPrimario} onPress={pedirPermiso}>
              <Text style={s.botonPrimarioText}>Conceder permiso</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.botonPrimario} onPress={abrirAjustes}>
              <Text style={s.botonPrimarioText}>Abrir ajustes</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.botonSecundario} onPress={volver}>
            <Text style={s.botonSecundarioText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <CameraView
        style={s.camera}
        facing="back"
        enableTorch={false}
        onBarcodeScanned={escaneado ? undefined : manejarEscaneo}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >
        <View style={s.overlay}>
          {encabezado()}

          <View style={s.scanArea}>
            <View style={[s.corner, s.cornerTL]} />
            <View style={[s.corner, s.cornerTR]} />
            <View style={[s.corner, s.cornerBL]} />
            <View style={[s.corner, s.cornerBR]} />
            <Animated.View
              style={[
                s.scanLine,
                { transform: [{ translateY: pulso.interpolate({ inputRange: [0, 1], outputRange: [-100, 100] }) }] },
              ]}
            />
          </View>

          <View style={{ flex: 1, justifyContent: 'flex-end', paddingBottom: insets.bottom + 28 }}>
            {resultado ? (
              <View style={s.card}>
                <MaterialCommunityIcons
                  name={resultado.ok ? 'check-circle' : 'close-circle'}
                  size={44}
                  color={resultado.ok ? colors.success : colors.error}
                />
                <Text style={s.cardTitle}>{resultado.titulo}</Text>
                {resultado.ok ? (
                  <>
                    <Text style={s.cardDetail}>
                      {TEXTO_ESTADO[resultado.estado] ?? 'Presente'} · {resultado.hora}
                    </Text>
                    <Text style={s.cardText}>
                      {[resultado.materia, resultado.periodo].filter(Boolean).join(' · ') ||
                        'Registro general del día'}
                    </Text>
                  </>
                ) : (
                  <Text style={s.cardText}>{resultado.mensaje}</Text>
                )}

                {procesando && <ActivityIndicator style={s.loader} color={colors.secondary} />}

                <TouchableOpacity
                  style={[s.botonPrimario, procesando && { opacity: 0.5 }]}
                  onPress={escanearOtro}
                  disabled={procesando}
                >
                  <Text style={s.botonPrimarioText}>Escanear otro</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.botonSecundario} onPress={volver}>
                  <Text style={s.botonSecundarioText}>Volver</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={s.hint}>Colocá el código QR de la entrada dentro del recuadro</Text>
            )}
          </View>
        </View>
      </CameraView>
    </View>
  );
}
