export interface Customer {
  id: string;
  name: string;
  phone: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  price: number;
  status: "active" | "expired" | "expiring";
}

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  date: string;
}

export interface Sale {
  id: string;
  itemName: string;
  price: number;
  date: string;
}

export interface Expense {
  id: string;
  expenseName: string;
  price: number;
  date: string;
}
