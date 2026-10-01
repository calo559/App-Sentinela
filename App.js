import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import DialogHost from './src/components/DialogHost';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <AppNavigator />
          <DialogHost />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
