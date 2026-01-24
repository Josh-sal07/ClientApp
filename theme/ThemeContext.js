// theme/ThemeContext.js
import { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemTheme = useColorScheme(); // light | dark
  const [mode, setMode] = useState("system"); // system | light | dark

  const theme =
    mode === "system" ? systemTheme : mode;

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
