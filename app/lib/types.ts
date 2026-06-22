export interface Customer {
  id: string;
  name: string;
  phone: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  price: number;
  status: "active" | "expired" | "expiring";
  subscriptionType?: "monthly";
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
  costPrice: number;
  sellPrice: number;
  profit: number;
  date: string;
}

export interface Expense {
  id: string;
  expenseName: string;
  price: number;
  date: string;
}

export interface InventoryItem {
  id: string;
  itemName: string;
  costPrice: number;
  quantity: number;
}
