export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  profilePhoto?: string;
  upiId?: string;
  coinBalance: number;
  referralCoinBalance: number;
  referralCode: string;
  referredBy?: string;
  hasCompletedFirstTask?: boolean;
  taskWithdrawalsToday: number;
  lastWithdrawalDate: string;
  createdAt: string;
}

export interface Task {
  id: string;
  sequence: number;
  title: string;
  description: string;
  rules?: string; // step-by-step rules for completing the task
  price?: number; // monetary price/value in ₹ (optional, separate from coins)
  url: string;
  apkImageUrl?: string;
  coinsReward: number;
  active: boolean;
}

export interface TaskCompletion {
  id: string;
  userId: string;
  taskId: string;
  completedAt: string;
  adminConfirmed?: boolean;
  adminConfirmedAt?: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  userUpiId: string;
  coins: number;
  amountRs: number;
  type: "task" | "referral";
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  processedAt?: string;
}

export interface WalletTransaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  method: string;
  description: string;
  date: string;
}

export interface AdminWallet {
  balance: number;
  upiId: string;
  transactions: WalletTransaction[];
}

export interface OTPStore {
  phone: string;
  otp: string;
  expiry: number;
}
