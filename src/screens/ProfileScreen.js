import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import colors from '../theme/colors';
import typography from '../theme/typography';
import Card from '../components/Card';
import Header from '../components/Header';

// Datos de usuario según rol escolar
// Esto debería venir de un contexto/auth en la realidad
const user = { 
  name: 'María González', 
  email: 'maria.gonzalez@tecnica3.edu.ar', 
  role: 'Preceptora', 
  phone: '+54 11 2345-6789',
  course: '3° A, 3° B, 4° C',
  employeeId: 'T3-PRE-001',
  joinDate: 'Marzo 2020'
};

const infoRows = [
  { label: 'Nombre completo', value: user.name },
  { label: 'Correo electrónico', value: user.email },
  { label: 'Rol', value: user.role },
  { label: 'Teléfono', value: user.phone },
  { label: 'Cursos a cargo', value: user.course },
  { label: 'Legajo', value: user.employeeId },
  { label: 'Fecha de ingreso', value: user.joinDate },
];

export default function ProfileScreen({ navigation }) {
  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, cerrar sesión', onPress: () => {
          // Aquí iría la lógica de logout
          Alert.alert('Éxito', 'Sesión cerrada correctamente');
          // navigation.replace('Login');
        }},
      ]
    );
  };

  const handleEditProfile = () => {
    Alert.alert('Editar perfil', 'Esta funcionalidad estará disponible próximamente.');
  };

  return (
    <View style={styles.container}>
      <Header title="Mi Perfil" subtitle="Información personal y académica" />
      
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name[0]}</Text>
        </View>
        <Text style={styles.userRole}>{user.role}</Text>
        <Text style={styles.userInstitution}>Escuela Técnica N°3 - Padaria</Text>
      </View>
      
      <Card style={styles.infoCard}>
        {infoRows.map((row, index) => (
          <View key={row.label} style={[styles.row, index < infoRows.length - 1 && styles.border]}>
            <Text style={styles.label}>{row.label}</Text>
            <Text style={styles.value}>{row.value}</Text>
          </View>
        ))}
      </Card>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <Text style={styles.editButtonText}>Editar perfil</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Sistema de Asistencia Escolar v1.0</Text>
        <Text style={styles.versionSubtext}>Escuela Técnica N°3 - Padaria</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.background 
  },
  avatarContainer: { 
    alignItems: 'center', 
    marginVertical: 24 
  },
  avatar: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: colors.primary, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarText: { 
    fontSize: 40, 
    fontWeight: '700', 
    color: colors.white 
  },
  userRole: {
    ...typography.h3,
    color: colors.primary,
    marginTop: 12,
    fontWeight: '600',
  },
  userInstitution: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 4,
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: 14 
  },
  border: { 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border 
  },
  label: { 
    ...typography.body, 
    color: colors.textSecondary,
    flex: 0.4,
  },
  value: { 
    ...typography.body, 
    fontWeight: '600', 
    color: colors.text,
    flex: 0.6,
    textAlign: 'right',
  },
  buttonsContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 12,
  },
  editButton: {
    backgroundColor: colors.primary + '10',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editButtonText: {
    ...typography.button,
    color: colors.primary,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: colors.error + '10',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutButtonText: {
    ...typography.button,
    color: colors.error,
    fontWeight: '600',
  },
  versionContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  versionText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  versionSubtext: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
});