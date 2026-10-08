// ProfileScreen — Perfil (scrolleable) con acceso a Editar perfil y Configuración.
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useMemo, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ROLE_INFO } from '../utils/roles';
import { etiquetaCursoId, MATERIAS_ESCOLARES } from '../utils/colegio';
import { logout, getActiveUser } from '../services/authService';
import { notify } from '../utils/notify';
import typography from '../theme/typography';
import Card from '../components/Card';
import Header from '../components/Header';

const infoRows = (profile) => {
  const rows = [
    { label: 'Nombre completo', value: profile.name },
    { label: 'Correo electrónico', value: profile.email },
    { label: 'Rol', value: profile.role },
    { label: 'DNI', value: profile.dni },
  ];
  if (profile.curso) {
    rows.push({
      label: profile.role === 'Alumno' ? 'Curso' : 'Cursos a cargo',
      value: profile.curso,
    });
  }
  if (profile.cursos) rows.push({ label: 'Cursos que dicta', value: profile.cursos });
  else if (profile.anio) rows.push({ label: 'Año que dicta', value: profile.anio });
  if (profile.materias) rows.push({ label: 'Materias que dicta', value: profile.materias });
  if (profile.cursosDeclarados)
    rows.push({ label: 'Cursos solicitados', value: `${profile.cursosDeclarados} (pendiente)` });
  if (profile.materiasDeclaradas)
    rows.push({ label: 'Materias solicitadas', value: `${profile.materiasDeclaradas} (pendiente)` });
  if (profile.titulo) rows.push({ label: 'Título', value: profile.titulo });
  return rows;
};

export default function ProfileScreen({ navigation }) {
  const { colors } = useTheme();
  // Al volver de "Editar perfil" refrescamos los datos del usuario
  const [, setTick] = useState(0);
  useFocusEffect(useCallback(() => {
    setTick((t) => t + 1);
  }, []));

  const active = getActiveUser() || {};
  const roleLabel = ROLE_INFO[active.role]?.label || 'Invitado';
  const profile = {
    name: [active.nombre, active.apellido].filter(Boolean).join(' ') || 'Usuario',
    email: active.email || '—',
    role: roleLabel,
    dni: active.dni || '—',
    curso: active.curso ? `${active.curso}${active.division ?? ''}` : null,
    anio: active.anio ? `${active.anio}°` : null,
    cursos:
      Array.isArray(active.cursos) && active.cursos.length
        ? active.cursos.map((c) => `${c.curso}${c.division}`).join(' · ')
        : null,
    materias:
      Array.isArray(active.materias) && active.materias.length
        ? active.materias.join(', ')
        : active.materia || null,
    // Declaraciones del registro (todavia no confirmadas por la institucion)
    cursosDeclarados:
      Array.isArray(active.cursosDeclarados) && active.cursosDeclarados.length
        ? active.cursosDeclarados.map((id) => etiquetaCursoId(id)).join(' · ')
        : null,
    materiasDeclaradas:
      Array.isArray(active.materiasDeclaradas) && active.materiasDeclaradas.length
        ? active.materiasDeclaradas
            .map(
              (bloque) =>
                `${etiquetaCursoId(bloque.cursoId)}: ${(bloque.materias || [])
                  .map((codigo) => MATERIAS_ESCOLARES.find((m) => m.id === codigo)?.label ?? codigo)
                  .join(', ')}`
            )
            .join(' · ')
        : null,
    titulo: active.titulo || null,
  };

  const goLogin = () => {
    // Es una pestaña (no un stack): replace() vive en el navigator padre.
    const parent = navigation?.getParent?.();
    if (typeof parent?.replace === 'function') {
      parent.replace('Login');
    } else if (navigation?.canGoBack?.()) {
      navigation.goBack();
    } else if (navigation) {
      navigation.navigate('Login');
    }
  };

  const handleLogout = () => {
    notify('Cerrar sesión', '¿Estás seguro que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí, cerrar sesión',
        onPress: () => {
          logout();
          goLogin();
        },
      },
    ]);
  };

  const handleEditProfile = () => {
    navigation?.navigate?.('EditarPerfil');
  };

  // Settings ya no es una sección de la barra: vive acá dentro (Stack "Settings")
  const goSettings = () => {
    navigation?.navigate?.('Settings');
  };

  const s = useMemo(() => ({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingBottom: 28 },
    avatarContainer: { alignItems: 'center', marginVertical: 24 },
    avatar: {
      width: 100, height: 100, borderRadius: 50,
      backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
      borderWidth: 3, borderColor: colors.white,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
    },
    avatarText: { fontSize: 40, fontWeight: '700', color: colors.onPrimary || colors.white },
    userRole: { ...typography.h3, color: colors.primary, marginTop: 12, fontWeight: '600' },
    userInstitution: { ...typography.caption, color: colors.textSecondary, marginTop: 4 },
    infoCard: { marginHorizontal: 16, marginTop: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14 },
    border: { borderBottomWidth: 1, borderBottomColor: colors.border },
    label: { ...typography.body, color: colors.textSecondary, flex: 0.4 },
    value: { ...typography.body, fontWeight: '600', color: colors.text, flex: 0.6, textAlign: 'right' },
    buttonsContainer: { paddingHorizontal: 16, marginTop: 24, gap: 12 },
    settingsButton: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.surface, padding: 12, borderRadius: 14,
      borderWidth: 1, borderColor: colors.border,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
    },
    settingsIcon: {
      width: 42, height: 42, borderRadius: 12,
      backgroundColor: colors.primary + '1F',
      alignItems: 'center', justifyContent: 'center',
    },
    settingsInfo: { flex: 1 },
    settingsTitle: { ...typography.body, fontWeight: '700', color: colors.text },
    settingsDesc: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    editButton: {
      backgroundColor: colors.primary + '10', paddingVertical: 12, borderRadius: 10,
      alignItems: 'center', borderWidth: 1, borderColor: colors.primary,
      flexDirection: 'row', justifyContent: 'center', gap: 8,
    },
    editButtonText: { ...typography.button, color: colors.primary, fontWeight: '600' },
    logoutButton: {
      backgroundColor: colors.error + '10', paddingVertical: 12, borderRadius: 10,
      alignItems: 'center', borderWidth: 1, borderColor: colors.error,
    },
    logoutButtonText: { ...typography.button, color: colors.error, fontWeight: '600' },
    versionContainer: { alignItems: 'center', marginTop: 28 },
    versionText: { ...typography.caption, color: colors.textSecondary },
    versionSubtext: { ...typography.caption, fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  }), [colors]);

  return (
    <View style={s.container}>
      <Header title="Mi Perfil" subtitle="Información personal y académica" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.scroll}
      >
        <View style={s.avatarContainer}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{(profile.name || '?').trim().charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={s.userRole}>{profile.role}</Text>
          <Text style={s.userInstitution}>Escuela Técnica N°3 - "S.A. de Padrón"</Text>
        </View>

        <Card style={s.infoCard}>
          {infoRows(profile).map((row, index, list) => (
            <View key={row.label} style={[s.row, index < list.length - 1 && s.border]}>
              <Text style={s.label}>{row.label}</Text>
              <Text style={s.value} numberOfLines={3}>{row.value ?? '—'}</Text>
            </View>
          ))}
        </Card>

        <View style={s.buttonsContainer}>
          {/* Configuración (antes era una pestaña propia) */}
          <TouchableOpacity style={s.settingsButton} onPress={goSettings}>
            <View style={s.settingsIcon}>
              <MaterialCommunityIcons name="cog-outline" size={22} color={colors.primary} />
            </View>
            <View style={s.settingsInfo}>
              <Text style={s.settingsTitle}>Configuración</Text>
              <Text style={s.settingsDesc}>Notificaciones, apariencia y datos</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={s.editButton} onPress={handleEditProfile}>
            <MaterialCommunityIcons name="account-edit-outline" size={18} color={colors.primary} />
            <Text style={s.editButtonText}>Editar perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.logoutButton} onPress={handleLogout}>
            <Text style={s.logoutButtonText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={s.versionContainer}>
          <Text style={s.versionText}>Sistema de Asistencia Escolar v1.0</Text>
          <Text style={s.versionSubtext}>Escuela Técnica N°3 - "S.A. de Padrón"</Text>
        </View>
      </ScrollView>
    </View>
  );
}
