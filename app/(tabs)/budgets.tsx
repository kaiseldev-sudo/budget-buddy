import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Card } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useTransactionStore } from '@/store/transactionStore';
import { useTheme } from '@/hooks/useTheme';
import BudgetModal from '@/components/BudgetModal';
import { Target, TrendingUp, TriangleAlert as AlertTriangle, Plus } from 'lucide-react-native';
import { Budget } from '@/types/database';
import { PieChart, BarChart } from 'react-native-chart-kit';

interface BudgetWithSpending extends Budget {
  spent: number;
  remaining: number;
  progress: number;
}

export default function BudgetsScreen() {
  const { 
    transactions, 
    categories, 
    budgets, 
    fetchTransactions, 
    fetchCategories, 
    fetchBudgets 
  } = useTransactionStore();
  const theme = useTheme();
  
  const [budgetData, setBudgetData] = useState<BudgetWithSpending[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>();
  const [selectedPieIndex, setSelectedPieIndex] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (transactions.length > 0 && categories.length > 0 && budgets.length > 0) {
      calculateBudgetData();
    }
    setLoading(false);
  }, [transactions, categories, budgets]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchTransactions(),
      fetchCategories(),
      fetchBudgets(),
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const calculateBudgetData = () => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];

    const budgetWithSpending = budgets.map(budget => {
      // Calculate spending for the budget period
      let spent = 0;
      const budgetStartDate = new Date(budget.start_date);
      
      // Filter transactions based on budget period
      const relevantTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        const isSameCategory = transaction.category_id === budget.category_id;
        
        if (!isSameCategory) return false;

        switch (budget.period) {
          case 'daily':
            return transactionDate.toDateString() === now.toDateString();
          case 'weekly':
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return transactionDate >= weekStart && transactionDate <= weekEnd;
          case 'monthly':
            return transactionDate.getMonth() === now.getMonth() && 
                   transactionDate.getFullYear() === now.getFullYear();
          default:
            return false;
        }
      });

      spent = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
      const remaining = budget.amount - spent;
      const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      return {
        ...budget,
        spent,
        remaining,
        progress,
      };
    });

    setBudgetData(budgetWithSpending);
  };

  const handleAddBudget = () => {
    setEditingBudget(undefined);
    setModalVisible(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingBudget(undefined);
  };

  // Calculate total budget overview
  const totalSpent = budgetData.reduce((sum, budget) => sum + budget.spent, 0);
  const totalBudget = budgetData.reduce((sum, budget) => sum + budget.amount, 0);
  const totalRemaining = totalBudget - totalSpent;
  const budgetProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Chart data
  const chartWidth = Dimensions.get('window').width - 10;
  const pieChartSize = 150;
  const pieChartData = budgetData.map((budget) => {
    const category = categories.find(cat => cat.id === budget.category_id);
    return {
      name: category ? category.name : 'Other',
      amount: budget.amount,
      color: category ? category.color : '#6B7280',
      legendFontColor: '#374151',
      legendFontSize: 14,
    };
  });

  const barChartLabels = budgetData.map(budget => {
    const category = categories.find(cat => cat.id === budget.category_id);
    return category ? category.name : 'Other';
  });
  const barChartBudgeted = budgetData.map(budget => budget.amount);
  const barChartSpent = budgetData.map(budget => budget.spent);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Budgets</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Track your spending against set limits</Text>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.primary }]} onPress={handleAddBudget}>
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Budget</Text>
          </TouchableOpacity>
        </View>


        {/* Budget Overview */}
        <Card style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Target size={24} color={theme.primary} />
            <Text style={[styles.overviewTitle, { color: theme.textPrimary }]}>Budget Overview</Text>
          </View>
          <View style={styles.overviewStats}>
            <View style={styles.overviewStat}>
              <Text style={[styles.overviewAmount, { color: theme.textPrimary }]}>${totalSpent.toLocaleString()}</Text>
              <Text style={[styles.overviewLabel, { color: theme.textSecondary }]}>Spent</Text>
            </View>
            <View style={styles.overviewStat}>
              <Text style={[styles.overviewAmount, { color: theme.textPrimary }]}>${totalBudget.toLocaleString()}</Text>
              <Text style={[styles.overviewLabel, { color: theme.textSecondary }]}>Budget</Text>
            </View>
            <View style={styles.overviewStat}>
              <Text style={[styles.overviewAmount, { color: totalRemaining >= 0 ? theme.positive : theme.negative }]}>
                ${Math.abs(totalRemaining).toLocaleString()}
              </Text>
              <Text style={[styles.overviewLabel, { color: theme.textSecondary }]}>
                {totalRemaining >= 0 ? 'Remaining' : 'Over Budget'}
              </Text>
            </View>
          </View>
          {totalBudget > 0 && (
            <>
              <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                <View style={[styles.progressFill, { 
                  width: `${Math.min(budgetProgress, 100)}%`,
                  backgroundColor: theme.primary
                }]} />
              </View>
              <Text style={[styles.progressText, { color: theme.textSecondary }]}>
                {budgetProgress.toFixed(1)}% of budget used
              </Text>
            </>
          )}
        </Card>

        {/* Category Budgets */}
        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Your Budgets</Text>
          {budgetData.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No budgets set</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Create your first budget to start tracking your spending against limits.
              </Text>
              <TouchableOpacity style={[styles.emptyButton, { backgroundColor: theme.primary }]} onPress={handleAddBudget}>
                <Text style={styles.emptyButtonText}>Create Budget</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            budgetData.map((budget) => {
              const category = categories.find(cat => cat.id === budget.category_id);
              if (!category) return null;

              const isOverBudget = budget.progress > 100;
              const isNearLimit = budget.progress > 80 && budget.progress <= 100;

              return (
                <TouchableOpacity 
                  key={budget.id} 
                  style={styles.budgetCard}
                  onPress={() => handleEditBudget(budget)}
                >
                  <Card style={styles.budgetCardContent}>
                    <View style={styles.budgetHeader}>
                      <View style={styles.budgetLeft}>
                        <View style={[styles.budgetIcon, { backgroundColor: category.color }]}>
                          <Text style={styles.budgetIconText}>{category.icon}</Text>
                        </View>
                        <View style={styles.budgetInfo}>
                          <Text style={[styles.budgetCategory, { color: theme.textPrimary }]}>{category.name}</Text>
                          <Text style={[styles.budgetPeriod, { color: theme.textSecondary }]}>
                            {budget.period.charAt(0).toUpperCase() + budget.period.slice(1)} Budget
                          </Text>
                          <Text style={[styles.budgetAmount, { color: theme.textSecondary }]}>
                            ${budget.spent} / ${budget.amount}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.budgetRight}>
                        {isOverBudget && <AlertTriangle size={20} color={theme.error} />}
                        {isNearLimit && <AlertTriangle size={20} color={theme.warning} />}
                        <Text style={[
                          styles.budgetPercentage,
                          { color: isOverBudget ? theme.error : isNearLimit ? theme.warning : theme.textPrimary }
                        ]}>
                          {Math.round(budget.progress)}%
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.budgetProgressBar, { backgroundColor: theme.border }]}>
                      <View 
                        style={[
                          styles.budgetProgressFill,
                          {
                            width: `${Math.min(budget.progress, 100)}%`,
                            backgroundColor: isOverBudget ? theme.error : isNearLimit ? theme.warning : category.color,
                          }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.budgetRemaining, { color: theme.textSecondary }]}>
                      {budget.remaining > 0 
                        ? `$${budget.remaining} remaining`
                        : `$${Math.abs(budget.remaining)} over budget`
                      }
                    </Text>
                  </Card>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Budget Tips */}
        <Card style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <TrendingUp size={20} color={theme.success} />
            <Text style={[styles.tipsTitle, { color: theme.textPrimary }]}>Budget Tips</Text>
          </View>
          <View style={styles.tip}>
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>
              • Set realistic budgets based on your spending history
            </Text>
          </View>
          <View style={styles.tip}>
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>
              • Review and adjust your budgets regularly
            </Text>
          </View>
          <View style={styles.tip}>
            <Text style={[styles.tipText, { color: theme.textSecondary }]}>
              • Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings
            </Text>
          </View>
        </Card>
      </ScrollView>

      <BudgetModal
        visible={modalVisible}
        onClose={handleCloseModal}
        budget={editingBudget}
        isEditing={!!editingBudget}
      />
    </SafeAreaView>
  );
}

const getChartConfig = (theme: any) => ({
  backgroundGradientFrom: theme.cardBackground,
  backgroundGradientTo: theme.cardBackground,
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(${theme.textPrimary === '#111827' ? '55, 65, 81' : '249, 250, 251'}, ${opacity})`,
  decimalPlaces: 0,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: theme.primary,
  },
});

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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginBottom: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 6,
  },
  overviewCard: {
    marginBottom: 24,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  overviewTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  overviewStat: {
    alignItems: 'center',
  },
  overviewAmount: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  overviewLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  categoriesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  budgetCard: {
    marginBottom: 16,
  },
  budgetCardContent: {
    padding: 16,
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  budgetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  budgetIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  budgetIconText: {
    fontSize: 16,
  },
  budgetInfo: {
    flex: 1,
  },
  budgetCategory: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  budgetPeriod: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 2,
  },
  budgetAmount: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginTop: 2,
  },
  budgetRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetPercentage: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    marginLeft: 8,
  },
  budgetProgressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
  },
  budgetProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  budgetRemaining: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  tipsCard: {
    marginBottom: 32,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  tip: {
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  chartCard: {
    marginBottom: 24,
    padding: 16,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#111827',
    marginBottom: 12,
  },
  pieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 8,
    marginBottom: 8,
  },
  pieChart: {
    marginRight: 24,
    minWidth: 150,
  },
  pieLegendContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  pieLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  pieLegendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  pieLegendText: {
    fontSize: 14,
    color: '#374151',
  },
});