import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ROLES, courses } from '../services/firestore';
import { infoRol } from '../utils/roles';
import { notify } from '../utils/notify';
import { SCREENS } from '../utils/constants';

const inicialesDe = (nombre, apellido) => {
  const primero = (nombre ?? '').trim().charAt(0);
  const segundo = (apellido ?? '').trim().charAt(0);
  const inicial = `${primero}${segundo}`.toUpperCase();
  return inicial || '?';
};

const fila = (icon, label, value) => ({ icon, label, value });

export default function ProfileScreen({ navigation }) {
  const { perfil, rol, salir, recargarPerfil } = useAuth();
  const { colors } = useTheme();
  const [cursoPreceptor, setCursoPreceptor] = useState(null);

  useFocusEffect(
    useCallback(() => {
      recargarPerfil?.();
    }, [recargarPerfil])
  );

  useEffect(() => {
    let vigente = true;

    if (rol !== ROLES.PRECEPTOR || !perfil?.cursoId) {
      setCursoPreceptor(null);
      return () => {
        vigente = false;
      };
    }

    courses
      .obtenerCurso(perfil.cursoId)
      .then((curso) => {
        if (vigente) setCursoPreceptor(curso);
      })
      .catch(() => {
        if (vigente) setCursoPreceptor(null);
      });

    return () => {
      vigente = false;
    };
  }, [rol, perfil?.cursoId]);

  const info = infoRol(rol);

  const nombreCompleto = useMemo(
    () => [perfil?.nombre, perfil?.apellido].filter(Boolean).join(' ').trim() || 'Usuario',
    [perfil?.nombre, perfil?.apellido]
  );

  const filas = useMemo(() => {
    const base = [
      fila('account-outline', 'Nombre y apellido', nombreCompleto),
      fila('email-outline', 'Correo electrónico', perfil?.email || '—'),
      fila('shield-account-outline', 'Rol en la institución', info.label),
    ];

    if (perfil?.dni) base.push(fila('card-account-details-outline', 'DNI', perfil.dni));
    if (perfil?.telefono) base.push(fila('phone-outline', 'Teléfono', perfil.telefono));

    if (rol === ROLES.ALUMNO) {
      base.push(fila('school-outline', 'Curso', perfil?.cursoNombre ?? perfil?.curso ?? 'Sin curso asignado'));
      base.push(fila('door-open', 'División', perfil?.division ?? 'Sin división asignada'));
      const legajo = perfil?.alumno?.legajo;
      base.push(fila('identifier', legajo ? 'Legajo' : 'ID de alumno', legajo || perfil?.alumnoId || '—'));
    }

    if (rol === ROLES.PROFESOR) {
      if (perfil?.anio) base.push(fila('calendar-range', 'Año que dicta', `${perfil.anio}°`));
      const materias = (perfil?.materias ?? []).map((materia) => materia?.nombre).filter(Boolean);
      base.push(
        fila(
          'book-open-page-variant-outline',
          'Materias a cargo',
          materias.length ? materias.join(', ') : 'Sin materias asignadas'
        )
      );
      base.push(fila('certificate-outline', 'Título profesional', perfil?.titulo || 'Sin título cargado'));
    }

    if (rol === ROLES.PRECEPTOR) {
      const curso = cursoPreceptor?.nombre ?? perfil?.cursoId ?? null;
      base.push(fila('clipboard-account-outline', 'Curso a cargo', curso || 'Sin curso asignado'));
    }

    if (rol === ROLES.DIRECTIVO || rol === ROLES.ADMIN) {
      base.push(
        fila(
          'key-variant',
          'Permisos',
          rol === ROLES.ADMIN
            ? 'Acceso completo a la configuración del sistema'
            : 'Acceso a la información institucional de todos los cursos'
        )
      );
    }

    return base;
  }, [perfil, rol, info.label, nombreCompleto, cursoPreceptor]);

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
        header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
        headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
        headerSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
        scroll: { paddingBottom: 32 },
        avatarWrap: { alignItems: 'center', marginVertical: 22 },
        avatar: {
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 3,
          borderColor: colors.surface,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.14,
          shadowRadius: 5,
          elevation: 3,
        },
        avatarText: { fontSize: 38, fontWeight: '800', color: colors.onPrimary },
        nombre: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 14, textAlign: 'center' },
        badge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          marginTop: 8,
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: `${colors.primary}1A`,
        },
        badgeText: { fontSize: 12.5, fontWeight: '700', color: colors.primary },
        institucion: { fontSize: 12, color: colors.textSecondary, marginTop: 10, textAlign: 'center' },
        card: {
          marginHorizontal: 16,
          marginTop: 4,
          backgroundColor: colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 4,
        },
        row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, gap: 12 },
        rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.borderLight },
        rowIcon: { marginTop: 2 },
        rowTexts: { flex: 1 },
        rowLabel: { fontSize: 12.5, color: colors.textSecondary },
        rowValue: { fontSize: 15, fontWeight: '600', color: colors.text, marginTop: 2 },
        buttons: { paddingHorizontal: 16, marginTop: 22, gap: 12 },
        edit: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: `${colors.primary}14`,
          paddingVertical: 13,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.primary,
        },
        editText: { fontSize: 15, fontWeight: '700', color: colors.primary },
        logout: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: `${colors.error}14`,
          paddingVertical: 13,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.error,
        },
        logoutText: { fontSize: 15, fontWeight: '700', color: colors.error },
        footer: { alignItems: 'center', marginTop: 26 },
        footerText: { fontSize: 12, color: colors.textSecondary },
        footerSubtext: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
      }),
    [colors]
  );

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Mi Perfil</Text>
        <Text style={s.headerSubtitle}>Información personal y académica</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.avatarWrap}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{inicialesDe(perfil?.nombre, perfil?.apellido)}</Text>
          </View>
          <Text style={s.nombre}>{nombreCompleto}</Text>
          <View style={s.badge}>
            <MaterialCommunityIcons name={info.icon} size={15} color={colors.primary} />
            <Text style={s.badgeText}>{info.label}</Text>
          </View>
          <Text style={s.institucion}>Escuela Técnica Nº 3 "S.A. de Padrón"</Text>
        </View>

        <View style={s.card}>
          {filas.map((item, index) => (
            <View key={item.label} style={[s.row, index < filas.length - 1 && s.rowBorder]}>
              <MaterialCommunityIcons
                name={item.icon}
                size={18}
                color={colors.primary}
                style={s.rowIcon}
              />
              <View style={s.rowTexts}>
                <Text style={s.rowLabel}>{item.label}</Text>
                <Text style={s.rowValue}>{item.value ?? '—'}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={s.buttons}>
          <TouchableOpacity style={s.edit} onPress={() => navigation.navigate(SCREENS.EDITAR_PERFIL)}>
            <MaterialCommunityIcons name="account-edit-outline" size={18} color={colors.primary} />
            <Text style={s.editText}>Editar perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.edit} onPress={() => navigation.navigate(SCREENS.SETTINGS)}>
            <MaterialCommunityIcons name="cog-outline" size={18} color={colors.primary} />
            <Text style={s.editText}>Configuración</Text>
          </TouchableOpacity>

          {rol === ROLES.ADMIN && (
            <TouchableOpacity style={s.edit} onPress={() => navigation.navigate(SCREENS.USUARIOS)}>
              <MaterialCommunityIcons name="account-group-outline" size={18} color={colors.primary} />
              <Text style={s.editText}>Usuarios</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={s.logout} onPress={handleSalir}>
            <MaterialCommunityIcons name="logout" size={18} color={colors.error} />
            <Text style={s.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Sistema de Asistencia Escolar</Text>
          <Text style={s.footerSubtext}>Escuela Técnica Nº 3 "S.A. de Padrón"</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
