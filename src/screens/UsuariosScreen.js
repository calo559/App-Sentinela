import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ROLES, users } from '../services/firestore';
import { infoRol } from '../utils/roles';

const TODOS = 'todos';

const FILTROS = [
  { key: TODOS, label: 'Todos', icon: 'account-group-outline' },
  { key: ROLES.ALUMNO, label: 'Alumnos', icon: 'school-outline' },
  { key: ROLES.PROFESOR, label: 'Docentes', icon: 'human-male-board' },
  { key: ROLES.PRECEPTOR, label: 'Preceptores', icon: 'clipboard-text-outline' },
  { key: ROLES.DIRECTIVO, label: 'Directivos', icon: 'account-tie-outline' },
  { key: ROLES.ADMIN, label: 'Administradores', icon: 'shield-account-outline' },
];

const inicialesDe = (nombre, apellido) => {
  const inicial = `${(nombre ?? '').trim().charAt(0)}${(apellido ?? '').trim().charAt(0)}`.toUpperCase();
  return inicial || '?';
};

const nombreCompleto = (cuenta) =>
  [cuenta?.nombre, cuenta?.apellido].filter(Boolean).join(' ').trim() || cuenta?.email || 'Usuario';

export default function UsuariosScreen() {
  const { colors } = useTheme();
  const { rol } = useAuth();
  const esAdmin = rol === ROLES.ADMIN;

  const [cuentas, setCuentas] = useState([]);
  const [filtroRol, setFiltroRol] = useState(TODOS);
  const [soloActivos, setSoloActivos] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);

  const cargar = useCallback(
    async ({ refresco = false } = {}) => {
      if (!esAdmin) {
        setCargando(false);
        return;
      }
      if (refresco) setRefrescando(true);
      else setCargando(true);
      try {
        const lista = await users.listarUsuarios();
        setCuentas(lista);
        setError(null);
      } catch (err) {
        setError(err?.message ?? 'No se pudieron cargar los usuarios.');
      } finally {
        setCargando(false);
        setRefrescando(false);
      }
    },
    [esAdmin]
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  const visibles = useMemo(
    () =>
      cuentas.filter((cuenta) => {
        if (filtroRol !== TODOS && cuenta.rol !== filtroRol) return false;
        if (soloActivos && cuenta.activo !== true) return false;
        return true;
      }),
    [cuentas, filtroRol, soloActivos]
  );

  const conteoPorRol = useMemo(() => {
    const mapa = { [TODOS]: cuentas.length };
    cuentas.forEach((cuenta) => {
      mapa[cuenta.rol] = (mapa[cuenta.rol] ?? 0) + 1;
    });
    return mapa;
  }, [cuentas]);

  const s = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.background },
        header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
        headerTitle: { fontSize: 22, fontWeight: '800', color: colors.text },
        headerSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
        filtros: { paddingHorizontal: 16, paddingTop: 12 },
        chip: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 7,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          marginRight: 8,
        },
        chipActivo: { borderColor: colors.primary, backgroundColor: `${colors.primary}1F` },
        chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
        chipTextActivo: { color: colors.primary, fontWeight: '800' },
        chipBadge: { fontSize: 11, fontWeight: '800', color: colors.textSecondary },
        chipBadgeActivo: { color: colors.primary },
        controles: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 4,
        },
        toggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        toggleText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
        toggleBox: {
          width: 20,
          height: 20,
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        toggleBoxActivo: { borderColor: colors.primary, backgroundColor: colors.primary },
        total: { fontSize: 12.5, color: colors.textSecondary, fontWeight: '600' },
        lista: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32 },
        card: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          padding: 14,
          marginBottom: 10,
          borderRadius: 16,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        },
        avatar: {
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: colors.primary,
          alignItems: 'center',
          justifyContent: 'center',
        },
        avatarText: { fontSize: 17, fontWeight: '800', color: colors.onPrimary },
        info: { flex: 1 },
        nombre: { fontSize: 15.5, fontWeight: '700', color: colors.text },
        email: { fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
        badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
        badge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: 9,
          paddingVertical: 3,
          borderRadius: 999,
          backgroundColor: colors.surfaceVariant,
        },
        badgeText: { fontSize: 11, fontWeight: '700', color: colors.primary },
        badgeInactivo: { backgroundColor: `${colors.error}1A` },
        badgeInactivoText: { fontSize: 11, fontWeight: '700', color: colors.error },
        badgeVinculo: { backgroundColor: `${colors.info}1A` },
        badgeVinculoText: { fontSize: 11, fontWeight: '700', color: colors.info },
        centrado: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 10 },
        centradoText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 24 },
        restringido: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
          gap: 12,
        },
        restringidoTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
      }),
    [colors]
  );

  if (!esAdmin) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
        <View style={s.restringido}>
          <MaterialCommunityIcons name="lock-outline" size={40} color={colors.error} />
          <Text style={s.restringidoTitle}>Acceso restringido</Text>
          <Text style={s.centradoText}>
            La gestión de usuarios está disponible únicamente para el administrador.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderFiltro = (filtro) => {
    const activo = filtroRol === filtro.key;
    const cuenta = conteoPorRol[filtro.key] ?? 0;
    return (
      <TouchableOpacity
        key={filtro.key}
        activeOpacity={0.8}
        onPress={() => setFiltroRol(filtro.key)}
        style={[s.chip, activo && s.chipActivo]}
      >
        <MaterialCommunityIcons
          name={filtro.icon}
          size={15}
          color={activo ? colors.primary : colors.textSecondary}
        />
        <Text style={[s.chipText, activo && s.chipTextActivo]}>{filtro.label}</Text>
        <Text style={[s.chipBadge, activo && s.chipBadgeActivo]}>{cuenta}</Text>
      </TouchableOpacity>
    );
  };

  const renderCuenta = ({ item }) => {
    const info = infoRol(item.rol);
    const activo = item.activo !== false;
    return (
      <View style={s.card}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{inicialesDe(item.nombre, item.apellido)}</Text>
        </View>
        <View style={s.info}>
          <Text style={s.nombre}>{nombreCompleto(item)}</Text>
          <Text style={s.email} numberOfLines={1}>
            {item.email || 'Sin correo asociado'}
          </Text>
          <View style={s.badges}>
            <View style={s.badge}>
              <MaterialCommunityIcons name={info.icon} size={12} color={colors.primary} />
              <Text style={s.badgeText}>{info.label}</Text>
            </View>
            {activo ? (
              <View style={s.badge}>
                <MaterialCommunityIcons name="check-circle-outline" size={12} color={colors.primary} />
                <Text style={s.badgeText}>Activo</Text>
              </View>
            ) : (
              <View style={[s.badge, s.badgeInactivo]}>
                <MaterialCommunityIcons name="close-circle-outline" size={12} color={colors.error} />
                <Text style={s.badgeInactivoText}>Inactivo</Text>
              </View>
            )}
            {item.rol === ROLES.ALUMNO && (
              <View style={[s.badge, s.badgeVinculo]}>
                <MaterialCommunityIcons
                  name={item.alumnoId ? 'link-variant' : 'link-variant-off'}
                  size={12}
                  color={colors.info}
                />
                <Text style={s.badgeVinculoText}>
                  {item.alumnoId ? 'Ficha vinculada' : 'Sin ficha'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Usuarios</Text>
        <Text style={s.headerSubtitle}>Cuentas registradas en la institución</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filtros}
      >
        {FILTROS.map(renderFiltro)}
      </ScrollView>

      <View style={s.controles}>
        <TouchableOpacity
          style={s.toggle}
          activeOpacity={0.8}
          onPress={() => setSoloActivos((valor) => !valor)}
        >
          <View style={[s.toggleBox, soloActivos && s.toggleBoxActivo]}>
            {soloActivos && <MaterialCommunityIcons name="check" size={14} color={colors.onPrimary} />}
          </View>
          <Text style={s.toggleText}>Solo activos</Text>
        </TouchableOpacity>
        <Text style={s.total}>{visibles.length} de {cuentas.length}</Text>
      </View>

      {cargando ? (
        <View style={s.centrado}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.centradoText}>Cargando usuarios…</Text>
        </View>
      ) : error ? (
        <View style={s.centrado}>
          <MaterialCommunityIcons name="alert-circle-outline" size={36} color={colors.error} />
          <Text style={s.centradoText}>{error}</Text>
          <TouchableOpacity onPress={() => cargar()}>
            <Text style={[s.centradoText, { color: colors.primary, fontWeight: '700' }]}>
              Reintentar
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={visibles}
          keyExtractor={(item) => item.id}
          renderItem={renderCuenta}
          contentContainerStyle={s.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={() => cargar({ refresco: true })}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={s.centrado}>
              <MaterialCommunityIcons name="account-search-outline" size={36} color={colors.textSecondary} />
              <Text style={s.centradoText}>
                No hay usuarios que coincidan con el filtro seleccionado.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
