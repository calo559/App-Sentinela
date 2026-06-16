import { createContext, useContext, useState, useMemo } from "react";
import { lightColors, darkColors } from "../theme/colors";

const ThemeContext = createContext({
  isDarkMode: false,
  toggleDarkMode: () => {},
  colors: lightColors,
});

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const value = useMemo(
    () => ({
      isDarkMode,
      toggleDarkMode,
      colors: isDarkMode ? darkColors : lightColors,
    }),
    [isDarkMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
