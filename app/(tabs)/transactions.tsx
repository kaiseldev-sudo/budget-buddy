import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { Card } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useTransactionStore } from '@/store/transactionStore';
import { useTheme } from '@/hooks/useTheme';
import { Transaction } from '@/types/database';
import { Search, Filter, Trash2, Image as ImageIcon } from 'lucide-react-native';

export default function TransactionsScreen() {
  const { transactions, loading, fetchTransactions, deleteTransaction } = useTransactionStore();
  const theme = useTheme();
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  useEffect(() => {
    let filtered = transactions;
    
    if (filter !== 'all') {
      filtered = transactions.filter(t => t.category?.type === filter);
    }
    
    setFilteredTransactions(filtered);
  }, [transactions, filter]);

  const handleDeleteTransaction = (transaction: Transaction) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTransaction(transaction.id),
        },
      ]
    );
  };

  const renderTransaction = ({ item: transaction }: { item: Transaction }) => (
    <Card style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionLeft}>
          <View style={[
            styles.transactionIcon,
            { backgroundColor: transaction.category?.color || theme.surfaceSecondary }
          ]}>
            <Text style={styles.transactionIconText}>
              {transaction.category?.icon || '💰'}
            </Text>
          </View>
          <View style={styles.transactionInfo}>
            <Text style={[styles.transactionDescription, { color: theme.textPrimary }]}>
              {transaction.description}
            </Text>
            <Text style={[styles.transactionCategory, { color: theme.textSecondary }]}>
              {transaction.category?.name}
            </Text>
            <Text style={[styles.transactionDate, { color: theme.textTertiary }]}>
              {new Date(transaction.date).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionAmount,
            { color: transaction.category?.type === 'income' ? theme.positive : theme.negative }
          ]}>
            {transaction.category?.type === 'income' ? '+' : '-'}
            ${transaction.amount.toLocaleString()}
          </Text>
          <View style={styles.transactionActions}>
            {transaction.receipt_url && (
              <TouchableOpacity 
                style={styles.receiptButton}
                onPress={() => setSelectedReceipt(transaction.receipt_url!)}
              >
                <ImageIcon size={16} color={theme.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteTransaction(transaction)}
            >
              <Trash2 size={16} color={theme.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Card>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.filterContainer}>
        {(['all', 'income', 'expense'] as const).map((filterType) => (
          <TouchableOpacity
            key={filterType}
            style={[
              styles.filterButton,
              { backgroundColor: filter === filterType ? theme.primary : theme.surfaceSecondary },
              { borderColor: theme.border }
            ]}
            onPress={() => setFilter(filterType)}
          >
            <Text style={[
              styles.filterButtonText,
              { color: filter === filterType ? theme.textInverse : theme.textSecondary }
            ]}>
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No transactions found</Text>
            <Text style={[styles.emptySubtext, { color: theme.textTertiary }]}>
              Add your first transaction to get started
            </Text>
          </View>
        }
      />

      {/* Receipt Image Modal */}
      <Modal
        visible={!!selectedReceipt}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedReceipt(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Receipt</Text>
              <TouchableOpacity 
                style={styles.closeModalButton}
                onPress={() => setSelectedReceipt(null)}
              >
                <Text style={[styles.closeModalText, { color: theme.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedReceipt && (
              <Image 
                source={{ uri: selectedReceipt }} 
                style={styles.receiptImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  transactionCard: {
    marginBottom: 12,
    padding: 16,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionIconText: {
    fontSize: 16,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 4,
  },
  transactionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  receiptButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  closeModalButton: {
    padding: 8,
  },
  closeModalText: {
    fontSize: 20,
    fontFamily: 'Inter-Medium',
  },
  receiptImage: {
    flex: 1,
    width: '100%',
  },
});