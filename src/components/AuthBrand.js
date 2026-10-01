import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function AuthBrand({
  title = 'ESCUELA TÉCNICA Nº 3',
  subtitle = '"S.A. de Padrón"',
  tagline = 'Sistema de Asistencia Escolar',
  compact = false,
}) {
  const { colors } = useTheme();

  const s = useMemo(
    () =>
      StyleSheet.create({
        wrap: { alignItems: 'center', marginBottom: compact ? 16 : 24 },
        badge: {
          width: compact ? 54 : 66,
          height: compact ? 54 : 66,
          borderRadius: compact ? 16 : 18,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
          shadowColor: colors.black,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
          elevation: 8,
        },
        title: {
          fontSize: compact ? 16 : 19,
          fontWeight: '800',
          color: colors.white,
          letterSpacing: 1.4,
          textAlign: 'center',
        },
        subtitle: {
          fontSize: compact ? 12 : 13,
          color: colors.white,
          opacity: 0.85,
          fontWeight: '600',
          marginTop: 4,
          textAlign: 'center',
          letterSpacing: 0.4,
        },
        divider: {
          width: 44,
          height: 2,
          backgroundColor: colors.secondary,
          borderRadius: 2,
          marginTop: 14,
          marginBottom: 12,
        },
        tagline: {
          fontSize: 11,
          color: colors.white,
          opacity: 0.75,
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          textAlign: 'center',
        },
      }),
    [colors, compact]
  );

  return (
    <View style={s.wrap}>
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.badge}
      >
        <MaterialCommunityIcons name="shield-check" size={compact ? 26 : 32} color={colors.white} />
      </LinearGradient>

      <Text style={s.title}>{title}</Text>
      <Text style={s.subtitle}>{subtitle}</Text>

      {!compact ? (
        <>
          <View style={s.divider} />
          <Text style={s.tagline}>{tagline}</Text>
        </>
      ) : null}
    </View>
  );
}
