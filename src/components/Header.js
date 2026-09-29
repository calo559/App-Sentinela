import { View, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import typography from '../theme/typography';

export default function Header({ title, subtitle, rightElement }) {
  const { colors } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.background }}>
      <View style={{ flex: 1 }}>
        <Text style={{ ...typography.h2, color: colors.text }}>{title}</Text>
        {subtitle && <Text style={{ ...typography.caption, marginTop: 2, color: colors.textSecondary }}>{subtitle}</Text>}
      </View>
      {rightElement && <View>{rightElement}</View>}
    </View>
  );
}
