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
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useTransactionStore } from '@/store/transactionStore';
import { useTheme } from '@/hooks/useTheme';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { TrendingUp, TrendingDown, Calendar, PhilippinePeso } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface MonthlyData {
  x: string;
  y: number;
  income: number;
  expenses: number;
}

interface CategorySpending {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export default function ReportsScreen() {
  const { transactions, categories, fetchTransactions, fetchCategories } = useTransactionStore();
  const theme = useTheme();
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (transactions.length > 0 && categories.length > 0) {
      // Find the date range of transactions
      const transactionDates = transactions.map(t => new Date(t.date));
      const earliestDate = new Date(Math.min(...transactionDates.map(d => d.getTime())));
      const latestDate = new Date(Math.max(...transactionDates.map(d => d.getTime())));
      
      // Generate months from earliest transaction to current date (or latest transaction)
      const months = [];
      const endDate = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1);
      const startDate = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
      
      let currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const monthName = currentDate.toLocaleDateString('en', { month: 'short' });
        const year = currentDate.getFullYear();
        
        const monthTransactions = transactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate.getMonth() === currentDate.getMonth() &&
                 transactionDate.getFullYear() === currentDate.getFullYear();
        });

        const income = monthTransactions
          .filter(t => t.category?.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expenses = monthTransactions
          .filter(t => t.category?.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        months.push({
          x: `${monthName} ${year}`,
          y: expenses,
          income,
          expenses,
        });
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      setMonthlyData(months);

      // Calculate category spending for current month
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const currentMonthTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === currentMonth &&
               transactionDate.getFullYear() === currentYear &&
               transaction.category?.type === 'expense';
      });

      const totalExpenses = currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      const categoryData = categories
        .filter(cat => cat.type === 'expense')
        .map(category => {
          const categoryTransactions = currentMonthTransactions.filter(
            t => t.category_id === category.id
          );
          const amount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
          const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
          
          return {
            category: category.name,
            amount,
            percentage: Math.round(percentage),
            color: category.color,
          };
        })
        .filter(cat => cat.amount > 0)
        .sort((a, b) => b.amount - a.amount);

      setCategorySpending(categoryData);
    }
    setLoading(false);
  }, [transactions, categories]);

  const totalSpent = categorySpending.reduce((sum, cat) => sum + cat.amount, 0);
  const currentMonth = monthlyData[monthlyData.length - 1];
  const previousMonth = monthlyData[monthlyData.length - 2];
  const monthlyChange = previousMonth && previousMonth.y > 0 
    ? ((currentMonth?.y || 0) - previousMonth.y) / previousMonth.y * 100 
    : 0;

  if (loading) {
    return <LoadingSpinner />;
  }

  // Calculate insights
  const monthsWithData = monthlyData.filter(month => month.y > 0 || month.income > 0);
  const averageMonthlySpending = monthsWithData.length > 0 
    ? monthsWithData.reduce((sum, month) => sum + month.y, 0) / monthsWithData.length 
    : 0;
  
  const topCategory = categorySpending[0];
  const budgetCategories = categorySpending.length; // You can enhance this with actual budget data

  const chartConfig = {
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
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentHeader}>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Insights into your spending patterns</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <Card style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <PhilippinePeso size={20} color={theme.primary} />
              <Text style={[styles.summaryTitle, { color: theme.textSecondary }]}>This Month</Text>
            </View>
            <Text style={[styles.summaryAmount, { color: theme.textPrimary }]}>${(currentMonth?.y || 0).toLocaleString()}</Text>
            <View style={styles.summaryChange}>
              {monthlyChange >= 0 ? (
                <TrendingUp size={16} color={theme.positive} />
              ) : (
                <TrendingDown size={16} color={theme.negative} />
              )}
              <Text style={[
                styles.summaryChangeText,
                { color: monthlyChange >= 0 ? theme.positive : theme.negative }
              ]}>
                {Math.abs(monthlyChange).toFixed(1)}% vs last month
              </Text>
            </View>
          </Card>

          <Card style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Calendar size={20} color={theme.success} />
              <Text style={[styles.summaryTitle, { color: theme.textSecondary }]}>Average Monthly</Text>
            </View>
            <Text style={[styles.summaryAmount, { color: theme.textPrimary }]}>
              ${Math.round(averageMonthlySpending).toLocaleString()}
            </Text>
            <Text style={[styles.summarySubtext, { color: theme.textTertiary }]}>
              Based on {monthsWithData.length} month{monthsWithData.length !== 1 ? 's' : ''} of data
            </Text>
          </Card>
        </View>

        {/* Spending Trend - Line Chart */}
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Spending Trend</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={{
                labels: monthlyData.map(month => month.x),
                datasets: [{
                  data: monthlyData.map(month => month.y),
                }],
              }}
              width={width - 80}
              height={220}
              yAxisLabel="$"
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
              }}
              bezier
              style={{ borderRadius: 16, alignSelf: 'center' }}
            />
          </View>
          <Text style={[styles.chartSubtext, { color: theme.textTertiary }]}>
            Average monthly spending: ${Math.round(averageMonthlySpending).toLocaleString()}
          </Text>
        </Card>

        {/* Income vs Expenses - Bar Chart */}
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Income vs Expenses</Text>
          <View style={styles.chartContainer}>
            <BarChart
              data={{
                labels: monthlyData.map(month => month.x),
                datasets: [
                  {
                    data: monthlyData.map(month => month.income),
                    color: () => '#10B981',
                  },
                  {
                    data: monthlyData.map(month => month.expenses),
                    color: () => '#EF4444',
                  },
                ],
              }}
              width={width - 80}
              height={220}
              yAxisLabel="$"
              yAxisSuffix=""
              chartConfig={chartConfig}
              verticalLabelRotation={30}
              fromZero
              showBarTops={true}
              withInnerLines={false}
              style={{ borderRadius: 16, alignSelf: 'center' }}
            />
          </View>
          <Text style={[styles.chartSubtext, { color: theme.textTertiary }]}>
            Current month: ${(currentMonth?.income || 0).toLocaleString()} income, ${(currentMonth?.expenses || 0).toLocaleString()} expenses
          </Text>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: theme.positive }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>Income</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: theme.negative }]} />
              <Text style={[styles.legendText, { color: theme.textSecondary }]}>Expenses</Text>
            </View>
          </View>
        </Card>

        {/* Category Breakdown */}
        <Card style={styles.breakdownCard}>
          <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Category Breakdown</Text>
          <Text style={[styles.breakdownSubtitle, { color: theme.textSecondary }]}>Total: ${totalSpent.toLocaleString()}</Text>
          
          {categorySpending.map((category, index) => (
            <View key={index} style={styles.categoryBreakdown}>
              <View style={styles.categoryBreakdownHeader}>
                <View style={styles.categoryBreakdownLeft}>
                  <View style={[styles.categoryIndicator, { backgroundColor: category.color }]} />
                  <Text style={[styles.categoryBreakdownName, { color: theme.textPrimary }]}>{category.category}</Text>
                </View>
                <View style={styles.categoryBreakdownRight}>
                  <Text style={[styles.categoryBreakdownAmount, { color: theme.textPrimary }]}>
                    ${category.amount.toLocaleString()}
                  </Text>
                  <Text style={[styles.categoryBreakdownPercentage, { color: theme.textSecondary }]}>
                    {category.percentage}%
                  </Text>
                </View>
              </View>
              <View style={[styles.categoryProgressBar, { backgroundColor: theme.border }]}>
                <View 
                  style={[
                    styles.categoryProgressFill,
                    {
                      width: `${category.percentage}%`,
                      backgroundColor: category.color,
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </Card>

        {/* Insights */}
        <Card style={styles.insightsCard}>
          <Text style={[styles.chartTitle, { color: theme.textPrimary }]}>Key Insights</Text>
          <View style={styles.insight}>
            <View style={[styles.insightIcon, { backgroundColor: theme.surfaceSecondary }]}>
              {monthlyChange >= 0 ? (
                <TrendingUp size={16} color={theme.positive} />
              ) : (
                <TrendingDown size={16} color={theme.negative} />
              )}
            </View>
            <Text style={[styles.insightText, { color: theme.textSecondary }]}>
              Your spending {monthlyChange >= 0 ? 'increased' : 'decreased'} by {Math.abs(monthlyChange).toFixed(1)}% compared to last month
            </Text>
          </View>
          {topCategory && (
            <View style={styles.insight}>
              <View style={[styles.insightIcon, { backgroundColor: theme.surfaceSecondary }]}>
                <TrendingDown size={16} color={theme.negative} />
              </View>
              <Text style={[styles.insightText, { color: theme.textSecondary }]}>
                {topCategory.category} is your highest expense category at {topCategory.percentage}%
              </Text>
            </View>
          )}
          <View style={styles.insight}>
            <View style={[styles.insightIcon, { backgroundColor: theme.surfaceSecondary }]}>
              <Calendar size={16} color={theme.primary} />
            </View>
            <Text style={[styles.insightText, { color: theme.textSecondary }]}>
              You have {budgetCategories} active spending categories this month
            </Text>
          </View>
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
  contentHeader: {
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
  },
  summarySection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginLeft: 8,
  },
  summaryAmount: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
  },
  summaryChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryChangeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginLeft: 4,
  },
  summarySubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
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
    justifyContent: 'center',
    paddingVertical: 16,
    overflow: 'hidden',
  },
  chartPlaceholder: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  chartSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  breakdownCard: {
    marginBottom: 24,
  },
  breakdownSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 20,
  },
  categoryBreakdown: {
    marginBottom: 16,
  },
  categoryBreakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryBreakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryBreakdownName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  categoryBreakdownRight: {
    alignItems: 'flex-end',
  },
  categoryBreakdownAmount: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  categoryBreakdownPercentage: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  categoryProgressBar: {
    height: 4,
    borderRadius: 2,
  },
  categoryProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  insightsCard: {
    marginBottom: 32,
  },
  insight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  insightText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    flex: 1,
    lineHeight: 20,
  },
});