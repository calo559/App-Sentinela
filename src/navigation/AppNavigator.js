import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SCREENS } from '../utils/constants';
import { tabsForRole } from '../utils/roles';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import EventsScreen from '../screens/EventsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditarPerfilScreen from '../screens/EditarPerfilScreen';
import QrScannerScreen from '../screens/QrScannerScreen';
import BoletinScreen from '../screens/BoletinScreen';
import UsuariosScreen from '../screens/UsuariosScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  [SCREENS.HOME]: ['home', 'home-outline'],
  [SCREENS.EVENTS]: ['bell', 'bell-outline'],
  [SCREENS.PROFILE]: ['account', 'account-outline'],
  [SCREENS.BOLETIN]: ['clipboard-text', 'clipboard-text-outline'],
  [SCREENS.QR_SCANNER]: ['qrcode-scan', 'qrcode-scan'],
};

const TAB_LABELS = {
  [SCREENS.HOME]: 'Inicio',
  [SCREENS.EVENTS]: 'Eventos',
  [SCREENS.PROFILE]: 'Perfil',
  [SCREENS.BOLETIN]: 'Boletín',
  [SCREENS.QR_SCANNER]: 'QR',
};

const TAB_COMPONENTS = {
  [SCREENS.HOME]: HomeScreen,
  [SCREENS.EVENTS]: EventsScreen,
  [SCREENS.PROFILE]: ProfileScreen,
  [SCREENS.BOLETIN]: BoletinScreen,
  [SCREENS.QR_SCANNER]: QrScannerScreen,
};

// Glifo QR dibujado con Views (3 "ojos" + módulos), sin dependencias extra.
function QrGlyph({ size = 24, color = '#0B1628' }) {
  const eyeSize = size * 0.34;
  const border = Math.max(2, Math.round(size * 0.085));
  const inner = Math.max(2, Math.round(eyeSize * 0.34));
  const dot = Math.max(3, Math.round(size * 0.12));
  const gap = Math.max(2, Math.round(size * 0.08));

  const Eye = () => (
    <View
      style={{
        width: eyeSize,
        height: eyeSize,
        borderWidth: border,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ width: inner, height: inner, backgroundColor: color }} />
    </View>
  );

  const Dot = () => <View style={{ width: dot, height: dot, backgroundColor: color }} />;

  return (
    <View style={{ width: size, height: size, justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Eye />
        <Eye />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Eye />
        <View style={{ flexDirection: 'column', gap }}>
          <View style={{ flexDirection: 'row', gap }}>
            <Dot />
            <Dot />
          </View>
          <View style={{ flexDirection: 'row', gap }}>
            <Dot />
            <Dot />
          </View>
        </View>
      </View>
    </View>
  );
}

// Botón circular elevado al centro de la barra (pestaña "escanear" del alumno).
function QrCenterButton({ focused }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: 54,
        height: 54,
        borderRadius: 27,
        marginTop: -20,
        backgroundColor: colors.primary,
        borderWidth: 3,
        borderColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: focused ? 1 : 0.92,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
      }}
    >
      <QrGlyph size={24} color={colors.onPrimary || '#FFFFFF'} />
    </View>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { rol } = useAuth();
  const allowed = tabsForRole(rol);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) =>
          route.name === SCREENS.QR_SCANNER ? (
            <QrCenterButton focused={focused} />
          ) : (
            <MaterialCommunityIcons
              name={focused ? TAB_ICONS[route.name]?.[0] : TAB_ICONS[route.name]?.[1]}
              size={22}
              color={color}
            />
          ),
        tabBarLabel: ({ focused }) =>
          route.name === SCREENS.QR_SCANNER ? (
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 0.5,
                color: focused ? colors.primary : colors.textSecondary,
              }}
            >
              {TAB_LABELS[route.name]}
            </Text>
          ) : (
            <Text style={{ fontSize: 10, color: focused ? colors.primary : colors.textSecondary }}>
              {TAB_LABELS[route.name] || route.name}
            </Text>
          ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          overflow: 'visible',
        },
      })}
    >
      {allowed.map((name) => (
        <Tab.Screen key={name} name={name} component={TAB_COMPONENTS[name]} />
      ))}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { colors } = useTheme();
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.splashText, { color: colors.textSecondary }]}>Cargando…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {usuario ? (
          <>
            <Stack.Screen name={SCREENS.HOME} component={MainTabs} />
            <Stack.Screen name={SCREENS.SETTINGS} component={SettingsScreen} />
            <Stack.Screen name={SCREENS.EDITAR_PERFIL} component={EditarPerfilScreen} />
            <Stack.Screen name={SCREENS.USUARIOS} component={UsuariosScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name={SCREENS.LOGIN} component={LoginScreen} />
            <Stack.Screen name={SCREENS.REGISTER} component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  splashText: { fontSize: 14 },
});
