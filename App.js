import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import DialogHost from './src/components/DialogHost';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar style="light" />
        <AppNavigator />
        {/* Diálogos globales (Alert.alert no funciona en web) */}
        <DialogHost />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
