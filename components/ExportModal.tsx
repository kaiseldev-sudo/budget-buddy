import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useTransactionStore } from '@/store/transactionStore';
import { useAuthStore } from '@/store/authStore';
import { exportService, ExportOptions } from '@/lib/exportService';
import { 
  X, 
  Save, 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  CheckSquare,
  Square,
  FileSpreadsheet,
  FileJson,
  Mail
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
}



export default function ExportModal({ visible, onClose }: ExportModalProps) {
  const theme = useTheme();
  const { transactions, budgets, categories } = useTransactionStore();
  const { user } = useAuthStore();
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    dateRange: 'all',
    includeTransactions: true,
    includeBudgets: true,
    includeCategories: true,
    includeSummary: true,
  });
  const [loading, setLoading] = useState(false);

  const updateOption = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value,
    }));
  };



  const handleExport = async () => {
    setLoading(true);
    try {
      // Prepare export data
      const exportData = exportService.prepareExportData(
        transactions,
        budgets,
        categories,
        user,
        exportOptions
      );

      let content: string;
      let filename: string;
      let mimeType: string;

      switch (exportOptions.format) {
        case 'csv':
          content = exportService.generateCSV(exportData.transactions);
          filename = exportService.getFilename('csv', exportOptions.dateRange);
          mimeType = exportService.getMimeType('csv');
          break;
        case 'json':
          content = exportService.generateJSON(exportData);
          filename = exportService.getFilename('json', exportOptions.dateRange);
          mimeType = exportService.getMimeType('json');
          break;
        case 'pdf':
          const html = exportService.generatePDFHTML(exportData);
          const pdfUri = await Print.printToFileAsync({ html });
          // PDF saved to device, user can access it from file manager
          Alert.alert('Success', 'PDF exported successfully! Check your device files.');
          setLoading(false);
          return;
        default:
          throw new Error('Unsupported format');
      }

      // Save file to device
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, content);

      // File saved to device, user can access it from file manager
      Alert.alert('Success', `File exported successfully! Check your device files.`);

      Alert.alert('Success', 'Data exported successfully!');
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderOption = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => (
    <TouchableOpacity
      style={[styles.optionItem, { borderBottomColor: theme.border }]}
      onPress={() => onValueChange(!value)}
    >
      <View style={styles.optionLeft}>
        <View style={[styles.optionIcon, { backgroundColor: theme.primary }]}>
          {icon}
        </View>
        <View style={styles.optionText}>
          <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>{title}</Text>
          <Text style={[styles.optionSubtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        </View>
      </View>
      {value ? (
        <CheckSquare size={24} color={theme.primary} />
      ) : (
        <Square size={24} color={theme.textTertiary} />
      )}
    </TouchableOpacity>
  );

  const renderFormatOption = (format: 'csv' | 'json' | 'pdf', icon: React.ReactNode, title: string) => (
    <TouchableOpacity
      style={[
        styles.formatOption,
        {
          backgroundColor: exportOptions.format === format ? theme.primary : theme.surfaceSecondary,
          borderColor: theme.border,
        }
      ]}
      onPress={() => updateOption('format', format)}
    >
      {icon}
      <Text style={[
        styles.formatOptionText,
        { color: exportOptions.format === format ? theme.textInverse : theme.textSecondary }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderDateRangeOption = (range: 'all' | 'month' | 'quarter' | 'year', title: string) => (
    <TouchableOpacity
      style={[
        styles.dateRangeOption,
        {
          backgroundColor: exportOptions.dateRange === range ? theme.primary : theme.surfaceSecondary,
          borderColor: theme.border,
        }
      ]}
      onPress={() => updateOption('dateRange', range)}
    >
      <Text style={[
        styles.dateRangeOptionText,
        { color: exportOptions.dateRange === range ? theme.textInverse : theme.textSecondary }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} disabled={loading}>
            <X size={24} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Export Data</Text>
          <TouchableOpacity onPress={handleExport} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Download size={24} color={theme.primary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Export Format */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Export Format</Text>
            <View style={styles.formatOptions}>
              {renderFormatOption('csv', <FileSpreadsheet size={20} color={theme.textInverse} />, 'CSV')}
              {renderFormatOption('json', <FileJson size={20} color={theme.textInverse} />, 'JSON')}
              {renderFormatOption('pdf', <FileText size={20} color={theme.textInverse} />, 'PDF')}
            </View>
          </View>

          {/* Date Range */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Date Range</Text>
            <View style={styles.dateRangeOptions}>
              {renderDateRangeOption('all', 'All Time')}
              {renderDateRangeOption('month', 'This Month')}
              {renderDateRangeOption('quarter', 'This Quarter')}
              {renderDateRangeOption('year', 'This Year')}
            </View>
          </View>

          {/* Export Options */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Include in Export</Text>
            {renderOption(
              <FileText size={20} color={theme.textInverse} />,
              'Transactions',
              'All your income and expense records',
              exportOptions.includeTransactions,
              (value) => updateOption('includeTransactions', value)
            )}
            {renderOption(
              <FileText size={20} color={theme.textInverse} />,
              'Budgets',
              'Your budget settings and limits',
              exportOptions.includeBudgets,
              (value) => updateOption('includeBudgets', value)
            )}
            {renderOption(
              <FileText size={20} color={theme.textInverse} />,
              'Categories',
              'Your custom categories and settings',
              exportOptions.includeCategories,
              (value) => updateOption('includeCategories', value)
            )}
            {renderOption(
              <FileText size={20} color={theme.textInverse} />,
              'Summary',
              'Financial summary and statistics',
              exportOptions.includeSummary,
              (value) => updateOption('includeSummary', value)
            )}
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={[styles.infoTitle, { color: theme.textPrimary }]}>About Export</Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              • CSV format is best for spreadsheet applications
            </Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              • JSON format preserves all data structure
            </Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              • PDF format creates a formatted report
            </Text>
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              • Files are saved to your device and can be shared
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  formatOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  formatOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  formatOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  dateRangeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  dateRangeOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  dateRangeOptionText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    fontFamily: 'Inter-Medium',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  infoSection: {
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 8,
  },
}); 