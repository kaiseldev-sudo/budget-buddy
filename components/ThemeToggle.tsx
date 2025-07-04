import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeMode } from '@/hooks/useTheme';
import { Sun, Moon } from 'lucide-react-native';

interface ThemeToggleProps {
  size?: number;
}

export function ThemeToggle({ size = 24 }: ThemeToggleProps) {
  const theme = useTheme();
  const { mode, toggleMode } = useThemeMode();
  
  // Determine if we're in dark mode
  const isDark = theme.background === '#111827';
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: theme.surfaceSecondary }
      ]}
      onPress={toggleMode}
      activeOpacity={0.7}
    >
      {isDark ? (
        <Sun size={size} color={theme.textPrimary} />
      ) : (
        <Moon size={size} color={theme.textPrimary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 