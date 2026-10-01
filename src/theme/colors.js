// theme/colors.js
// Paleta institucional - Escuela Técnica Nº 3 "S.A. de Padrón".
// `lightColors` conserva la identidad verde/dorada original del proyecto.
// `darkColors` agrega un modo oscuro coherente para el ThemeContext.
// El export default sigue siendo la paleta clara para no romper las pantallas
// que importan `colors` de forma estática.

export const lightColors = {
  // Colores institucionales
  primary: "#2E7D32",
  primaryDark: "#1B5E20",
  primaryLight: "#4CAF50",
  secondary: "#FFD700",
  secondaryDark: "#FFC107",

  // Superficies y texto
  background: "#F5F5F5",
  surface: "#FFFFFF",
  surfaceVariant: "#E8F5E9",
  text: "#212121",
  textSecondary: "#757575",
  textLight: "#FFFFFF",
  onPrimary: "#FFFFFF",

  // Bordes
  border: "#E0E0E0",
  borderLight: "#EEEEEE",

  // Degradados
  gradientStart: "#1B5E20",
  gradientEnd: "#388E3C",
  accent: "#2E7D32",

  // Estados
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#D32F2F",
  info: "#2196F3",
  violet: "#7E57C2",

  white: "#FFFFFF",
  black: "#000000",
};

export const darkColors = {
  primary: "#4CAF50",
  primaryDark: "#2E7D32",
  primaryLight: "#81C784",
  secondary: "#FFD700",
  secondaryDark: "#FFC107",

  background: "#101C12",
  surface: "#16281A",
  surfaceVariant: "#1E3322",
  text: "#E8F5E9",
  textSecondary: "#A5C2A8",
  textLight: "#FFFFFF",
  onPrimary: "#0B1628",

  border: "#28402C",
  borderLight: "#3A5A3F",

  gradientStart: "#1B5E20",
  gradientEnd: "#4CAF50",
  accent: "#4CAF50",

  success: "#66BB6A",
  warning: "#FFB300",
  error: "#EF5350",
  info: "#42A5F5",
  violet: "#B39DDB",

  white: "#FFFFFF",
  black: "#000000",
};

export default lightColors;
