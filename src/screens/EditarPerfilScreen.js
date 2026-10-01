import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ROLES } from '../services/firestore';
import { notify } from '../utils/notify';
import { InputField } from '../components/FormFields';

export default function EditarPerfilScreen({ navigation }) {
  const { perfil, rol, actualizarPerfil } = useAuth();
  const { colors } = useTheme();

  const [nombre, setNombre] = useState(perfil?.nombre ?? '');
  const [apellido, setApellido] = useState(perfil?.apellido ?? '');
  const [telefono, setTelefono] = useState(perfil?.telefono ?? '');
  const [titulo, setTitulo] = useState(perfil?.titulo ?? '');
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  const montado = useRef(true);
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  useEffect(() => {
    if (!perfil) return;
    setNombre(perfil.nombre ?? '');
    setApellido(perfil.apellido ?? '');
    setTelefono(perfil.telefono ?? '');
    setTitulo(perfil.titulo ?? '');
  }, [perfil]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.background },
        topBar: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 6,
        },
        backButton: {
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        topTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: colors.text },
        spacer: { width: 40 },
        fill: { flex: 1 },
        scroll: { paddingHorizontal: 16, paddingBottom: 36, paddingTop: 8 },
        intro: { fontSize: 12.5, lineHeight: 18, color: colors.textSecondary, marginBottom: 16 },
        card: {
          backgroundColor: colors.surface,
          borderRadius: 18,
          padding: 18,
          borderWidth: 1,
          borderColor: colors.border,
        },
        section: {
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 1,
          color: colors.textSecondary,
          marginTop: 4,
          marginBottom: 12,
        },
        readonlyBlock: { marginTop: 8 },
        readonlyRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        readonlyIcon: {
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: colors.surfaceVariant,
          alignItems: 'center',
          justifyContent: 'center',
        },
        readonlyTexts: { flex: 1 },
        readonlyLabel: { fontSize: 11, color: colors.textSecondary, letterSpacing: 0.6, textTransform: 'uppercase' },
        readonlyValue: { fontSize: 14.5, fontWeight: '700', color: colors.text, marginTop: 2 },
        save: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: colors.primary,
          paddingVertical: 14,
          borderRadius: 12,
          marginTop: 18,
        },
        saveDisabled: { opacity: 0.7 },
        saveText: { fontSize: 15, fontWeight: '800', color: colors.onPrimary },
        hint: { fontSize: 12, lineHeight: 17, color: colors.textSecondary, marginTop: 16 },
      }),
    [colors]
  );

  const esAlumno = rol === ROLES.ALUMNO;
  const esDocente = rol === ROLES.PROFESOR;

  const validar = () => {
    const err = {};
    if (!nombre.trim()) err.nombre = 'El nombre es requerido';
    if (!apellido.trim()) err.apellido = 'El apellido es requerido';
    return err;
  };

  const handleSave = async () => {
    if (guardando) return;
    const err = validar();
    setErrores(err);
    if (Object.keys(err).length) return;

    const cambios = {
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      telefono: telefono.trim(),
    };
    if (esDocente) cambios.titulo = titulo.trim();

    setGuardando(true);
    try {
      await actualizarPerfil(cambios);

      if (!montado.current) return;
      setGuardando(false);
      notify('Perfil actualizado', 'Tus datos se guardaron correctamente.');
      navigation.goBack();
    } catch (error) {
      if (!montado.current) return;
      setGuardando(false);
      notify('No se pudo guardar', error?.message ?? 'Intentá de nuevo en unos segundos.');
    }
  };

  const cursoActual = perfil?.cursoNombre ?? perfil?.curso ?? null;
  const divisionActual = perfil?.division ?? null;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Editar perfil</Text>
        <View style={s.spacer} />
      </View>

      <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.intro}>
            Actualizá tus datos personales. Los cambios quedan guardados en tu cuenta institutional.
          </Text>

          <View style={s.card}>
            <Text style={s.section}>DATOS PERSONALES</Text>

            <InputField
              icon="account-outline"
              label="Nombre"
              placeholder="Ej: Ana"
              value={nombre}
              onChangeText={(texto) => {
                setNombre(texto);
                setErrores((prev) => ({ ...prev, nombre: '' }));
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
                setErrores((prev) => ({ ...prev, apellido: '' }));
              }}
              error={errores.apellido}
              autoCapitalize="words"
            />

            <InputField
              icon="phone-outline"
              label="Teléfono"
              placeholder="Ej: +54 9 11 5555 0000"
              value={telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
            />

            {esDocente ? (
              <InputField
                icon="certificate-outline"
                label="Título profesional"
                placeholder="Ej: Profesor de Matemática"
                value={titulo}
                onChangeText={setTitulo}
                autoCapitalize="sentences"
              />
            ) : null}

            {esAlumno ? (
              <View style={s.readonlyBlock}>
                <Text style={s.section}>DATOS ACADÉMICOS (SOLO LECTURA)</Text>

                <View style={s.readonlyRow}>
                  <View style={s.readonlyIcon}>
                    <MaterialCommunityIcons name="school-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={s.readonlyTexts}>
                    <Text style={s.readonlyLabel}>Curso</Text>
                    <Text style={s.readonlyValue}>{cursoActual ?? 'Sin curso asignado'}</Text>
                  </View>
                </View>

                <View style={s.readonlyRow}>
                  <View style={s.readonlyIcon}>
                    <MaterialCommunityIcons name="door-open" size={18} color={colors.primary} />
                  </View>
                  <View style={s.readonlyTexts}>
                    <Text style={s.readonlyLabel}>División</Text>
                    <Text style={s.readonlyValue}>{divisionActual ?? 'Sin división asignada'}</Text>
                  </View>
                </View>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={[s.save, guardando && s.saveDisabled]}
            onPress={handleSave}
            disabled={guardando}
          >
            {guardando ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save-outline" size={19} color={colors.onPrimary} />
                <Text style={s.saveText}>Guardar cambios</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={s.hint}>
            {esAlumno
              ? 'Tu curso y división los asigna la escuela. Si hay un error, comunicate con tu preceptor.'
              : esDocente
                ? 'Las materias y el año los asigna la dirección académica. Vos podés actualizar tu título.'
                : 'Tu rol institucional y los cursos a cargo los asigna la dirección de la escuela.'}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
