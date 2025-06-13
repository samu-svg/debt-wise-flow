
export interface Payment {
  id: string;
  amount: number;
  date: string;
  description?: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  clientId: string;
  description: string;
  originalAmount: number;
  currentAmount: number;
  interestRate: number; // porcentagem mensal
  dueDate: string;
  status: 'active' | 'paid' | 'overdue';
  createdAt: string;
  updatedAt: string;
  payments: Payment[];
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  debts: Debt[];
}

export interface DashboardMetrics {
  totalClients: number;
  totalDebts: number;
  totalAmount: number;
  totalPaid: number;
  totalOverdue: number;
  overdueCount: number;
}
