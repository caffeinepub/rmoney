import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}

export interface RMTask {
    id: string;
    sequence: bigint;
    title: string;
    description: string;
    rules: string;
    url: string;
    imageUrl: string;
    coinsReward: bigint;
    active: boolean;
}

export interface RMUser {
    id: string;
    phone: string;
    name: string;
    userId: string;
    referralCode: string;
    referredBy: string;
    profilePhotoUrl: string;
    upiId: string;
    upiLocked: boolean;
    coinBalance: bigint;
    referralCoinBalance: bigint;
    hasCompletedFirstTask: boolean;
    taskWithdrawalsToday: bigint;
    lastWithdrawalDate: string;
    createdAt: bigint;
}

export interface RMTaskCompletion {
    id: string;
    userId: string;
    taskId: string;
    status: string;
    submittedAt: bigint;
    confirmedAt: bigint;
}

export interface RMWithdrawalRequest {
    id: string;
    userId: string;
    userName: string;
    userPhone: string;
    userUpiId: string;
    coins: bigint;
    amountRs: bigint;
    withdrawalType: string;
    status: string;
    requestedAt: bigint;
    processedAt: bigint;
}

export interface RMAdminWallet {
    balance: bigint;
    upiId: string;
}

export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserRole(): Promise<UserRole>;
    isCallerAdmin(): Promise<boolean>;

    // Tasks
    getTasks(): Promise<RMTask[]>;
    addTask(task: RMTask): Promise<void>;
    updateTask(task: RMTask): Promise<void>;
    deleteTask(id: string): Promise<void>;

    // Users
    registerUser(user: RMUser): Promise<boolean>;
    getUserByPhone(phone: string): Promise<[RMUser] | []>;
    getUserById(id: string): Promise<[RMUser] | []>;
    getUserByUserId(userId: string): Promise<[RMUser] | []>;
    getUserByReferralCode(code: string): Promise<[RMUser] | []>;
    updateUser(user: RMUser): Promise<void>;
    getAllUsers(): Promise<RMUser[]>;

    // Task Completions
    submitCompletion(completion: RMTaskCompletion): Promise<void>;
    confirmCompletion(id: string): Promise<boolean>;
    getCompletionsByUser(userId: string): Promise<RMTaskCompletion[]>;
    getAllCompletions(): Promise<RMTaskCompletion[]>;
    getAllPendingCompletions(): Promise<RMTaskCompletion[]>;

    // Withdrawals
    requestWithdrawal(req: RMWithdrawalRequest): Promise<void>;
    approveWithdrawal(id: string): Promise<boolean>;
    rejectWithdrawal(id: string): Promise<boolean>;
    getWithdrawalsByUser(userId: string): Promise<RMWithdrawalRequest[]>;
    getAllPendingWithdrawals(): Promise<RMWithdrawalRequest[]>;
    getAllWithdrawals(): Promise<RMWithdrawalRequest[]>;

    // Admin Wallet
    getAdminWallet(): Promise<RMAdminWallet>;
    updateAdminWallet(wallet: RMAdminWallet): Promise<void>;

    // OTP
    saveOTP(phone: string, otp: string): Promise<void>;
    getOTP(phone: string): Promise<[string] | []>;
    clearOTP(phone: string): Promise<void>;

    // Password
    savePassword(phone: string, password: string): Promise<void>;
    verifyPassword(phone: string, password: string): Promise<boolean>;
}
