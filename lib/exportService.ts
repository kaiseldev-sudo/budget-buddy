import { Transaction, Budget, Category } from '@/types/database';
import { User } from '@supabase/supabase-js';

export interface ExportData {
  transactions: Transaction[];
  budgets: Budget[];
  categories: Category[];
  summary: {
    totalTransactions: number;
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    dateRange: string;
  };
  user: {
    name: string;
    email: string;
  };
  exportDate: string;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf';
  dateRange: 'all' | 'month' | 'quarter' | 'year';
  includeTransactions: boolean;
  includeBudgets: boolean;
  includeCategories: boolean;
  includeSummary: boolean;
}

class ExportService {
  filterTransactionsByDateRange(transactions: Transaction[], dateRange: string): Transaction[] {
    const now = new Date();
    let filtered = transactions;
    
    switch (dateRange) {
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        filtered = transactions.filter(t => new Date(t.date) >= monthStart);
        break;
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        filtered = transactions.filter(t => new Date(t.date) >= quarterStart);
        break;
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        filtered = transactions.filter(t => new Date(t.date) >= yearStart);
        break;
      default:
        break;
    }
    
    return filtered;
  }

  calculateSummary(transactions: Transaction[]): {
    totalTransactions: number;
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
  } {
    const totalIncome = transactions
      .filter(t => t.category?.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.category?.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalTransactions: transactions.length,
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
    };
  }

  generateCSV(transactions: Transaction[]): string {
    let csv = 'Date,Description,Category,Type,Amount\n';
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date).toLocaleDateString();
      const description = transaction.description.replace(/"/g, '""');
      const category = transaction.category?.name || 'Unknown';
      const type = transaction.category?.type || 'expense';
      const amount = transaction.amount;
      
      csv += `"${date}","${description}","${category}","${type}","${amount}"\n`;
    });
    
    return csv;
  }

  generateJSON(data: ExportData): string {
    return JSON.stringify(data, null, 2);
  }

  generatePDFHTML(data: ExportData): string {
    const { transactions, summary, user } = data;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Budget Buddy - Financial Report</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              margin: 0; 
              padding: 20px; 
              background: #f8fafc;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
            }
            .header h1 { 
              margin: 0; 
              font-size: 28px; 
              font-weight: 700;
            }
            .header p { 
              margin: 10px 0 0 0; 
              opacity: 0.9;
              font-size: 16px;
            }
            .summary { 
              background: #f8fafc; 
              padding: 30px; 
              border-bottom: 1px solid #e2e8f0;
            }
            .summary h2 { 
              margin: 0 0 20px 0; 
              color: #1e293b;
              font-size: 20px;
            }
            .summary-grid { 
              display: grid; 
              grid-template-columns: repeat(4, 1fr); 
              gap: 20px; 
            }
            .summary-item { 
              text-align: center; 
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            .summary-value { 
              font-size: 24px; 
              font-weight: 700; 
              margin-bottom: 5px;
            }
            .summary-label { 
              font-size: 14px; 
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .income { color: #059669; }
            .expense { color: #dc2626; }
            .neutral { color: #1e293b; }
            .content { padding: 30px; }
            .content h2 { 
              margin: 0 0 20px 0; 
              color: #1e293b;
              font-size: 20px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 20px;
              background: white;
              border-radius: 8px;
              overflow: hidden;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            th, td { 
              padding: 12px 16px; 
              text-align: left; 
              border-bottom: 1px solid #e2e8f0;
            }
            th { 
              background: #f1f5f9; 
              font-weight: 600;
              color: #475569;
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            td { 
              font-size: 14px;
              color: #334155;
            }
            .footer {
              background: #f8fafc;
              padding: 20px 30px;
              text-align: center;
              color: #64748b;
              font-size: 14px;
              border-top: 1px solid #e2e8f0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Budget Buddy</h1>
              <p>Financial Report - ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="summary">
              <h2>Financial Summary</h2>
              <div class="summary-grid">
                <div class="summary-item">
                  <div class="summary-value neutral">${summary.totalTransactions}</div>
                  <div class="summary-label">Transactions</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value income">$${summary.totalIncome.toLocaleString()}</div>
                  <div class="summary-label">Total Income</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value expense">$${summary.totalExpenses.toLocaleString()}</div>
                  <div class="summary-label">Total Expenses</div>
                </div>
                <div class="summary-item">
                  <div class="summary-value ${summary.netAmount >= 0 ? 'income' : 'expense'}">
                    $${summary.netAmount.toLocaleString()}
                  </div>
                  <div class="summary-label">Net Amount</div>
                </div>
              </div>
            </div>
            
            <div class="content">
              <h2>Transaction Details</h2>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${transactions.map(transaction => `
                    <tr>
                      <td>${new Date(transaction.date).toLocaleDateString()}</td>
                      <td>${transaction.description}</td>
                      <td>${transaction.category?.name || 'Unknown'}</td>
                      <td style="text-transform: capitalize;">${transaction.category?.type || 'expense'}</td>
                      <td class="${transaction.category?.type === 'income' ? 'income' : 'expense'}">
                        $${transaction.amount.toLocaleString()}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            
            <div class="footer">
              <p>Generated by Budget Buddy for ${user.name} on ${new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  prepareExportData(
    transactions: Transaction[],
    budgets: Budget[],
    categories: Category[],
    user: User | null,
    options: ExportOptions
  ): ExportData {
    const filteredTransactions = this.filterTransactionsByDateRange(transactions, options.dateRange);
    const summary = this.calculateSummary(filteredTransactions);
    
    return {
      transactions: options.includeTransactions ? filteredTransactions : [],
      budgets: options.includeBudgets ? budgets : [],
      categories: options.includeCategories ? categories : [],
      summary: options.includeSummary ? {
        ...summary,
        dateRange: options.dateRange,
      } : {
        totalTransactions: 0,
        totalIncome: 0,
        totalExpenses: 0,
        netAmount: 0,
        dateRange: options.dateRange,
      },
      user: {
        name: user?.user_metadata?.full_name || 'User',
        email: user?.email || '',
      },
      exportDate: new Date().toISOString(),
    };
  }

  getFilename(format: string, dateRange: string): string {
    const date = new Date().toISOString().split('T')[0];
    return `budget-buddy-${dateRange}-${date}.${format}`;
  }

  getMimeType(format: string): string {
    switch (format) {
      case 'csv':
        return 'text/csv';
      case 'json':
        return 'application/json';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'text/plain';
    }
  }
}

export const exportService = new ExportService(); 