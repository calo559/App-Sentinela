import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { SCREENS } from '../utils/constants';
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

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const icons = {
  [SCREENS.HOME]: '🏠',
  [SCREENS.EVENTS]: '🔔',
  [SCREENS.PROFILE]: '👤',
  [SCREENS.SETTINGS]: '⚙️',
  [SCREENS.QR_SCANNER]: '📷',
};

function TabLabel({ label, focused }) {
  const { colors } = useTheme();
  return <Text style={{ fontSize: 10, color: focused ? colors.primary : colors.textSecondary }}>{label}</Text>;
}

function TabIcon({ name, focused }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icons[name] || '📄'}</Text>;
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
        tabBarLabel: ({ focused }) => <TabLabel label={route.name} focused={focused} />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom,
        },
      })}
    >
      <Tab.Screen name={SCREENS.HOME} component={HomeScreen} />
      <Tab.Screen name={SCREENS.EVENTS} component={EventsScreen} />
      <Tab.Screen name={SCREENS.PROFILE} component={ProfileScreen} />
      <Tab.Screen name={SCREENS.SETTINGS} component={SettingsScreen} />
      <Tab.Screen name={SCREENS.QR_SCANNER} component={QrScannerScreen} />
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
          <Stack.Screen name="Home" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}