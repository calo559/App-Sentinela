// Encabezado de marca compartido por Login y Registro (sobre el fondo degradado)
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function AuthBrand() {
  return (
    <View style={s.wrap}>
      <LinearGradient
        colors={['#00C9DB', '#6B3FA0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.logo}
      >
        <MaterialCommunityIcons name="shield-check" size={32} color="#FFFFFF" />
      </LinearGradient>

      <Text style={s.title}>ESCUELA TÉCNICA Nº 3</Text>
      <Text style={s.subtitle}>S.A. de Padrón</Text>

      <View style={s.divider} />

      <Text style={s.app}>SIA · Sistema de Asistencia Escolar</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 28 },
  logo: {
    width: 66,
    height: 66,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#00C9DB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  divider: {
    width: 44,
    height: 2,
    backgroundColor: '#00C9DB',
    borderRadius: 2,
    marginTop: 14,
    marginBottom: 12,
    opacity: 0.9,
  },
  app: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
