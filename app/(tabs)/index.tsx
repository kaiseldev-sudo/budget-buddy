import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Card } from '@/components/Card';
import { useAuthStore } from '@/store/authStore';
import { useTransactionStore } from '@/store/transactionStore';
import { useTheme } from '@/hooks/useTheme';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { TrendingUp, TrendingDown, PhilippinePeso, Target } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const user = useAuthStore((state) => state.user);
  const { transactions, categories, fetchTransactions, fetchCategories } = useTransactionStore();
  const theme = useTheme();
  const [monthlyData, setMonthlyData] = useState({
    income: 0,
    expenses: 0,
    balance: 0,
  });

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (transactions.length > 0) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const monthlyTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      });

      const income = monthlyTransactions
        .filter(t => t.category?.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = monthlyTransactions
        .filter(t => t.category?.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      setMonthlyData({
        income,
        expenses,
        balance: income - expenses,
      });
    }
  }, [transactions]);

  // Chart data for spending by category
  const categoryChartData = categories
    .filter(cat => cat.type === 'expense')
    .map(category => {
      const categoryTransactions = transactions.filter(
        t => t.category_id === category.id &&
        new Date(t.date).getMonth() === new Date().getMonth()
      );
      const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      return {
        name: category.name,
        amount: total,
        color: category.color,
      };
    })
    .filter(data => data.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6); // Show top 6 categories

  // Weekly spending data for line chart
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate.toDateString() === date.toDateString();
    });
    
    return {
      x: date.toLocaleDateString('en', { weekday: 'short' }),
      y: dayTransactions.reduce((sum, t) => sum + (t.category?.type === 'expense' ? t.amount : 0), 0),
    };
  });

  const chartConfig = {
    backgroundGradientFrom: theme.cardBackground,
    backgroundGradientTo: theme.cardBackground,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${theme.textPrimary === '#F9FAFB' ? '249, 250, 251' : '17, 24, 39'}, ${opacity})`,
    decimalPlaces: 0,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.primary,
    },
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Greeting Section */}
        <View style={styles.greetingSection}>
          <Text style={[styles.greeting, { color: theme.textSecondary }]}>Good morning,</Text>
          <Text style={[styles.userName, { color: theme.textPrimary }]}>{user?.user_metadata?.full_name || 'User'}</Text>
        </View>

        {/* Balance Cards */}
        <View style={styles.balanceSection}>
          <Card style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <View style={styles.balanceIconContainer}>
                <PhilippinePeso size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.balanceLabel}>Total Balance</Text>
            </View>
            <Text style={styles.balanceAmount}>
              ₱ {monthlyData.balance.toLocaleString()}
            </Text>
            <Text style={[
              styles.balanceChange,
              { color: monthlyData.balance >= 0 ? theme.positive : theme.negative }
            ]}>
              {monthlyData.balance >= 0 ? '+' : ''}
              ${Math.abs(monthlyData.balance).toLocaleString()} this month
            </Text>
          </Card>

          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <View style={styles.statHeader}>
                <TrendingUp size={20} color="#10B981" />
                              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Income</Text>
            </View>
            <Text style={[styles.statAmount, { color: theme.textPrimary }]}>
              ${monthlyData.income.toLocaleString()}
            </Text>
            </Card>

            <Card style={styles.statCard}>
              <View style={styles.statHeader}>
                <TrendingDown size={20} color="#EF4444" />
                              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Expenses</Text>
            </View>
            <Text style={[styles.statAmount, { color: theme.textPrimary }]}>
              ${monthlyData.expenses.toLocaleString()}
            </Text>
            </Card>
          </View>
        </View>

        {/* Spending by Category - Bar Chart */}
        {categoryChartData.length > 0 && (
          <Card style={styles.chartCard}>
            <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Spending by Category</Text>
            <View style={styles.chartContainer}>
              <BarChart
                data={{
                  labels: categoryChartData.map(cat => cat.name),
                  datasets: [{
                    data: categoryChartData.map(cat => cat.amount),
                  }],
                }}
                width={width - 80}
                height={220}
                yAxisLabel="$"
                yAxisSuffix=""
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                }}
                verticalLabelRotation={30}
                fromZero
                showBarTops={true}
                withInnerLines={false}
                style={{ borderRadius: 16 }}
              />
            </View>
          </Card>
        )}

        {/* Weekly Spending - Line Chart */}
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>This Week's Spending</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={{
                labels: weeklyData.map(day => day.x),
                datasets: [{
                  data: weeklyData.map(day => day.y),
                }],
              }}
              width={width - 80}
              height={220}
              yAxisLabel="$"
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
              }}
              bezier
              style={{ borderRadius: 16 }}
            />
          </View>
          <Text style={[styles.chartSubtext, { color: theme.textTertiary }]}>
            Total: ${weeklyData.reduce((sum, day) => sum + day.y, 0).toLocaleString()}
          </Text>
        </Card>

        {/* Recent Transactions */}
        <Card style={styles.recentCard}>
          <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Recent Transactions</Text>
          {transactions.slice(0, 5).map((transaction) => (
            <View key={transaction.id} style={[styles.transactionItem, { borderBottomColor: theme.borderLight }]}>
              <View style={styles.transactionLeft}>
                <View style={[
                  styles.transactionIcon,
                  { backgroundColor: transaction.category?.color || '#E5E7EB' }
                ]}>
                  <Text style={styles.transactionIconText}>
                    {transaction.category?.icon || '💰'}
                  </Text>
                </View>
                <View>
                  <Text style={[styles.transactionDescription, { color: theme.textPrimary }]}>
                    {transaction.description}
                  </Text>
                  <Text style={[styles.transactionCategory, { color: theme.textSecondary }]}>
                    {transaction.category?.name}
                  </Text>
                </View>
              </View>
              <Text style={[
                styles.transactionAmount,
                { color: transaction.category?.type === 'income' ? theme.positive : theme.negative }
              ]}>
                {transaction.category?.type === 'income' ? '+' : '-'}
                ${transaction.amount.toLocaleString()}
              </Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  greetingSection: {
    paddingTop: 10,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  userName: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    marginTop: 4,
  },
  balanceSection: {
    marginBottom: 24,
  },
  balanceCard: {
    backgroundColor: '#2563EB',
    marginBottom: 16,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  balanceLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  balanceAmount: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  balanceChange: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  statAmount: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  chartCard: {
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    overflow: 'hidden',
  },
  chartPlaceholder: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 8,
  },
  chartSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  recentCard: {
    marginBottom: 32,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  transactionDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  transactionCategory: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },

});