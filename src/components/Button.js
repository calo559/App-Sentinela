import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import typography from '../theme/typography';

export default function Button({ title, onPress, variant = 'primary', loading, disabled, style }) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
        isPrimary ? { backgroundColor: colors.primary } : { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.primary },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.white : colors.primary} />
      ) : (
        <Text style={[{ ...typography.button }, isPrimary ? { color: colors.white } : { color: colors.primary }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
