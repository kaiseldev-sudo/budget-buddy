import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useTransactionStore } from '@/store/transactionStore';
import { useTheme } from '@/hooks/useTheme';
import { Category, Budget } from '@/types/database';

interface BudgetModalProps {
  visible: boolean;
  onClose: () => void;
  budget?: Budget;
  isEditing?: boolean;
}

export default function BudgetModal({ visible, onClose, budget, isEditing = false }: BudgetModalProps) {
  const { categories, addBudget, updateBudget, deleteBudget } = useTransactionStore();
  const theme = useTheme();
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (budget && isEditing) {
      setAmount(budget.amount.toString());
      setSelectedCategory(budget.category_id);
      setPeriod(budget.period);
    } else {
      setAmount('');
      setSelectedCategory('');
      setPeriod('monthly');
    }
  }, [budget, isEditing, visible]);

  const handleSave = async () => {
    if (!amount || !selectedCategory) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const budgetData = {
        category_id: selectedCategory,
        amount: numAmount,
        period,
        start_date: new Date().toISOString().split('T')[0],
        is_active: true,
      };

      let result;
      if (isEditing && budget) {
        result = await updateBudget(budget.id, budgetData);
      } else {
        result = await addBudget(budgetData);
      }

      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        onClose();
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!budget) return;

    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const result = await deleteBudget(budget.id);
              if (result.error) {
                Alert.alert('Error', result.error);
              } else {
                onClose();
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { 
          backgroundColor: theme.surface, 
          borderBottomColor: theme.border 
        }]}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {isEditing ? 'Edit Budget' : 'Add Budget'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: theme.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
              {categories
                .filter(cat => cat.type === 'expense')
                .map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      { 
                        backgroundColor: selectedCategory === category.id ? theme.primary : theme.surfaceSecondary,
                        borderColor: theme.border
                      },
                      selectedCategory === category.id && { borderColor: theme.primary }
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text style={[
                      styles.categoryText,
                      { color: selectedCategory === category.id ? theme.textInverse : theme.textPrimary }
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Amount</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.textPrimary
              }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter amount"
              placeholderTextColor={theme.textTertiary}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Period</Text>
            <View style={styles.periodContainer}>
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.periodChip,
                    { 
                      backgroundColor: period === p ? theme.primary : theme.surfaceSecondary,
                      borderColor: theme.border
                    },
                    period === p && { borderColor: theme.primary }
                  ]}
                  onPress={() => setPeriod(p)}
                >
                  <Text style={[
                    styles.periodText,
                    { color: period === p ? theme.textInverse : theme.textPrimary }
                  ]}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, { backgroundColor: theme.primary }]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={[styles.buttonText, { color: theme.textInverse }]}>
                {loading ? 'Saving...' : (isEditing ? 'Update Budget' : 'Add Budget')}
              </Text>
            </TouchableOpacity>

            {isEditing && budget && (
              <TouchableOpacity
                style={[styles.button, styles.deleteButton, { backgroundColor: theme.error }]}
                onPress={handleDelete}
                disabled={loading}
              >
                <Text style={[styles.buttonText, { color: theme.textInverse }]}>
                  Delete Budget
                </Text>
              </TouchableOpacity>
            )}
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
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  periodContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  periodChip: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 20,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    // backgroundColor will be set dynamically
  },
  deleteButton: {
    // backgroundColor will be set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 