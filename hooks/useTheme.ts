import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { lightTheme, darkTheme, Theme } from '@/lib/theme';

export function useTheme(): Theme {
  const { mode } = useThemeStore();
  const systemColorScheme = useColorScheme();
  
  // Determine the effective theme mode
  const effectiveMode = mode === 'system' ? systemColorScheme : mode;
  
  // Return the appropriate theme
  return effectiveMode === 'dark' ? darkTheme : lightTheme;
}

export function useThemeMode() {
  const { mode, setMode, toggleMode } = useThemeStore();
  return { mode, setMode, toggleMode };
} 