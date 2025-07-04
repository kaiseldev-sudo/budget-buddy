import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useThemeMode } from '@/hooks/useTheme';
import { ThemeMode } from '@/store/themeStore';
import { X, Sun, Moon, Monitor } from 'lucide-react-native';

interface ThemeModalProps {
  visible: boolean;
  onClose: () => void;
}

const themeOptions = [
  {
    id: 'light' as ThemeMode,
    title: 'Light',
    subtitle: 'Use light theme',
    icon: Sun,
    color: '#F59E0B',
  },
  {
    id: 'dark' as ThemeMode,
    title: 'Dark',
    subtitle: 'Use dark theme',
    icon: Moon,
    color: '#6B7280',
  },
  {
    id: 'system' as ThemeMode,
    title: 'System',
    subtitle: 'Follow system setting',
    icon: Monitor,
    color: '#3B82F6',
  },
];

export default function ThemeModal({ visible, onClose }: ThemeModalProps) {
  const theme = useTheme();
  const { mode, setMode } = useThemeMode();

  const handleThemeSelect = (selectedMode: ThemeMode) => {
    setMode(selectedMode);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Appearance</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Choose your preferred theme
          </Text>

          <View style={styles.optionsContainer}>
            {themeOptions.map((option) => {
              const IconComponent = option.icon;
              const isSelected = mode === option.id;
              
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    isSelected && { borderColor: theme.primary, backgroundColor: theme.surfaceSecondary }
                  ]}
                  onPress={() => handleThemeSelect(option.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionContent}>
                    <View style={[styles.optionIcon, { backgroundColor: option.color }]}>
                      <IconComponent size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.optionText}>
                      <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>
                        {option.title}
                      </Text>
                      <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>
                        {option.subtitle}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={[styles.selectedIndicator, { backgroundColor: theme.primary }]}>
                        <View style={styles.selectedDot} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.infoContainer}>
            <Text style={[styles.infoText, { color: theme.textTertiary }]}>
              The theme will be applied immediately and saved for future app launches.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  optionCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  infoContainer: {
    paddingVertical: 16,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    lineHeight: 20,
  },
}); 