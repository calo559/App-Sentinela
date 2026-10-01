import { useMemo } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { infoRol } from '../utils/roles';
import { notify } from '../utils/notify';
import { SCREENS } from '../utils/constants';
import appInfo from '../../app.json';

const ESCUELA = 'Escuela Técnica Nº 3 "S.A. de Padrón"';

const inicialesDe = (nombre, apellido) => {
  const inicial = `${(nombre ?? '').trim().charAt(0)}${(apellido ?? '').trim().charAt(0)}`.toUpperCase();
  return inicial || '?';
};

export default function SettingsScreen({ navigation }) {
  const { colors, isDarkMode, toggleDarkMode } = useTheme();
  const { perfil, rol, salir } = useAuth();

  const info = infoRol(rol);
  const nombreCompleto = [perfil?.nombre, perfil?.apellido].filter(Boolean).join(' ').trim() || 'Usuario';

  const handleSalir = () => {
    notify('Cerrar sesión', '¿Querés cerrar la sesión actual?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          try {
            await salir();
          } catch (error) {
            notify('No se pudo cerrar sesión', error?.message ?? 'Intentá de nuevo.');
            return;
          }
        },
      },
    ]);
  };

  const s = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.background },
        scroll: { paddingBottom: 32 },
        header: {
          alignItems: 'center',
          borderRadius: 24,
          marginHorizontal: 16,
          marginTop: 14,
          marginBottom: 22,
          paddingVertical: 26,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 12,
          elevation: 8,
        },
        headerIcon: {
          width: 66,
          height: 66,
          borderRadius: 33,
          backgroundColor: `${colors.white}26`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        },
        headerTitle: { fontSize: 26, fontWeight: '800', color: colors.white },
        headerSubtitle: { fontSize: 13, color: colors.white, opacity: 0.9, marginTop: 6, textAlign: 'center' },

        account: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          marginHorizontal: 16,
          marginBottom: 20,
          padding: 16,
          borderRadius: 18,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        avatar: {
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        avatarText: { fontSize: 20, fontWeight: '800', color: colors.onPrimary },
        accountTexts: { flex: 1 },
        accountName: { fontSize: 16, fontWeight: '800', color: colors.text },
        accountMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
        accountRole: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          marginTop: 7,
          alignSelf: 'flex-start',
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: `${colors.primary}1A`,
        },
        accountRoleText: { fontSize: 11.5, fontWeight: '700', color: colors.primary },

        section: {
          marginHorizontal: 16,
          marginBottom: 18,
          borderRadius: 18,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        },
        sectionHeader: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: 18,
          paddingVertical: 13,
          backgroundColor: colors.surfaceVariant,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        sectionTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, color: colors.primary },
        item: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          paddingHorizontal: 18,
          paddingVertical: 16,
        },
        itemBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
        itemIcon: {
          width: 38,
          height: 38,
          borderRadius: 11,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surfaceVariant,
        },
        itemTexts: { flex: 1, marginLeft: 12 },
        itemLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
        itemDesc: { fontSize: 12.5, color: colors.textSecondary, marginTop: 3, lineHeight: 17 },
        logout: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          marginHorizontal: 16,
          marginTop: 4,
          paddingVertical: 14,
          borderRadius: 14,
          backgroundColor: `${colors.error}14`,
          borderWidth: 1,
          borderColor: colors.error,
        },
        logoutText: { fontSize: 15, fontWeight: '800', color: colors.error },

        about: { alignItems: 'center', marginTop: 26, paddingHorizontal: 24 },
        aboutSchool: { fontSize: 12.5, color: colors.textSecondary, textAlign: 'center' },
        aboutSchoolName: { fontSize: 15, fontWeight: '700', color: colors.primary, textAlign: 'center', marginTop: 4 },
        aboutDivider: { width: 50, height: 2, borderRadius: 2, backgroundColor: colors.secondary, marginVertical: 14 },
        aboutText: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
        aboutVersion: { fontSize: 11.5, color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
      }),
    [colors]
  );

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.header}
        >
          <View style={s.headerIcon}>
            <MaterialCommunityIcons name="cog-outline" size={32} color={colors.white} />
          </View>
          <Text style={s.headerTitle}>Configuración</Text>
          <Text style={s.headerSubtitle}>Tu cuenta, la apariencia y los datos de la app</Text>
        </LinearGradient>

        <View style={s.account}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{inicialesDe(perfil?.nombre, perfil?.apellido)}</Text>
          </View>
          <View style={s.accountTexts}>
            <Text style={s.accountName}>{nombreCompleto}</Text>
            <Text style={s.accountMeta} numberOfLines={1}>
              {perfil?.email || 'Sin correo asociado'}
            </Text>
            <View style={s.accountRole}>
              <MaterialCommunityIcons name={info.icon} size={13} color={colors.primary} />
              <Text style={s.accountRoleText}>{info.label}</Text>
            </View>
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <MaterialCommunityIcons name="palette-outline" size={17} color={colors.primary} />
            <Text style={s.sectionTitle}>APARIENCIA</Text>
          </View>

          <View style={s.item}>
            <MaterialCommunityIcons name={isDarkMode ? 'weather-night' : 'white-balance-sunny'} size={20} color={colors.primary} />
            <View style={s.itemTexts}>
              <Text style={s.itemLabel}>Modo oscuro</Text>
              <Text style={s.itemDesc}>Alterna entre el tema claro y el tema oscuro de la aplicación</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={isDarkMode ? colors.primary : colors.textSecondary}
              ios_backgroundColor={colors.border}
            />
          </View>
        </View>

        <View style={s.section}>
          <View style={s.sectionHeader}>
            <MaterialCommunityIcons name="information-outline" size={17} color={colors.primary} />
            <Text style={s.sectionTitle}>ACERCA DE</Text>
          </View>

          <View style={[s.item, s.itemBorder]}>
            <View style={s.itemIcon}>
              <MaterialCommunityIcons name="school-outline" size={19} color={colors.primary} />
            </View>
            <View style={s.itemTexts}>
              <Text style={s.itemLabel}>Institución</Text>
              <Text style={s.itemDesc}>{ESCUELA}</Text>
            </View>
          </View>

          <View style={s.item}>
            <View style={s.itemIcon}>
              <MaterialCommunityIcons name="cloud-check-outline" size={19} color={colors.primary} />
            </View>
            <View style={s.itemTexts}>
              <Text style={s.itemLabel}>Datos sincronizados</Text>
              <Text style={s.itemDesc}>
                La información del sistema se lee directamente de Firebase Authentication y Firestore
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={s.logout} onPress={handleSalir}>
          <MaterialCommunityIcons name="logout" size={18} color={colors.error} />
          <Text style={s.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <View style={s.about}>
          <Text style={s.aboutSchool}>Escuela de Educación Secundaria</Text>
          <Text style={s.aboutSchoolName}>Técnica Nº 3 "S.A. de Padrón"</Text>
          <View style={s.aboutDivider} />
          <Text style={s.aboutText}>© {new Date().getFullYear()} · Sistema de Asistencia Escolar</Text>
          <Text style={s.aboutVersion}>
            {appInfo?.expo?.name ?? 'centinela-system'} · versión {appInfo?.expo?.version ?? '1.0.0'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
