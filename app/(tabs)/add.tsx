import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { useTransactionStore } from '@/store/transactionStore';
import { Category } from '@/types/database';
import { Camera, Calendar, DollarSign, FileText } from 'lucide-react-native';
import { useCameraPermissions, CameraView } from 'expo-camera';

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
  const [showCamera, setShowCamera] = useState(false);

  const { categories, addTransaction, fetchCategories } = useTransactionStore();
  const [permission, requestPermission] = useCameraPermissions();

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
    }
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take receipt photos');
        return;
      }
    }
    setShowCamera(true);
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing="back" />
        <View style={styles.cameraOverlay}>
          <TouchableOpacity
            style={styles.closeCamera}
            onPress={() => setShowCamera(false)}
          >
            <Text style={styles.closeCameraText}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.captureButton}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Add Transaction</Text>
        </View>

        <Card style={styles.formCard}>
          {/* Transaction Type Toggle */}
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                transactionType === 'income' && styles.activeTypeButton,
              ]}
              onPress={() => {
                setTransactionType('income');
                setSelectedCategory(null);
              }}
            >
              <Text style={[
                styles.typeButtonText,
                transactionType === 'income' && styles.activeTypeButtonText,
              ]}>
                Income
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                transactionType === 'expense' && styles.activeTypeButton,
              ]}
              onPress={() => {
                setTransactionType('expense');
                setSelectedCategory(null);
              }}
            >
              <Text style={[
                styles.typeButtonText,
                transactionType === 'expense' && styles.activeTypeButtonText,
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
            leftIcon={<DollarSign size={20} color="#9CA3AF" />}
          />

          {/* Description Input */}
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
            leftIcon={<FileText size={20} color="#9CA3AF" />}
          />

          {/* Date Input */}
          <Input
            label="Date"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
            leftIcon={<Calendar size={20} color="#9CA3AF" />}
          />

          {/* Receipt Photo */}
          <TouchableOpacity style={styles.receiptButton} onPress={openCamera}>
            <Camera size={20} color="#6B7280" />
            <Text style={styles.receiptButtonText}>Add Receipt Photo</Text>
          </TouchableOpacity>
        </Card>

        {/* Category Selection */}
        <Card style={styles.categoryCard}>
          <Text style={styles.categoryTitle}>Select Category</Text>
          <View style={styles.categoryGrid}>
            {filteredCategories.map((category) => (
              <TouchableOpacity
                key={category.name}
                style={[
                  styles.categoryItem,
                  selectedCategory?.name === category.name && styles.selectedCategory,
                ]}
                onPress={() => setSelectedCategory(category as Category)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Text style={styles.categoryIconText}>{category.icon}</Text>
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
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
    backgroundColor: '#F9FAFB',
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
    color: '#111827',
  },
  formCard: {
    marginBottom: 24,
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
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
    backgroundColor: '#FFFFFF',
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
    color: '#6B7280',
  },
  activeTypeButtonText: {
    color: '#2563EB',
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
  },
  receiptButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 8,
  },
  categoryCard: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
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
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
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
    color: '#374151',
    textAlign: 'center',
  },
  addButton: {
    marginBottom: 32,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
  },
  closeCamera: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  closeCameraText: {
    color: '#FFFFFF',
    fontFamily: 'Inter-Medium',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB',
  },
});