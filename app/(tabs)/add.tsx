import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useTransactionStore } from '@/store/transactionStore';
import { Category } from '@/types/database';
import { Upload, Calendar, PhilippinePeso, FileText, Image as ImageIcon } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';
import { launchImageLibraryAsync, requestMediaLibraryPermissionsAsync } from 'expo-image-picker';

const defaultCategories: Omit<Category, 'id' | 'user_id' | 'created_at'>[] = [
  // Income categories
  { name: 'Salary', color: '#10B981', icon: '💰', type: 'income' },
  { name: 'Freelance', color: '#3B82F6', icon: '💼', type: 'income' },
  { name: 'Investment', color: '#8B5CF6', icon: '📈', type: 'income' },
  { name: 'Gift', color: '#F59E0B', icon: '🎁', type: 'income' },
  
  // Expense categories
  { name: 'Food & Dining', color: '#EF4444', icon: '🍕', type: 'expense' },
  { name: 'Transportation', color: '#06B6D4', icon: '🚗', type: 'expense' },
  { name: 'Shopping', color: '#EC4899', icon: '🛍️', type: 'expense' },
  { name: 'Entertainment', color: '#F97316', icon: '🎬', type: 'expense' },
  { name: 'Bills & Utilities', color: '#6B7280', icon: '⚡', type: 'expense' },
  { name: 'Healthcare', color: '#DC2626', icon: '🏥', type: 'expense' },
  { name: 'Education', color: '#7C3AED', icon: '📚', type: 'expense' },
  { name: 'Travel', color: '#059669', icon: '✈️', type: 'expense' },
];

export default function AddTransactionScreen() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  const { categories, addTransaction, fetchCategories } = useTransactionStore();
  const theme = useTheme();

  useEffect(() => {
    fetchCategories();
  }, []);

  const availableCategories = categories.length > 0 ? categories : defaultCategories;
  const filteredCategories = availableCategories.filter(cat => cat.type === transactionType);

  const handleAddTransaction = async () => {
    if (!amount || !description || !selectedCategory) {
      Alert.alert('Error', 'Please fill in all fields and select a category');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    const { error } = await addTransaction({
      amount: numericAmount,
      description,
      category_id: selectedCategory.id || selectedCategory.name,
      date,
      receipt_url: receiptImage || undefined, // Add receipt image to transaction
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error);
    } else {
      Alert.alert('Success', 'Transaction added successfully!');
      // Reset form
      setAmount('');
      setDescription('');
      setSelectedCategory(null);
      setDate(new Date().toISOString().split('T')[0]);
      setReceiptImage(null);
    }
  };

  const pickImage = async () => {
    try {
      setImageLoading(true);
      
      // Request permission
      const { status } = await requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Permission to access camera roll is required to upload receipt photos');
        return;
      }

      // Launch image picker with fallback options
      let result;
      try {
        result = await launchImageLibraryAsync({
          allowsEditing: true,
          quality: 0.7,
          allowsMultipleSelection: false,
        });
      } catch (pickerError) {
        console.error('Image picker launch error:', pickerError);
        // Try with minimal options as fallback
        result = await launchImageLibraryAsync({
          quality: 0.7,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        if (selectedAsset && selectedAsset.uri) {
          setReceiptImage(selectedAsset.uri);
        }
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setImageLoading(false);
    }
  };

  const removeImage = () => {
    setReceiptImage(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Add Transaction</Text>
        </View>

        <Card style={styles.formCard}>
          {/* Transaction Type Toggle */}
          <View style={[styles.typeToggle, { backgroundColor: theme.surfaceSecondary }]}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                transactionType === 'income' && [styles.activeTypeButton, { backgroundColor: theme.surface }],
              ]}
              onPress={() => {
                setTransactionType('income');
                setSelectedCategory(null);
              }}
            >
              <Text style={[
                styles.typeButtonText,
                { color: theme.textSecondary },
                transactionType === 'income' && [styles.activeTypeButtonText, { color: theme.primary }],
              ]}>
                Income
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                transactionType === 'expense' && [styles.activeTypeButton, { backgroundColor: theme.surface }],
              ]}
              onPress={() => {
                setTransactionType('expense');
                setSelectedCategory(null);
              }}
            >
              <Text style={[
                styles.typeButtonText,
                { color: theme.textSecondary },
                transactionType === 'expense' && [styles.activeTypeButtonText, { color: theme.primary }],
              ]}>
                Expense
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount Input */}
          <Input
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="numeric"
            leftIcon={<PhilippinePeso size={20} color={theme.textTertiary} />}
          />

          {/* Description Input */}
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
            leftIcon={<FileText size={20} color={theme.textTertiary} />}
          />

          {/* Date Input */}
          <Input
            label="Date"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            leftIcon={<Calendar size={20} color={theme.textTertiary} />}
          />

          {/* Receipt Photo */}
          {receiptImage ? (
            <View style={styles.receiptImageContainer}>
              <Image 
                source={{ uri: receiptImage }} 
                style={styles.receiptImage}
                resizeMode="contain"
                onError={() => {
                  Alert.alert('Error', 'Failed to load image. Please try selecting another image.');
                  setReceiptImage(null);
                }}
              />
              <TouchableOpacity 
                style={[styles.removeImageButton, { backgroundColor: theme.error }]} 
                onPress={removeImage}
              >
                <Text style={[styles.removeImageText, { color: theme.textInverse }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={[styles.receiptButton, { borderColor: theme.border }]} 
              onPress={pickImage}
              disabled={imageLoading}
            >
              <Upload size={20} color={imageLoading ? theme.textTertiary : theme.textSecondary} />
              <Text style={[styles.receiptButtonText, { color: imageLoading ? theme.textTertiary : theme.textSecondary }]}>
                {imageLoading ? 'Loading...' : 'Upload Receipt Photo'}
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Category Selection */}
        <Card style={styles.categoryCard}>
          <Text style={[styles.categoryTitle, { color: theme.textPrimary }]}>Select Category</Text>
          <View style={styles.categoryGrid}>
            {filteredCategories.map((category) => (
              <TouchableOpacity
                key={category.name}
                style={[
                  styles.categoryItem,
                  selectedCategory?.name === category.name && [styles.selectedCategory, { 
                    borderColor: theme.primary, 
                    backgroundColor: theme.background === '#111827' ? theme.surfaceSecondary : '#EFF6FF' 
                  }],
                ]}
                onPress={() => setSelectedCategory(category as Category)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Text style={styles.categoryIconText}>{category.icon}</Text>
                </View>
                <Text style={[styles.categoryName, { color: theme.textSecondary }]}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Add Button */}
        <Button
          title={loading ? 'Adding...' : 'Add Transaction'}
          onPress={handleAddTransaction}
          disabled={loading}
          style={styles.addButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
  },
  formCard: {
    marginBottom: 24,
  },
  typeToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTypeButton: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  typeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  activeTypeButtonText: {
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  receiptButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  categoryCard: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCategory: {
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryIconText: {
    fontSize: 20,
  },
  categoryName: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  addButton: {
    marginBottom: 32,
  },
  receiptImageContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  receiptImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 12,
  },
  removeImageButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  removeImageText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
});