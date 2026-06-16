import { View, ActivityIndicator, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import typography from '../theme/typography';

export default function Loading({ message = 'Cargando...' }) {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ ...typography.body, color: colors.textSecondary, marginTop: 12 }}>{message}</Text>
    </View>
  );
}
