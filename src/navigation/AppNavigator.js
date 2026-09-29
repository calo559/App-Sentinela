import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SCREENS } from '../utils/constants';
import { tabsForRole } from '../utils/roles';
import { getActiveUser } from '../services/authService';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import PerfilAlumnoScreen from '../screens/PerfilAlumnoScreen';
import PerfilDocenteScreen from '../screens/PerfilDocenteScreen';
import PerfilPreceptorScreen from '../screens/PerfilPreceptorScreen';
import HomeScreen from '../screens/HomeScreen';
import EventsScreen from '../screens/EventsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import QrScannerScreen from '../screens/QrScannerScreen';
import BoletinScreen from '../screens/BoletinScreen';
import EditarPerfilScreen from '../screens/EditarPerfilScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Íconos vectoriales de la barra (sin emojis)
const icons = {
  [SCREENS.HOME]: ['home', 'home-outline'],
  [SCREENS.EVENTS]: ['bell', 'bell-outline'],
  [SCREENS.PROFILE]: ['account', 'account-outline'],
  [SCREENS.BOLETIN]: ['clipboard-text', 'clipboard-text-outline'],
  [SCREENS.QR_SCANNER]: ['qrcode-scan', 'qrcode-scan'],
};

// Etiquetas con acentos (el nombre de la ruta no puede llevarlos)
const labels = {
  [SCREENS.BOLETIN]: 'Boletín',
};

function TabLabel({ label, focused }) {
  const { colors } = useTheme();
  return (
    <Text style={{ fontSize: 10, color: focused ? colors.primary : colors.textSecondary }}>
      {labels[label] || label}
    </Text>
  );
}

function TabIcon({ name, focused, color }) {
  const [activeIcon, inactiveIcon] = icons[name] || ['file-outline', 'file-outline'];
  return (
    <MaterialCommunityIcons name={focused ? activeIcon : inactiveIcon} size={22} color={color} />
  );
}

// Glifo QR dibujado con Views (sin dependencias extra):
// 3 "ojos" como los de un QR real + módulos de datos → intuitivo de un vistazo
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

  const Dot = () => (
    <View style={{ width: dot, height: dot, backgroundColor: color }} />
  );

  return (
    <View style={{ width: size, height: size, justifyContent: 'space-between' }}>
      {/* fila superior: ojo izquierdo + ojo derecho */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Eye />
        <Eye />
      </View>
      {/* fila inferior: ojo izquierdo + módulos de datos */}
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

// Botón circular elevado al centro de la barra (el "escanear" estilo Mercado Pago)
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
      <QrGlyph size={24} color={colors.onPrimary || '#0B1628'} />
    </View>
  );
}

const tabComponents = {
  [SCREENS.HOME]: HomeScreen,
  [SCREENS.EVENTS]: EventsScreen,
  [SCREENS.PROFILE]: ProfileScreen,
  [SCREENS.BOLETIN]: BoletinScreen,
  [SCREENS.QR_SCANNER]: QrScannerScreen,
};

function MainTabs() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const role = getActiveUser()?.role;
  const allowedTabs = tabsForRole(role);
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) =>
          route.name === SCREENS.QR_SCANNER ? (
            <QrCenterButton focused={focused} />
          ) : (
            <TabIcon name={route.name} focused={focused} color={color} />
          ),
        // El botón central muestra su propio ícono y la etiqueta "QR" debajo
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
              QR
            </Text>
          ) : (
            <TabLabel label={route.name} focused={focused} />
          ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
          overflow: 'visible', // deja que el círculo sobresalga por arriba
        },
      })}
    >
      {allowedTabs.map((name) => (
        <Tab.Screen key={name} name={name} component={tabComponents[name]} />
      ))}
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name={SCREENS.LOGIN} component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="PerfilAlumno" component={PerfilAlumnoScreen} />
          <Stack.Screen name="PerfilDocente" component={PerfilDocenteScreen} />
          <Stack.Screen name="PerfilPreceptor" component={PerfilPreceptorScreen} />
          {/* Configuración vive dentro de Perfil (ya no es una pestaña) */}
          <Stack.Screen name={SCREENS.SETTINGS} component={SettingsScreen} />
          {/* Edición de perfil (misma lógica que Configuración) */}
          <Stack.Screen name="EditarPerfil" component={EditarPerfilScreen} />
          <Stack.Screen name="Home" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}